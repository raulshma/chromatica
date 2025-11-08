import sharp from 'sharp';

/**
 * Resizes an image to a maximum dimension while maintaining aspect ratio
 * and converts it to a base64 data URL for use with Gemini vision API
 *
 * @param inputBuffer - The image file buffer
 * @param maxDimension - Maximum width/height in pixels (default: 512)
 * @returns Base64 data URL ready for Gemini API
 */
export async function resizeImageToBase64(
  inputBuffer: Buffer,
  maxDimension: number = 512,
): Promise<string> {
  try {
    // Get original image metadata
    const metadata = await sharp(inputBuffer).metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Unable to determine image dimensions');
    }

    // Calculate new dimensions maintaining aspect ratio
    const aspectRatio = metadata.width / metadata.height;
    let width = maxDimension;
    let height = maxDimension;

    if (aspectRatio > 1) {
      // Landscape: width is the limiting factor
      height = Math.round(width / aspectRatio);
    } else {
      // Portrait: height is the limiting factor
      width = Math.round(height * aspectRatio);
    }

    // Resize the image
    const resized = await sharp(inputBuffer)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toBuffer();

    // Convert to base64
    const base64 = resized.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('Error resizing image:', error);
    throw new Error(
      `Failed to resize image: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
