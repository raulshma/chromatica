'use server';

import { UTApi } from 'uploadthing/server';
import { getAdminSession } from './auth';
import { utapi, uploadthingAppId } from './uploadthing-server';

// Derive file type from UTApi listFiles
type UploadThingFile =
  Awaited<ReturnType<UTApi['listFiles']>> extends {
    files: readonly (infer T)[];
  }
    ? T
    : never;

// Helper function to check authentication
async function ensureAdminSession() {
  const sessionResult = await getAdminSession();
  if (!sessionResult.ok) {
    throw new Error('Unauthorized');
  }
  return sessionResult;
}

// Server-side function to fetch wallpapers directly without HTTP round-trip
export async function getWallpapersServer() {
  // Verify the calling context has admin session
  await ensureAdminSession();

  // Check environment variables
  if (!process.env.UPLOADTHING_TOKEN) {
    console.error('UPLOADTHING_TOKEN is not set');
    throw new Error('Server configuration error: Missing UploadThing token');
  }

  if (!process.env.UPLOADTHING_APP_ID) {
    console.error('UPLOADTHING_APP_ID is not set');
    throw new Error('Server configuration error: Missing UploadThing app ID');
  }

  try {
    // Fetch files from UploadThing directly
    console.log('Fetching files from UploadThing...');
    const listResult = await utapi.listFiles({
      limit: 100,
    });

    const files = listResult.files as UploadThingFile[];

    if (!files || !Array.isArray(files)) {
      console.error('Invalid response from UploadThing:', listResult);
      throw new Error('Invalid response from file storage service');
    }

    console.log(`Found ${files.length} files in UploadThing`);

    // Transform the files to match expected UI format
    const items = files
      .map((file, index) => {
        const key = file.customId ?? file.key ?? file.id;
        if (!key) {
          console.warn(`File at index ${index} has no key, customId, or id`);
          return null;
        }

        // Validate key is a string and not empty
        if (typeof key !== 'string' || key.trim() === '') {
          console.warn(`Invalid file key at index ${index}:`, key);
          return null;
        }

        // Clean the key to ensure it's a valid URL path component
        // Make sure to remove any URL encoding that might have been applied
        let cleanKey = key.trim();

        // If the key already looks like a URL, extract just the file key part
        if (cleanKey.includes('://')) {
          try {
            const url = new URL(cleanKey);
            cleanKey = url.pathname.startsWith('/f/')
              ? url.pathname.substring(3) // Remove '/f/' prefix
              : url.pathname.substring(1); // Remove leading slash
          } catch {
            // If URL parsing fails, just remove protocol and domain
            cleanKey = cleanKey.replace(/^https?:\/\/[^\/]+\/f\//, '');
          }
        }

        // Replace spaces with %20 to ensure valid URLs
        cleanKey = cleanKey.replace(/\s+/g, '%20');

        const baseUrl = uploadthingAppId
          ? `https://${uploadthingAppId}.ufs.sh/f/${cleanKey}`
          : `https://utfs.io/f/${cleanKey}`;

        return {
          id: cleanKey,
          name: file.name ?? 'Untitled',
          previewUrl: baseUrl,
          size: file.size,
          uploadedAt: new Date(file.uploadedAt).toISOString(),
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    console.log(`Successfully processed ${items.length} files`);

    return { items };
  } catch (error) {
    console.error('Error fetching files from UploadThing:', error);
    throw new Error('Failed to fetch wallpapers');
  }
}

// Server-side function to delete a wallpaper directly
export async function deleteWallpaperServer(key: string) {
  // Verify the calling context has admin session
  await ensureAdminSession();

  if (!key) {
    throw new Error('File key is required');
  }

  try {
    // Delete file from UploadThing directly
    await utapi.deleteFiles([key]);
    return { success: true };
  } catch (error) {
    console.error('Error deleting file from UploadThing:', error);
    throw new Error('Failed to delete wallpaper');
  }
}
