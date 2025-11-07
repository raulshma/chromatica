export interface Wallpaper {
  id: string;
  name: string;
  description?: string;
  previewUrl: string;
  fullUrl: string;
  size: number;
  uploadedAt: string;
  dominantColor?: string;
  tags?: string[];
}

export interface WallpaperCollection {
  id: string;
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
