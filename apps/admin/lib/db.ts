import { MongoClient, Db, Collection } from 'mongodb';

// Minimal Mongo helper for admin metadata.
// Uses a single database and two collections: wallpapers and categories.
// Only used where needed by admin API routes.
// Note: Ensure `mongodb` is added as a dependency in `apps/admin/package.json` for this helper to work.

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'chromatica';

if (!uri) {
  console.warn('[admin] MONGODB_URI is not set; admin metadata features will be disabled.');
}

let clientPromise: Promise<MongoClient> | null = null;

async function getClient(): Promise<MongoClient | null> {
  if (!uri) return null;
  if (!clientPromise) {
    clientPromise = MongoClient.connect(uri, {
      // modern driver options by default
    });
  }
  return clientPromise;
}

export async function getDb(): Promise<Db | null> {
  const client = await getClient();
  return client ? client.db(dbName) : null;
}

export interface AdminWallpaperMeta {
  id: string;
  name?: string;
  description?: string;
  previewUrl?: string;
  fullUrl?: string;
  size?: number;
  tags?: string[];
  dominantColor?: string;
  status?: 'pending' | 'success' | 'failure';
  createdAt?: string;
  updatedAt?: string;
  history?: Array<{
    at: string;
    by?: string;
    changes: Record<string, { from: unknown; to: unknown }>;
  }>;
}

export interface AdminCategory {
  id: string;
  name: string;
  description?: string;
}

export async function getWallpapersCollection(): Promise<Collection<AdminWallpaperMeta> | null> {
  const db = await getDb();
  return db ? db.collection<AdminWallpaperMeta>('wallpapers') : null;
}

export async function getCategoriesCollection(): Promise<Collection<AdminCategory> | null> {
  const db = await getDb();
  return db ? db.collection<AdminCategory>('categories') : null;
}
