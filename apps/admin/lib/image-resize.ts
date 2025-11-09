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
    // Check if the buffer is empty or invalid
    if (!inputBuffer || inputBuffer.length === 0) {
      throw new Error('Invalid or empty image buffer');
    }

    // Get original image metadata
    let metadata;
    try {
      metadata = await sharp(inputBuffer).metadata();
    } catch (sharpError) {
      console.error('Sharp metadata error:', sharpError);
      throw new Error('Invalid image format or corrupted image data');
    }

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
    let resized;
    try {
      resized = await sharp(inputBuffer)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toBuffer();
    } catch (resizeError) {
      console.error('Sharp resize error:', resizeError);
      throw new Error('Failed to resize image');
    }

    // Check if the resize operation was successful
    if (!resized || resized.length === 0) {
      throw new Error('Image resize resulted in empty buffer');
    }

    // Convert to base64
    let base64;
    try {
      base64 = resized.toString('base64');
    } catch (base64Error) {
      console.error('Base64 conversion error:', base64Error);
      throw new Error('Failed to convert image to base64');
    }

    // Validate the base64 string
    if (base64.length === 0) {
      throw new Error('Base64 conversion resulted in empty string');
    }

    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('Error resizing image:', error);
    // If we've already wrapped the error, just rethrow it
    if (
      error instanceof Error &&
      (error.message.includes('Invalid image') ||
        error.message.includes('Failed to resize') ||
        error.message.includes('Failed to convert'))
    ) {
      throw error;
    }
    throw new Error(
      `Failed to resize image: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
