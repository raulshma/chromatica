import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth';
import { getCategoriesCollection } from '@/lib/db';

export async function GET() {
  await requireAdminSession();

  const col = await getCategoriesCollection();
  if (!col) {
    return NextResponse.json({ items: [] });
  }

  const docs = await col.find({}).sort({ name: 1 }).toArray();
  return NextResponse.json({ items: docs });
}

export async function POST(req: NextRequest) {
  await requireAdminSession();
  const body = (await req.json().catch(() => ({}))) as { id?: string; name?: string };

  if (!body || typeof body.id !== 'string' || typeof body.name !== 'string') {
    return NextResponse.json({ error: 'Invalid category payload' }, { status: 400 });
  }

  const col = await getCategoriesCollection();
  if (!col) {
    return NextResponse.json({ error: 'Metadata store not configured' }, { status: 500 });
  }

  const doc = {
    ...body,
  };

  await col.updateOne({ id: body.id }, { $set: doc }, { upsert: true });

  return NextResponse.json({ ok: true });
}
