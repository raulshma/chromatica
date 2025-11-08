'use server';

import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { requireAdminApiSession } from '@/lib/auth';
import { resizeImageToBase64 } from '@/lib/image-resize';

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
      base64Image = await resizeImageToBase64(imageBuffer, 512);
    } else if (imageUrl) {
      // Fetch image from URL and convert to base64
      const response = await fetch(imageUrl);
      if (!response.ok) {
        return NextResponse.json({ error: 'Failed to fetch image from URL' }, { status: 400 });
      }
      const arrayBuffer = await response.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);
      // Resize image and convert to base64
      base64Image = await resizeImageToBase64(imageBuffer, 512);
    } else {
      return NextResponse.json(
        { error: 'Either image file or image URL is required' },
        { status: 400 },
      );
    }

    // Generate brief using Gemini vision
    const result = await generateText({
      model: google('gemini-2.5-flash'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a creative copywriter. Based on this wallpaper image and its display name "${displayName}", write a concise 1-2 sentence brief that describes the wallpaper's essence and appeal. Focus on the visual style, mood, and why someone would want to use it. Keep it under 150 characters.`,
            },
            {
              type: 'image',
              image: base64Image,
            },
          ],
        },
      ],
      temperature: 0.7,
      maxOutputTokens: 100, // Brief should be short
    });

    // Extract and clean the generated text
    const brief = result.text.trim();

    return NextResponse.json({ brief });
  } catch (error) {
    console.error('Error generating brief:', error);

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'AI API not configured. Please set GOOGLE_GENERATIVE_AI_KEY.' },
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
