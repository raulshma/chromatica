import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth';
import { getWallpapersCollection } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdminApiSession();
  const { id } = params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const col = await getWallpapersCollection();
  if (!col) {
    return NextResponse.json({ error: 'Metadata store not configured' }, { status: 500 });
  }

  const now = new Date().toISOString();
  const doc = {
    id,
    ...body,
    updatedAt: now,
    createdAt: (body as any).createdAt || now,
  };

  await col.updateOne({ id }, { $set: doc }, { upsert: true });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdminApiSession();
  const { id } = params;

  const col = await getWallpapersCollection();
  if (!col) {
    return NextResponse.json({ error: 'Metadata store not configured' }, { status: 500 });
  }

  await col.deleteOne({ id });

  return NextResponse.json({ ok: true });
}
