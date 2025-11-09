import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { config } from './config.js';

let clientPromise: Promise<MongoClient> | null = null;

async function getClient(): Promise<MongoClient> {
  if (!clientPromise) {
    clientPromise = MongoClient.connect(config.mongodbUri, {
      // modern driver options by default
    });
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(config.mongodbDb);
}

export interface Wallpaper {
  _id?: ObjectId | string;
  uploadThingFileKey: string;
  fileName: string;
  displayName?: string;
  description?: string;
  previewUrl?: string;
  fullUrl?: string;
  size?: number;
  tags?: string[];
  dominantColor?: string;
  artist?: string;
  brief?: string;
  status?: 'pending' | 'success' | 'failure';
  createdAt?: string;
  updatedAt?: string;
  history?: Array<{
    at: string;
    by?: string;
    changes: Record<string, { from: unknown; to: unknown }>;
  }>;
}

export async function getWallpapersCollection(): Promise<Collection<Wallpaper>> {
  const db = await getDb();
  return db.collection<Wallpaper>('wallpapers');
}
