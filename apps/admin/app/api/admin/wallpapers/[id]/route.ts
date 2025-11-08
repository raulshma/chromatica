import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth';
import { utapi, uploadthingAppId } from '@/lib/uploadthing-server';
import { getWallpapersCollection } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const isAdmin = await requireAdminApiSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Don't try to parse the request URL, we don't need it for this endpoint
  // to avoid the "File URL path must be absolute" error in Next.js error handling

  // Generate URL using the same pattern as the API project
  const baseUrl = uploadthingAppId
    ? `https://${uploadthingAppId}.ufs.sh/f/${id}`
    : `https://utfs.io/f/${id}`;

  const wallpapers = await getWallpapersCollection();
  const doc = wallpapers ? await wallpapers.findOne({ id }) : null;

  return NextResponse.json({
    id,
    url: baseUrl,
    previewUrl: baseUrl,
    name: doc?.name ?? null,
    displayName: doc?.displayName ?? doc?.name ?? null,
    description: doc?.description ?? null,
    size: doc?.size ?? null,
    history: doc?.history ?? [],
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const isAdmin = await requireAdminApiSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const wallpapers = await getWallpapersCollection();
    if (!wallpapers) {
      return NextResponse.json({ error: 'MongoDB not configured' }, { status: 500 });
    }

    const existing = await wallpapers.findOne({ id });
    const now = new Date().toISOString();

    // Build $set and history changes diff
    const set: Record<string, unknown> = {};
    const changes: Record<string, { from: unknown; to: unknown }> = {};

    if (
      typeof body.displayName === 'string' &&
      body.displayName !== (existing?.displayName ?? null)
    ) {
      set.displayName = body.displayName;
      changes.displayName = { from: existing?.displayName ?? null, to: body.displayName };
    }

    if (typeof body.name === 'string' && body.name !== (existing?.name ?? null)) {
      set.name = body.name;
      changes.name = { from: existing?.name ?? null, to: body.name };

      // Try to rename file in UploadThing, but do not fail entirely if this fails
      try {
        await utapi.renameFiles([{ fileKey: id, newName: body.name }]);
      } catch (error) {
        console.error('Failed to rename file in UploadThing for wallpaper', {
          id,
          error,
        });
      }
    }

    if (
      typeof body.description === 'string' &&
      body.description !== (existing?.description ?? null)
    ) {
      set.description = body.description;
      changes.description = {
        from: existing?.description ?? null,
        to: body.description,
      };
    }

    // Optional image metadata updates from client (after replacing image)
    if (typeof body.previewUrl === 'string') {
      set.previewUrl = body.previewUrl;
    }
    if (typeof body.fullUrl === 'string') {
      set.fullUrl = body.fullUrl;
    }
    if (typeof body.size === 'number') {
      set.size = body.size;
    }

    if (Object.keys(set).length) {
      set.updatedAt = now;
      await wallpapers.updateOne(
        { id },
        {
          $set: set,
          $push: {
            history: {
              at: now,
              changes,
            },
          },
        },
        { upsert: true },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error in POST /api/admin/wallpapers/[id]', error);

    if (error instanceof Error && error.message.includes('File URL path must be absolute')) {
      return NextResponse.json(
        {
          error: 'Invalid file URL path detected',
          details:
            'There appears to be an issue with how file keys are being processed. Check server logs for details.',
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: 'Failed to update wallpaper' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const isAdmin = await requireAdminApiSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ensure id is treated as plain string, not as path-like
  const { id } = await params;
  const fileKey = String(id);

  // Don't try to parse the request URL, we don't need it for this endpoint
  // to avoid the "File URL path must be absolute" error in Next.js error handling

  const wallpapers = await getWallpapersCollection();

  // Delete file from UploadThing
  await utapi.deleteFiles([fileKey]);

  if (wallpapers) {
    const now = new Date().toISOString();
    await wallpapers.updateOne(
      { id: fileKey },
      {
        $set: { status: 'failure', updatedAt: now },
        $push: {
          history: {
            at: now,
            changes: {
              deleted: { from: 'active', to: 'deleted' },
            },
          },
        },
      },
      { upsert: true },
    );
  }

  return NextResponse.json({ ok: true });
}
