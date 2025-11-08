'use server';

import { getAdminSession } from './auth';
import { utapi } from './uploadthing-server';
import { getWallpapersCollection } from './db';

// Helper function to check authentication
async function ensureAdminSession() {
  const sessionResult = await getAdminSession();
  if (!sessionResult.ok) {
    throw new Error('Unauthorized');
  }
  return sessionResult;
}

// Server-side function to fetch wallpapers from MongoDB metadata
export async function getWallpapersServer() {
  // Verify the calling context has admin session
  await ensureAdminSession();

  try {
    const wallpapers = await getWallpapersCollection();
    if (!wallpapers) {
      console.warn('[admin] MongoDB not available; returning empty wallpapers list.');
      return { items: [] };
    }

    // Fetch non-failed wallpapers, newest first
    const docs = await wallpapers
      .find({ $or: [{ status: { $exists: false } }, { status: { $ne: 'failure' } }] })
      .sort({ updatedAt: -1, createdAt: -1 })
      .toArray();

    const items = docs.map(doc => ({
      id: doc.id,
      name: doc.name ?? undefined,
      description: doc.description ?? undefined,
      previewUrl: doc.previewUrl ?? undefined,
      size: doc.size ?? undefined,
    }));

    return { items };
  } catch (error) {
    console.error('[admin] Failed to load wallpapers from MongoDB', error);
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
