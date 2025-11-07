import express from 'express';
import { UTApi } from 'uploadthing/server';
import type { Wallpaper, WallpaperFeedResponse } from '@chromatica/shared';

const app = express();
const utapi = new UTApi({
  apiKey: process.env.UPLOADTHING_TOKEN,
});

type UploadThingFile = {
  id?: string;
  key?: string;
  fileKey?: string;
  customId?: string | null;
  name?: string;
  fileName?: string;
  size?: number;
  fileSize?: number;
  uploadedAt?: string;
  createdAt?: string;
  url?: string;
  appUrl?: string;
  metadata?: Record<string, unknown> | null;
};

app.get('/wallpapers', async (_req, res) => {
  try {
    const { files = [] } = (await utapi.listFiles({
      limit: 100,
    })) as unknown as {
      files?: UploadThingFile[];
    };

    const items: Wallpaper[] = files
      .map(file => {
        const metadata = (file.metadata ?? {}) as Record<string, unknown>;
        const tags = metadata?.tags;

        return {
          id: file.customId ?? file.key ?? file.fileKey ?? file.id ?? '',
          name: file.name ?? file.fileName ?? 'Untitled',
          description:
            typeof metadata?.description === 'string'
              ? (metadata.description as string)
              : undefined,
          previewUrl: file.appUrl ?? file.url ?? '',
          fullUrl: file.url ?? file.appUrl ?? '',
          size: file.size ?? file.fileSize ?? 0,
          uploadedAt: file.uploadedAt ?? file.createdAt ?? new Date().toISOString(),
          dominantColor:
            typeof metadata?.dominantColor === 'string'
              ? (metadata.dominantColor as string)
              : undefined,
          tags: Array.isArray(tags) ? (tags as unknown[]).map(String) : undefined,
        };
      })
      .filter(item => Boolean(item.fullUrl));

    const response: WallpaperFeedResponse = {
      items,
      generatedAt: new Date().toISOString(),
    };

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(response);
  } catch (error) {
    console.error('[api] failed to list wallpapers', error);
    res.status(500).json({ error: 'Failed to list wallpapers' });
  }
});

app.get('/', (_req, res) => {
  res.json({ status: 'ok', generatedAt: new Date().toISOString() });
});

export default app;
