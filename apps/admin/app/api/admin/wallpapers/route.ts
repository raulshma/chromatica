import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth';
import { getWallpapersCollection } from '@/lib/db';

export async function GET() {
  await requireAdminSession();

  const col = await getWallpapersCollection();
  if (!col) {
    // Mongo not configured; return empty set gracefully.
    return NextResponse.json({ items: [] });
  }

  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  return NextResponse.json({ items: docs });
}
