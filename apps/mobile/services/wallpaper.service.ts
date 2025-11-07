import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';
import { Wallpaper, WallpaperFeedResponse } from '@chromatica/shared';
import config from '@/utils/config';

const WALLPAPER_ENDPOINT = '/wallpapers';

function buildApiUrl(path: string): string {
  const base = config.apiUrl?.replace(/\/+$/, '') ?? '';
  return `${base}${path}`;
}

export async function fetchWallpapersFeed(): Promise<WallpaperFeedResponse> {
  const response = await fetch(buildApiUrl(WALLPAPER_ENDPOINT));
  if (!response.ok) {
    throw new Error(`Failed to load wallpapers (${response.status})`);
  }

  const payload = (await response.json()) as WallpaperFeedResponse;

  return {
    items: payload.items ?? [],
    collections: payload.collections ?? [],
    generatedAt: payload.generatedAt ?? new Date().toISOString(),
  };
}

export async function saveWallpaperToLibrary(wallpaper: Wallpaper): Promise<void> {
  const permission = await MediaLibrary.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Media library permission not granted');
  }

  const fileExtension = wallpaper.fullUrl.split('.').pop() ?? 'jpg';
  const cachePath = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory}${wallpaper.id}.${fileExtension}`;

  const download = await FileSystem.downloadAsync(wallpaper.fullUrl, cachePath);
  const asset = await MediaLibrary.createAssetAsync(download.uri);
  await MediaLibrary.createAlbumAsync('Zenith Wallpapers', asset, false).catch(() => {
    // Album may already exist on iOS; ignore
  });
}

export async function openSetWallpaperDeepLink(wallpaper: Wallpaper): Promise<void> {
  const url = Linking.createURL('set-wallpaper', {
    queryParams: {
      id: wallpaper.id,
      src: wallpaper.fullUrl,
    },
  });

  const supported = await Linking.canOpenURL(url);
  if (!supported) {
    throw new Error('Unable to open wallpaper deep link');
  }

  await Linking.openURL(url);
}

export function showDownloadSuccessBanner(): void {
  Alert.alert('Wallpaper Saved', 'Find it in your Zenith Wallpapers album.');
}

export function showDownloadErrorBanner(error: unknown): void {
  const message = error instanceof Error ? error.message : 'Could not save wallpaper';
  Alert.alert('Save failed', message);
}
