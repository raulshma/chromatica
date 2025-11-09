/**
 * Configuration constants for the admin app
 */

// Image fetch timeout in milliseconds
// Default: 30 seconds (allows for slow CDN or large images)
// Can be overridden via NEXT_PUBLIC_IMAGE_FETCH_TIMEOUT_MS environment variable
export const IMAGE_FETCH_TIMEOUT_MS = parseInt(
  process.env.NEXT_PUBLIC_IMAGE_FETCH_TIMEOUT_MS || '30000',
  10,
);

// Maximum image size to fetch in bytes (50 MB)
// Prevents timeout due to excessively large files
export const MAX_IMAGE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

// Content-Type header to check when fetching images
export const ALLOWED_IMAGE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
