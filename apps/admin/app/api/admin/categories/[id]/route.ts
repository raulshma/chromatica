import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth';
import { getCategoriesCollection } from '@/lib/db';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;

  const col = await getCategoriesCollection();
  if (!col) {
    return NextResponse.json({ error: 'Metadata store not configured' }, { status: 500 });
  }

  await col.deleteOne({ id });

  return NextResponse.json({ ok: true });
}
