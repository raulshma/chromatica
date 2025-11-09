'use server';

import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { requireAdminApiSession } from '@/lib/auth';
import { resizeImageToBase64 } from '@/lib/image-resize';
import { IMAGE_FETCH_TIMEOUT_MS, MAX_IMAGE_SIZE_BYTES } from '@/lib/constants';

export async function POST(req: NextRequest) {
  const isAdmin = await requireAdminApiSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;
    const imageUrl = formData.get('imageUrl') as string | null;
    const displayName = formData.get('displayName') as string | null;

    if (!imageFile && !imageUrl) {
      return NextResponse.json(
        { error: 'Either image file or image URL is required' },
        { status: 400 },
      );
    }

    if (!displayName) {
      return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
    }

    let base64Image: string;

    if (imageFile) {
      // Convert file to buffer
      const arrayBuffer = await imageFile.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);

      // Resize image and convert to base64
      try {
        base64Image = await resizeImageToBase64(imageBuffer, 512);
      } catch (resizeError) {
        console.error('Error processing uploaded image:', resizeError);
        const errorMessage = resizeError instanceof Error ? resizeError.message : 'Unknown error';
        return NextResponse.json(
          { error: `Failed to process uploaded image: ${errorMessage}` },
          { status: 400 },
        );
      }
    } else if (imageUrl) {
      // Validate that the URL uses HTTPS for security
      if (process.env.NODE_ENV === 'production' && !imageUrl.startsWith('https://')) {
        return NextResponse.json(
          {
            error:
              'In production environment, only HTTPS image URLs are allowed for security reasons',
          },
          { status: 400 },
        );
      }

      // Fetch image from URL and convert to base64
      let response: Response;
      try {
        response = await fetch(imageUrl, {
          // Set a timeout to prevent hanging
          signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS),
        });
      } catch (fetchError) {
        console.error('Error fetching image URL:', {
          imageUrl,
          error: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        });

        const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
        if (errorMessage.includes('abort')) {
          return NextResponse.json(
            {
              error:
                'Image fetch timed out. The URL may be slow or unreachable. Please try uploading the file directly instead.',
              details: `Timeout after ${IMAGE_FETCH_TIMEOUT_MS}ms while downloading image`,
            },
            { status: 408 }, // 408 Request Timeout
          );
        }

        return NextResponse.json(
          {
            error:
              'Unable to fetch image from URL. The URL may be expired or inaccessible. Please try uploading the file directly instead.',
            details: errorMessage,
          },
          { status: 400 },
        );
      }

      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch image from URL: HTTP ${response.status}` },
          { status: 400 },
        );
      }

      // Check content-length and reject oversized files
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        const fileSizeBytes = parseInt(contentLength, 10);
        if (fileSizeBytes > MAX_IMAGE_SIZE_BYTES) {
          const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);
          const maxSizeMB = (MAX_IMAGE_SIZE_BYTES / (1024 * 1024)).toFixed(0);
          return NextResponse.json(
            {
              error: `Image file is too large (${fileSizeMB} MB). Maximum allowed size is ${maxSizeMB} MB.`,
            },
            { status: 413 }, // 413 Payload Too Large
          );
        }
      }

      const arrayBuffer = await response.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);

      // Resize image and convert to base64
      try {
        base64Image = await resizeImageToBase64(imageBuffer, 512);
      } catch (resizeError) {
        console.error('Error processing fetched image:', resizeError);
        const errorMessage = resizeError instanceof Error ? resizeError.message : 'Unknown error';
        return NextResponse.json(
          { error: `Failed to process fetched image: ${errorMessage}` },
          { status: 400 },
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Either image file or image URL is required' },
        { status: 400 },
      );
    }

    // Generate brief using Gemini vision
    const { text: resultText, reasoningText } = await generateText({
      model: google('gemini-2.5-flash'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a creative copywriter. Based on this wallpaper image and its display name "${displayName}", write a single concise 1-2 sentence brief that describes the wallpaper's essence and appeal. Focus on the visual style, mood, and why someone would want to use it. Keep it under 150 characters. Provide ONLY the brief text, no options, no alternatives, no explanations.`,
            },
            {
              type: 'image',
              image: base64Image,
            },
          ],
        },
      ],
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingBudget: 8192,
            includeThoughts: true,
          },
        },
      },
      temperature: 0.7,
    });

    // Extract and clean the generated text
    const brief = resultText.trim();

    return NextResponse.json({ brief, reasoning: reasoningText });
  } catch (error) {
    console.error('Error generating brief:', error);

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'AI API not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY.' },
          { status: 500 },
        );
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in a moment.' },
          { status: 429 },
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate brief. Please try again.' },
      { status: 500 },
    );
  }
}
