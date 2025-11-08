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

/**
 * Generate CDN URL for an UploadThing file key
 */
function generateWallpaperUrl(uploadThingFileKey: string): string {
  return uploadthingAppId
    ? `https://${uploadthingAppId}.ufs.sh/f/${uploadThingFileKey}`
    : `https://utfs.io/f/${uploadThingFileKey}`;
}

app.get('/wallpapers', wallpapersLimiter, wallpapersCacheMiddleware, async (_req, res) => {
  try {
    const listResult = await utapi.listFiles({
      limit: 100,
    });
    const files = listResult.files as UploadThingFile[];

    const items: Wallpaper[] = files
      .map((file, index) => {
        const uploadThingFileKey = file.customId ?? file.key ?? file.id;
        if (!uploadThingFileKey) {
          console.warn(`[api] File at index ${index} has no uploadThingFileKey`);
          return null;
        }

        const url = generateWallpaperUrl(uploadThingFileKey);

        const item: Wallpaper = {
          _id: uploadThingFileKey, // Use UploadThing key as MongoDB _id for now (serves as unique ID)
          uploadThingFileKey,
          fileName: file.name ?? 'Untitled',
          displayName: undefined,
          description: undefined,
          previewUrl: url,
          fullUrl: url,
          size: file.size,
          uploadedAt: new Date(file.uploadedAt).toISOString(),
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

app.get('/wallpapers/:uploadThingFileKey', async (req, res) => {
  try {
    const { uploadThingFileKey } = req.params;

    // Get all wallpapers and find the matching one
    const listResult = await utapi.listFiles({
      limit: 100,
    });
    const files = listResult.files as UploadThingFile[];

    // Find the file with matching key
    const file = files.find(f => {
      const key = f.customId ?? f.key ?? f.id;
      return key === uploadThingFileKey;
    });

    if (!file) {
      return res.status(404).json({ error: 'Wallpaper not found' });
    }

    const url = generateWallpaperUrl(uploadThingFileKey);

    const wallpaper: Wallpaper = {
      _id: uploadThingFileKey,
      uploadThingFileKey,
      fileName: file.name ?? 'Untitled',
      displayName: undefined,
      description: undefined,
      previewUrl: url,
      fullUrl: url,
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
