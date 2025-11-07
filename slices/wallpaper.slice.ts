import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { DataPersistKeys } from '@/hooks';
import type { Wallpaper, WallpaperCachePayload, WallpaperFeedResponse } from '@/types';
import { fetchWallpapersFeed } from '@/services';
import type { Dispatch, State } from '@/utils/store';

export interface WallpaperState {
  items: Wallpaper[];
  favorites: string[];
  status: 'idle' | 'loading' | 'refreshing' | 'succeeded' | 'failed';
  error?: string;
  lastFetched?: string;
  hydrated: boolean;
}

const initialState: WallpaperState = {
  items: [],
  favorites: [],
  status: 'idle',
  error: undefined,
  lastFetched: undefined,
  hydrated: false,
};

function normalizeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unexpected error';
}

async function persistCachePayload(payload: WallpaperCachePayload) {
  try {
    await AsyncStorage.setItem(DataPersistKeys.WALLPAPER_CACHE, JSON.stringify(payload));
  } catch (error) {
    console.warn('[wallpapers] Failed to persist cache', error);
  }
}

async function readCachePayload(): Promise<WallpaperCachePayload | undefined> {
  try {
    const raw = await AsyncStorage.getItem(DataPersistKeys.WALLPAPER_CACHE);
    return raw ? (JSON.parse(raw) as WallpaperCachePayload) : undefined;
  } catch (error) {
    console.warn('[wallpapers] Failed to read cache', error);
    return undefined;
  }
}

export const hydrateWallpapers = createAsyncThunk<WallpaperCachePayload | undefined>(
  'wallpapers/hydrate',
  async () => readCachePayload(),
);

export const loadWallpapers = createAsyncThunk<
  WallpaperFeedResponse,
  void,
  { state: { wallpapers: WallpaperState } }
>('wallpapers/load', async (_arg, { getState, rejectWithValue }) => {
  try {
    const response = await fetchWallpapersFeed();
    const { favorites } = getState().wallpapers;
    await persistCachePayload({
      items: response.items,
      favorites,
      timestamp: Date.now(),
    });
    return response;
  } catch (error) {
    return rejectWithValue(normalizeError(error));
  }
});

export const toggleWallpaperFavorite = createAsyncThunk<
  string[],
  string,
  { state: { wallpapers: WallpaperState } }
>('wallpapers/toggleFavorite', async (wallpaperId, { getState, rejectWithValue }) => {
  try {
    const state = getState().wallpapers;
    const nextFavorites = state.favorites.includes(wallpaperId)
      ? state.favorites.filter(id => id !== wallpaperId)
      : [...state.favorites, wallpaperId];

    await persistCachePayload({
      items: state.items,
      favorites: nextFavorites,
      timestamp: Date.now(),
    });

    return nextFavorites;
  } catch (error) {
    return rejectWithValue(normalizeError(error));
  }
});

const wallpaperSlice = createSlice({
  name: 'wallpapers',
  initialState,
  reducers: {
    setFavorites(state, { payload }: PayloadAction<string[]>) {
      state.favorites = payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(hydrateWallpapers.fulfilled, (state, { payload }) => {
        if (payload) {
          state.items = payload.items;
          state.favorites = payload.favorites;
          state.lastFetched = new Date(payload.timestamp).toISOString();
        }
        state.hydrated = true;
      })
      .addCase(hydrateWallpapers.rejected, state => {
        state.hydrated = true;
      })
      .addCase(loadWallpapers.pending, state => {
        state.status = state.items.length ? 'refreshing' : 'loading';
        state.error = undefined;
      })
      .addCase(loadWallpapers.fulfilled, (state, { payload }) => {
        state.status = 'succeeded';
        state.items = payload.items;
        state.lastFetched = payload.generatedAt;
        state.error = undefined;
      })
      .addCase(loadWallpapers.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = typeof payload === 'string' ? payload : 'Failed to fetch wallpapers';
      })
      .addCase(toggleWallpaperFavorite.fulfilled, (state, { payload }) => {
        state.favorites = payload;
      })
      .addCase(toggleWallpaperFavorite.rejected, (state, { payload }) => {
        state.error = typeof payload === 'string' ? payload : state.error;
      });
  },
});

export function useWallpaperSlice() {
  const dispatch = useDispatch<Dispatch>();
  const state = useSelector((root: State) => root.wallpapers ?? initialState);
  return {
    dispatch,
    ...state,
    ...wallpaperSlice.actions,
  };
}

export default wallpaperSlice.reducer;
