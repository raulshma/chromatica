import { createUploadthing } from 'uploadthing/next';
import { ObjectId } from 'mongodb';
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

        const uploadThingFileKey = crypto.randomUUID(); // This will be updated with actual key on completion
        const now = new Date().toISOString();

        const result = await wallpapers.insertOne({
          uploadThingFileKey,
          fileName: 'Pending upload',
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        });

        const mongoDbId = result.insertedId.toString();

        return { mongoDbId };
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
          return { dbStatus: 'unavailable' };
        }

        const mongoDbId = (metadata as { mongoDbId?: string } | undefined)?.mongoDbId;
        if (!mongoDbId) {
          console.warn('[uploadthing] No mongoDbId in metadata, cannot update document');
          return { dbStatus: 'failure' };
        }

        const uploadThingFileKey = file.customId ?? file.key;
        const now = new Date().toISOString();

        const mongoObjectId = new ObjectId(mongoDbId);

        await wallpapers.updateOne(
          { _id: mongoObjectId },
          {
            $set: {
              uploadThingFileKey,
              fileName: file.name ?? 'Wallpaper',
              previewUrl: file.ufsUrl,
              fullUrl: file.ufsUrl,
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

        console.log('[uploadthing] metadata stored for', mongoDbId);
        return { dbStatus: 'success', mongoDbId };
      } catch (error) {
        console.error('[uploadthing] failed to store metadata', error);
        try {
          const wallpapers = await getWallpapersCollection();
          if (wallpapers) {
            const mongoDbId = (metadata as { mongoDbId?: string } | undefined)?.mongoDbId;
            if (mongoDbId) {
              const mongoObjectId = new ObjectId(mongoDbId);
              await wallpapers.updateOne(
                { _id: mongoObjectId },
                { $set: { status: 'failure', updatedAt: new Date().toISOString() } },
                { upsert: true },
              );
            }
          }
        } catch (innerError) {
          console.error('[uploadthing] failed to mark upload as failure', innerError);
        }
        return { dbStatus: 'failure' };
      }
    }),
};

export type OurFileRouter = typeof ourFileRouter;
