import express from 'express';
import { json } from 'express';
import { UTApi } from 'uploadthing/server';
import type { Wallpaper, WallpaperFeedResponse } from '@chromatica/shared';
import { applySecurityMiddleware } from './middleware/security.js';
import { globalLimiter, wallpapersLimiter } from './middleware/rateLimit.js';
import { wallpapersCacheMiddleware, setWallpapersCache } from './middleware/cache.js';
import { config } from './config.js';

const app = express();
applySecurityMiddleware(app);
app.use(globalLimiter);
app.use(json());

const utapi = new UTApi({
  token: config.uploadthingToken,
  logLevel: 'Debug',
});

// Derive file type from UTApi listFiles
type UploadThingFile =
  Awaited<ReturnType<UTApi['listFiles']>> extends {
    files: readonly (infer T)[];
  }
    ? T
    : never;

const uploadthingAppId = config.uploadthingAppId;

app.get('/wallpapers', wallpapersLimiter, wallpapersCacheMiddleware, async (_req, res) => {
  try {
    const listResult = await utapi.listFiles({
      limit: 100,
    });
    const files = listResult.files as UploadThingFile[];

    const items: Wallpaper[] = files
      .map(file => {
        const key = file.customId ?? file.key ?? file.id;
        if (!key) return null;

        const baseUrl = uploadthingAppId
          ? `https://${uploadthingAppId}.ufs.sh/f/${key}`
          : `https://utfs.io/f/${key}`;

        const item: Wallpaper = {
          id: key,
          name: file.name ?? 'Untitled',
          description: undefined,
          previewUrl: baseUrl,
          fullUrl: baseUrl,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          dominantColor: undefined,
          tags: undefined,
        };

        return item;
      })
      .filter((item): item is Wallpaper => Boolean(item));

    const response: WallpaperFeedResponse = {
      items,
      generatedAt: new Date().toISOString(),
    };

    await setWallpapersCache(response);

    res.json(response);
  } catch (error) {
    console.error('[api] failed to list wallpapers', error);
    res.status(500).json({ error: 'Failed to list wallpapers' });
  }
});

app.get('/wallpapers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get all wallpapers and find the matching one
    const listResult = await utapi.listFiles({
      limit: 100,
    });
    const files = listResult.files as UploadThingFile[];

    // Find the file with matching key
    const file = files.find(f => {
      const key = f.customId ?? f.key ?? f.id;
      return key === id;
    });

    if (!file) {
      return res.status(404).json({ error: 'Wallpaper not found' });
    }

    const baseUrl = uploadthingAppId
      ? `https://${uploadthingAppId}.ufs.sh/f/${id}`
      : `https://utfs.io/f/${id}`;

    const wallpaper: Wallpaper = {
      id,
      name: file.name ?? 'Untitled',
      description: undefined,
      previewUrl: baseUrl,
      fullUrl: baseUrl,
      size: file.size,
      uploadedAt: new Date(file.uploadedAt).toISOString(),
      dominantColor: undefined,
      tags: undefined,
    };

    res.json(wallpaper);
  } catch (error) {
    console.error('[api] failed to get wallpaper', error);
    res.status(500).json({ error: 'Failed to get wallpaper' });
  }
});

app.get('/', (_req, res) => {
  res.json({ status: 'ok', generatedAt: new Date().toISOString() });
});

const port = config.port;
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
