import { NextResponse } from 'next/server';
import { UTApi } from 'uploadthing/server';
import { requireAdminApiSession } from '@/lib/auth';
import { utapi, uploadthingAppId } from '@/lib/uploadthing-server';

// Derive file type from UTApi listFiles
type UploadThingFile =
  Awaited<ReturnType<UTApi['listFiles']>> extends {
    files: readonly (infer T)[];
  }
    ? T
    : never;

export async function GET() {
  const authResult = await requireAdminApiSession();
  if (authResult?.status === 401) {
    return authResult;
  }

  try {
    // Fetch files from UploadThing
    const listResult = await utapi.listFiles({
      limit: 100,
    });
    const files = listResult.files as UploadThingFile[];

    // Transform the files to match expected UI format
    const items = files
      .map(file => {
        const key = file.customId ?? file.key ?? file.id;
        if (!key) return null;

        const baseUrl = uploadthingAppId
          ? `https://${uploadthingAppId}.ufs.sh/f/${key}`
          : `https://utfs.io/f/${key}`;

        return {
          id: key,
          name: file.name ?? 'Untitled',
          previewUrl: baseUrl,
          size: file.size,
          uploadedAt: new Date(file.uploadedAt).toISOString(),
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching files from UploadThing:', error);
    return NextResponse.json({ error: 'Failed to fetch wallpapers' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authResult = await requireAdminApiSession();
  if (authResult?.status === 401) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'File key is required' }, { status: 400 });
    }

    // Delete file from UploadThing
    await utapi.deleteFiles([key]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting file from UploadThing:', error);
    return NextResponse.json({ error: 'Failed to delete wallpaper' }, { status: 500 });
  }
}
