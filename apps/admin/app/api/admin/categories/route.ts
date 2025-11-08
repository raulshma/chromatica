import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth';
import { getCategoriesCollection } from '@/lib/db';

export async function GET() {
  try {
    const isAuthenticated = await requireAdminApiSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const col = await getCategoriesCollection();
    if (!col) {
      return NextResponse.json({ items: [] });
    }

    const docs = await col.find({}).sort({ name: 1 }).toArray();
    return NextResponse.json({ items: docs });
  } catch (error) {
    console.error('[GET /api/admin/categories] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch categories',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAuthenticated = await requireAdminApiSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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
  } catch (error) {
    console.error('[POST /api/admin/categories] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to save category',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
