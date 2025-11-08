import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth';
import { utapi, uploadthingAppId } from '@/lib/uploadthing-server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAdminApiSession();
  if (authResult?.status === 401) {
    return authResult;
  }

  const { id } = params;

  // Don't try to parse the request URL, we don't need it for this endpoint
  // to avoid the "File URL path must be absolute" error in Next.js error handling

  // Generate URL using the same pattern as the API project
  const baseUrl = uploadthingAppId
    ? `https://${uploadthingAppId}.ufs.sh/f/${id}`
    : `https://utfs.io/f/${id}`;

  return NextResponse.json({
    id,
    url: baseUrl,
    previewUrl: baseUrl,
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAdminApiSession();
  if (authResult?.status === 401) {
    return authResult;
  }

  const { id } = params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // Don't try to parse the request URL, we don't need it for this endpoint
  // to avoid the "File URL path must be absolute" error in Next.js error handling

  // For UploadThing, we can rename files if needed
  if (body.name && typeof body.name === 'string') {
    await utapi.renameFiles([{ fileKey: id, newName: body.name }]);
    return NextResponse.json({ ok: true });
  }

  // No metadata updates needed for UploadThing
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAdminApiSession();
  if (authResult?.status === 401) {
    return authResult;
  }

  // Ensure id is treated as plain string, not as path-like
  const { id } = params;
  const fileKey = String(id);

  // Don't try to parse the request URL, we don't need it for this endpoint
  // to avoid the "File URL path must be absolute" error in Next.js error handling

  // Delete file from UploadThing
  await utapi.deleteFiles([fileKey]);

  return NextResponse.json({ ok: true });
}
