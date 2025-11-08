import { createUploadthing } from 'uploadthing/next';
import { getWallpapersCollection } from '@/lib/db';

const f = createUploadthing();

export const ourFileRouter = {
  wallpaperImage: f({ image: { maxFileSize: '16MB' } })
    .middleware(async () => {
      // Optionally enforce admin auth here later.
      // Pre-create a Mongo document to track this upload lifecycle.
      try {
        const wallpapers = await getWallpapersCollection();
        if (!wallpapers) {
          console.warn('[uploadthing] MongoDB not available; cannot create pre-upload document.');
          return {};
        }

        const uploadId = crypto.randomUUID();
        const now = new Date().toISOString();

        await wallpapers.insertOne({
          id: uploadId,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        });

        return { uploadId };
      } catch (error) {
        console.error('[uploadthing] failed to create pre-upload document', error);
        return {};
      }
    })
    .onUploadComplete(async ({ file, metadata }) => {
      try {
        const wallpapers = await getWallpapersCollection();
        if (!wallpapers) {
          console.warn('[uploadthing] MongoDB not available; skipping metadata persist.');
          return;
        }

        const uploadId = (metadata as { uploadId?: string } | undefined)?.uploadId ?? file.key;
        const now = new Date().toISOString();

        await wallpapers.updateOne(
          { id: uploadId },
          {
            $set: {
              id: uploadId,
              name: file.name ?? null,
              previewUrl: file.url,
              fullUrl: file.url,
              size: file.size ?? null,
              status: 'success',
              updatedAt: now,
            },
            $push: {
              history: {
                at: now,
                changes: {
                  created: { from: null, to: 'upload-complete' },
                },
              },
            },
          },
          { upsert: true },
        );

        console.log('[uploadthing] metadata stored for', uploadId);
      } catch (error) {
        console.error('[uploadthing] failed to store metadata', error);
        try {
          const wallpapers = await getWallpapersCollection();
          if (wallpapers) {
            const uploadId = (metadata as { uploadId?: string } | undefined)?.uploadId ?? file.key;
            await wallpapers.updateOne(
              { id: uploadId },
              { $set: { status: 'failure', updatedAt: new Date().toISOString() } },
              { upsert: true },
            );
          }
        } catch (innerError) {
          console.error('[uploadthing] failed to mark upload as failure', innerError);
        }
      }
    }),
};

export type OurFileRouter = typeof ourFileRouter;
