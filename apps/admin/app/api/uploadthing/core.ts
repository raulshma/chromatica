import { createUploadthing } from 'uploadthing/next';

const f = createUploadthing();

export const ourFileRouter = {
  wallpaperImage: f({ image: { maxFileSize: '16MB' } })
    .middleware(async () => {
      // Admin auth is enforced at the UI; you can also validate here if desired.
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      // Hook for any post-upload actions if needed later.
      console.log('[uploadthing] uploaded', file.name, file.key);
    }),
};

export type OurFileRouter = typeof ourFileRouter;
