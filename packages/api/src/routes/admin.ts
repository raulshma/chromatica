import type { Request, Response } from 'express';
import { Router } from 'express';
import type { Wallpaper, WallpaperFeedResponse, WallpaperCollection } from '@chromatica/shared';
import { getRedisClient } from '../redis-client.js';
import { requireAdminApiToken } from '../middleware/adminAuth.js';

const ADMIN_WALLPAPER_META_KEY = 'admin:wallpapers:meta';
const ADMIN_CATEGORIES_KEY = 'admin:categories';

export const adminRouter = Router();

adminRouter.use(requireAdminApiToken);

adminRouter.get('/wallpapers', async (_req: Request, res: Response) => {
  try {
    const redis = getRedisClient();
    const metaRaw = redis ? await redis.hGetAll(ADMIN_WALLPAPER_META_KEY) : {};
    const items: Wallpaper[] = Object.entries(metaRaw).map(([id, value]) => {
      const data = JSON.parse(value) as Partial<Wallpaper>;
      return {
        id,
        name: data.name ?? 'Untitled',
        previewUrl: data.previewUrl ?? '',
        fullUrl: data.fullUrl ?? data.previewUrl ?? '',
        size: data.size,
        uploadedAt: data.uploadedAt ?? new Date().toISOString(),
        description: data.description,
        tags: data.tags,
        dominantColor: data.dominantColor,
      } satisfies Wallpaper;
    });

    const response: WallpaperFeedResponse = {
      items,
      generatedAt: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error('[api] failed to get admin wallpapers', error);
    res.status(500).json({ error: 'Failed to fetch admin wallpapers' });
  }
});

adminRouter.post('/wallpapers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const redis = getRedisClient();
    if (!redis) return res.status(500).json({ error: 'No Redis configured' });

    const meta = req.body as Partial<Wallpaper>;
    await redis.hSet(ADMIN_WALLPAPER_META_KEY, id, JSON.stringify(meta));
    res.json({ ok: true });
  } catch (error) {
    console.error('[api] failed to upsert wallpaper meta', error);
    res.status(500).json({ error: 'Failed to save wallpaper metadata' });
  }
});

adminRouter.delete('/wallpapers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const redis = getRedisClient();
    if (!redis) return res.status(500).json({ error: 'No Redis configured' });

    await redis.hDel(ADMIN_WALLPAPER_META_KEY, id);

    res.json({ ok: true });
  } catch (error) {
    console.error('[api] failed to delete wallpaper meta', error);
    res.status(500).json({ error: 'Failed to delete wallpaper metadata' });
  }
});

adminRouter.get('/categories', async (_req: Request, res: Response) => {
  try {
    const redis = getRedisClient();
    const raw = redis ? await redis.get(ADMIN_CATEGORIES_KEY) : null;
    const categories = (raw ? (JSON.parse(raw) as WallpaperCollection[]) : []) satisfies WallpaperCollection[];
    res.json({ items: categories });
  } catch (error) {
    console.error('[api] failed to list categories', error);
    res.status(500).json({ error: 'Failed to list categories' });
  }
});

adminRouter.post('/categories', async (req: Request, res: Response) => {
  try {
    const redis = getRedisClient();
    if (!redis) return res.status(500).json({ error: 'No Redis configured' });

    const incoming = req.body as WallpaperCollection;
    const raw = (await redis.get(ADMIN_CATEGORIES_KEY)) ?? '[]';
    const existing = JSON.parse(raw) as WallpaperCollection[];

    const updated = [...existing.filter(c => c.id !== incoming.id), incoming];
    await redis.set(ADMIN_CATEGORIES_KEY, JSON.stringify(updated));

    res.json({ ok: true });
  } catch (error) {
    console.error('[api] failed to upsert category', error);
    res.status(500).json({ error: 'Failed to upsert category' });
  }
});

adminRouter.delete('/categories/:id', async (req: Request, res: Response) => {
  try {
    const redis = getRedisClient();
    if (!redis) return res.status(500).json({ error: 'No Redis configured' });

    const { id } = req.params;
    const raw = (await redis.get(ADMIN_CATEGORIES_KEY)) ?? '[]';
    const existing = JSON.parse(raw) as WallpaperCollection[];

    const updated = existing.filter(c => c.id !== id);
    await redis.set(ADMIN_CATEGORIES_KEY, JSON.stringify(updated));

    res.json({ ok: true });
  } catch (error) {
    console.error('[api] failed to delete category', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});
