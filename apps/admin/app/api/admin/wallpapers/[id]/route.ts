import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth';
import { utapi, uploadthingAppId } from '@/lib/uploadthing-server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAdminApiSession();
  if (authResult?.status === 401) {
    return authResult;
  }

  const { id } = params;

  try {
    // Generate URL using the same pattern as the API project
    const baseUrl = uploadthingAppId
      ? `https://${uploadthingAppId}.ufs.sh/f/${id}`
      : `https://utfs.io/f/${id}`;

    return NextResponse.json({
      id,
      url: baseUrl,
      previewUrl: baseUrl,
    });
  } catch (error) {
    console.error('Error fetching file from UploadThing:', error);
    return NextResponse.json({ error: 'Failed to fetch wallpaper' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAdminApiSession();
  if (authResult?.status === 401) {
    return authResult;
  }

  const { id } = params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // For UploadThing, we can rename files if needed
  if (body.name && typeof body.name === 'string') {
    try {
      await utapi.renameFiles([{ fileKey: id, newName: body.name }]);
      return NextResponse.json({ ok: true });
    } catch (error) {
      console.error('Error renaming file in UploadThing:', error);
      return NextResponse.json({ error: 'Failed to update wallpaper' }, { status: 500 });
    }
  }

  // No metadata updates needed for UploadThing
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAdminApiSession();
  if (authResult?.status === 401) {
    return authResult;
  }

  const { id } = params;

  try {
    // Delete file from UploadThing
    await utapi.deleteFiles([id]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting file from UploadThing:', error);
    return NextResponse.json({ error: 'Failed to delete wallpaper' }, { status: 500 });
  }
}
