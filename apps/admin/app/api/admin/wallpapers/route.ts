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
  console.log('Starting GET /api/admin/wallpapers');

  // Check environment variables
  if (!process.env.UPLOADTHING_TOKEN) {
    console.error('UPLOADTHING_TOKEN is not set');
    return NextResponse.json(
      { error: 'Server configuration error: Missing UploadThing token' },
      { status: 500 },
    );
  }

  if (!process.env.UPLOADTHING_APP_ID) {
    console.error('UPLOADTHING_APP_ID is not set');
    return NextResponse.json(
      { error: 'Server configuration error: Missing UploadThing app ID' },
      { status: 500 },
    );
  }

  const isAuthenticated = await requireAdminApiSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch files from UploadThing
    console.log('Fetching files from UploadThing...');
    const listResult = await utapi.listFiles({
      limit: 100,
    });

    console.log('UploadThing list result:', JSON.stringify(listResult, null, 2));
    const files = listResult.files as UploadThingFile[];

    if (!files || !Array.isArray(files)) {
      console.error('Invalid response from UploadThing:', listResult);
      return NextResponse.json(
        { error: 'Invalid response from file storage service' },
        { status: 500 },
      );
    }

    console.log(`Found ${files.length} files in UploadThing`);

    // Transform the files to match expected UI format
    const items = files
      .map((file, index) => {
        console.log(`Processing file ${index}:`, JSON.stringify(file, null, 2));

        const uploadThingFileKey = file.customId ?? file.key ?? file.id;
        if (!uploadThingFileKey) {
          console.warn(`File at index ${index} has no uploadThingFileKey, customId, or id`);
          return null;
        }

        // Validate key is a string and not empty
        if (typeof uploadThingFileKey !== 'string' || uploadThingFileKey.trim() === '') {
          console.warn(`Invalid uploadThingFileKey at index ${index}:`, uploadThingFileKey);
          return null;
        }

        // Clean the key to ensure it's a valid URL path component
        // Make sure to remove any URL encoding that might have been applied
        let cleanKey = uploadThingFileKey.trim();

        // If the key already looks like a URL, extract just the file key part
        if (cleanKey.includes('://')) {
          try {
            const url = new URL(cleanKey);
            cleanKey = url.pathname.startsWith('/f/')
              ? url.pathname.substring(3) // Remove '/f/' prefix
              : url.pathname.substring(1); // Remove leading slash
          } catch {
            // If URL parsing fails, just remove protocol and domain
            cleanKey = cleanKey.replace(/^https?:\/\/[^\/]+\/f\//, '');
          }
        }

        // Replace spaces with %20 to ensure valid URLs
        cleanKey = cleanKey.replace(/\s+/g, '%20');

        const baseUrl = uploadthingAppId
          ? `https://${uploadthingAppId}.ufs.sh/f/${cleanKey}`
          : `https://utfs.io/f/${cleanKey}`;

        console.log(`Generated URL for file ${index}:`, baseUrl);
        return {
          _id: cleanKey,
          uploadThingFileKey: cleanKey,
          fileName: file.name ?? 'Untitled',
          previewUrl: baseUrl,
          size: file.size,
          uploadedAt: new Date(file.uploadedAt).toISOString(),
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    console.log(`Successfully processed ${items.length} files`);

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching files from UploadThing:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');

    // Check if it's the specific URL error we're trying to fix
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

    return NextResponse.json({ error: 'Failed to fetch wallpapers' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const isAuthenticated = await requireAdminApiSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Extract key from request URL without creating a URL object
    // to avoid the "File URL path must be absolute" error in Next.js error handling
    let key: string | null = null;

    // Try to parse the URL only if needed
    if (request.url.includes('key=')) {
      const urlPart = request.url.split('?')[1]; // Get query string part
      if (urlPart) {
        const params = new URLSearchParams(urlPart);
        key = params.get('key');
      }
    }
    if (!key) {
      return NextResponse.json({ error: 'File key is required' }, { status: 400 });
    }

    // Delete file from UploadThing
    await utapi.deleteFiles([key]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting file from UploadThing:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');

    // Check if it's the specific URL error we're trying to fix
    if (error instanceof Error && error.message.includes('File URL path must be absolute')) {
      return NextResponse.json(
        {
          error: 'Invalid URL path detected',
          details:
            'There appears to be an issue with file URL processing. Check server logs for details.',
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: 'Failed to delete wallpaper' }, { status: 500 });
  }
}
