export interface Wallpaper {
  _id: string; // MongoDB document ObjectId (hex string)
  uploadThingFileKey: string; // UploadThing file key (used for file operations and CDN URLs)
  fileName: string; // Original filename from upload
  displayName?: string; // Human-friendly name for display in UI
  description?: string;
  previewUrl: string;
  fullUrl: string;
  size: number;
  uploadedAt: string;
  dominantColor?: string;
  tags?: string[];
  artist?: string; // Artist/creator name
  brief?: string; // AI-generated brief description
}

export interface WallpaperCollection {
  _id: string;
  title: string;
  description?: string;
  items: Wallpaper[];
}

export interface WallpaperFeedResponse {
  items: Wallpaper[];
  collections?: WallpaperCollection[];
  generatedAt: string;
}

export interface WallpaperCachePayload {
  items: Wallpaper[];
  favorites: string[];
  timestamp: number;
}
