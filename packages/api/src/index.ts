import express, { Request, Response } from 'express';
import { json } from 'express';
import type { WallpaperFeedResponse } from '@chromatica/shared';
import type { Wallpaper as DbWallpaper } from '@chromatica/shared';
import { applySecurityMiddleware } from './middleware/security.js';
import { globalLimiter, wallpapersLimiter } from './middleware/rateLimit.js';
import { wallpapersCacheMiddleware, setWallpapersCache } from './middleware/cache.js';
import { config } from './config.js';
import { getWallpapersCollection } from './db.js';

const app = express();
applySecurityMiddleware(app);
app.use(globalLimiter);
app.use(json());

app.get(
  '/wallpapers',
  wallpapersLimiter,
  wallpapersCacheMiddleware,
  async (_req: Request, res: Response) => {
    try {
      const collection = await getWallpapersCollection();

      // Query MongoDB for wallpapers, excluding failed ones
      const dbWallpapers = await collection
        .find({
          $or: [{ status: { $exists: false } }, { status: { $ne: 'failure' } }],
        })
        .sort({ updatedAt: -1, createdAt: -1 })
        .toArray();

      const items: DbWallpaper[] = dbWallpapers.map(wallpaper => {
        // Convert MongoDB ObjectId to string
        const _id =
          typeof wallpaper._id === 'string' ? wallpaper._id : (wallpaper._id?.toString() ?? '');

        const item: DbWallpaper = {
          _id,
          uploadThingFileKey: wallpaper.uploadThingFileKey,
          fileName: wallpaper.fileName,
          displayName: wallpaper.displayName,
          description: wallpaper.description,
          previewUrl: wallpaper.previewUrl ?? '',
          fullUrl: wallpaper.fullUrl ?? '',
          size: wallpaper.size ?? 0,
          uploadedAt: wallpaper.createdAt ?? new Date().toISOString(),
          dominantColor: wallpaper.dominantColor,
          tags: wallpaper.tags,
          artist: wallpaper.artist,
          brief: wallpaper.brief,
        };

        return item;
      });

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
  },
);

app.get('/wallpapers/:uploadThingFileKey', async (req: Request, res: Response) => {
  try {
    const { uploadThingFileKey } = req.params;

    const collection = await getWallpapersCollection();

    // Find the wallpaper by uploadThingFileKey
    const dbWallpaper = await collection.findOne({
      uploadThingFileKey,
    });

    if (!dbWallpaper) {
      return res.status(404).json({ error: 'Wallpaper not found' });
    }

    // Convert MongoDB ObjectId to string
    const _id =
      typeof dbWallpaper._id === 'string' ? dbWallpaper._id : (dbWallpaper._id?.toString() ?? '');

    const wallpaper: DbWallpaper = {
      _id,
      uploadThingFileKey: dbWallpaper.uploadThingFileKey,
      fileName: dbWallpaper.fileName,
      displayName: dbWallpaper.displayName,
      description: dbWallpaper.description,
      previewUrl: dbWallpaper.previewUrl ?? '',
      fullUrl: dbWallpaper.fullUrl ?? '',
      size: dbWallpaper.size ?? 0,
      uploadedAt: dbWallpaper.createdAt ?? new Date().toISOString(),
      dominantColor: dbWallpaper.dominantColor,
      tags: dbWallpaper.tags,
      artist: dbWallpaper.artist,
      brief: dbWallpaper.brief,
    };

    res.json(wallpaper);
  } catch (error) {
    console.error('[api] failed to get wallpaper', error);
    res.status(500).json({ error: 'Failed to get wallpaper' });
  }
});

app.get('/', (_req: Request, res: Response) => {
  res.json({ status: 'ok', generatedAt: new Date().toISOString() });
});

const port = config.port;
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
