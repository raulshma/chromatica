import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth';
import { utapi } from '@/lib/uploadthing-server';
import { getWallpapersCollection } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const isAdmin = await requireAdminApiSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: mongoDbIdString } = await params;

  try {
    // Don't try to parse the request URL, we don't need it for this endpoint
    // to avoid the "File URL path must be absolute" error in Next.js error handling

    const wallpapers = await getWallpapersCollection();
    if (!wallpapers) {
      return NextResponse.json({ error: 'MongoDB not configured' }, { status: 500 });
    }

    const { ObjectId: ObjectIdClass } = await import('mongodb');
    let mongoDbId;
    try {
      mongoDbId = new ObjectIdClass(mongoDbIdString);
    } catch {
      return NextResponse.json({ error: 'Invalid wallpaper ID format' }, { status: 400 });
    }

    const doc = await wallpapers.findOne({ _id: mongoDbId });

    if (!doc) {
      return NextResponse.json({ error: 'Wallpaper not found' }, { status: 404 });
    }

    return NextResponse.json({
      _id: doc._id.toString(),
      uploadThingFileKey: doc.uploadThingFileKey,
      url: doc.fullUrl,
      previewUrl: doc.previewUrl || doc.fullUrl,
      fileName: doc.fileName ?? 'Untitled',
      displayName: doc.displayName ?? null,
      description: doc.description ?? null,
      brief: doc.brief ?? null,
      artist: doc.artist ?? null,
      size: doc.size ?? null,
      history: doc.history ?? [],
    });
  } catch (error) {
    console.error('Error in GET /api/admin/wallpapers/[id]', error);
    return NextResponse.json({ error: 'Failed to fetch wallpaper' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const isAdmin = await requireAdminApiSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: mongoDbIdString } = await params;

  try {
    const { ObjectId: ObjectIdClass } = await import('mongodb');
    let mongoDbId;
    try {
      mongoDbId = new ObjectIdClass(mongoDbIdString);
    } catch {
      return NextResponse.json({ error: 'Invalid wallpaper ID format' }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const wallpapers = await getWallpapersCollection();
    if (!wallpapers) {
      return NextResponse.json({ error: 'MongoDB not configured' }, { status: 500 });
    }

    const existing = await wallpapers.findOne({ _id: mongoDbId });
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

    if (typeof body.fileName === 'string' && body.fileName !== (existing?.fileName ?? null)) {
      set.fileName = body.fileName;
      changes.fileName = { from: existing?.fileName ?? null, to: body.fileName };

      // Try to rename file in UploadThing, but do not fail entirely if this fails
      try {
        await utapi.renameFiles([
          { fileKey: existing?.uploadThingFileKey || mongoDbIdString, newName: body.fileName },
        ]);
      } catch (error) {
        console.error('Failed to rename file in UploadThing for wallpaper', {
          mongoDbIdString,
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

    if (typeof body.artist === 'string' && body.artist !== (existing?.artist ?? null)) {
      set.artist = body.artist;
      changes.artist = { from: existing?.artist ?? null, to: body.artist };
    }

    if (typeof body.brief === 'string' && body.brief !== (existing?.brief ?? null)) {
      set.brief = body.brief;
      changes.brief = { from: existing?.brief ?? null, to: body.brief };
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
        { _id: mongoDbId },
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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const isAdmin = await requireAdminApiSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ensure id is treated as plain string, not as path-like
  const { id: mongoDbIdString } = await params;

  try {
    const { ObjectId: ObjectIdClass } = await import('mongodb');
    let mongoDbId;
    try {
      mongoDbId = new ObjectIdClass(mongoDbIdString);
    } catch {
      return NextResponse.json({ error: 'Invalid wallpaper ID format' }, { status: 400 });
    }

    const wallpapers = await getWallpapersCollection();

    // Get the document to find the UploadThing file key
    const doc = wallpapers ? await wallpapers.findOne({ _id: mongoDbId }) : null;
    const uploadThingFileKey = doc?.uploadThingFileKey;

    if (!uploadThingFileKey) {
      return NextResponse.json(
        { error: 'Wallpaper not found or missing file key' },
        { status: 404 },
      );
    }

    // Delete file from UploadThing
    await utapi.deleteFiles([uploadThingFileKey]);

    if (wallpapers) {
      const now = new Date().toISOString();
      await wallpapers.updateOne(
        { _id: mongoDbId },
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
  } catch (error) {
    console.error('Error in DELETE /api/admin/wallpapers/[id]', error);
    return NextResponse.json({ error: 'Failed to delete wallpaper' }, { status: 500 });
  }
}
