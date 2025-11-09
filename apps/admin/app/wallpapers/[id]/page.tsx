'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api-client';
import React from 'react';

interface EditableWallpaper {
  _id: string;
  uploadThingFileKey?: string;
  fileName?: string;
  displayName?: string;
  description?: string;
  previewUrl?: string;
  fullUrl?: string;
  size?: number;
  artist?: string;
  brief?: string;
}

interface TooltipProps {
  text: string;
}

function Tooltip({ text }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 ml-2">
        ?
      </button>
      {isVisible && (
        <div className="absolute bottom-full left-0 mb-2 w-max max-w-xs p-2 bg-slate-800 text-slate-100 text-xs rounded-md border border-slate-700 shadow-lg z-10 whitespace-normal">
          {text}
          <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-800"></div>
        </div>
      )}
    </div>
  );
}

export default function WallpaperDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const mongoDbId = params?.id ? decodeURIComponent(params.id) : '';
  const [item, setItem] = useState<EditableWallpaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [reasoningText, setReasoningText] = useState<string | null>(null);

  useEffect(() => {
    if (!mongoDbId) return; // safety guard, prevents /undefined calls

    let cancelled = false;
    (async () => {
      try {
        const data = await adminApi.getWallpaper(mongoDbId);
        console.log('[admin] fetched wallpaper data:', data);
        if (!cancelled) {
          setItem(data ?? { _id: mongoDbId });
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load';
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mongoDbId]);

  async function handleSave() {
    if (!item) return;
    setSaving(true);
    setError(null);
    try {
      await adminApi.upsertWallpaper(mongoDbId, item);
      router.push('/wallpapers');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete metadata for this wallpaper?')) return;
    setSaving(true);
    setError(null);
    try {
      await adminApi.deleteWallpaper(mongoDbId);
      router.push('/wallpapers');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateBrief() {
    // Use either the new image file or the existing preview URL
    const imageToUse = imageFile || item?.previewUrl;

    if (!imageToUse || !item?.displayName) {
      setError('Image and display name are required to generate a brief');
      return;
    }

    setGeneratingBrief(true);
    setError(null);
    setReasoningText(null);
    try {
      const response = await adminApi.generateBriefWithImage(
        mongoDbId,
        imageFile,
        item.displayName,
        !imageFile ? item.previewUrl : undefined,
      );
      setItem({ ...item, brief: response.brief, description: response.description });
      setReasoningText(response.reasoning || null);
    } catch (err) {
      let message = 'Failed to generate brief';

      if (err instanceof Error) {
        // Handle specific URL fetch errors more gracefully
        if (err.message.includes('Unable to fetch image from URL')) {
          message =
            'Unable to fetch the existing image from storage. Please upload the image file directly using the "Replace Image" field above and try again.';
        } else if (err.message.includes('ENOTFOUND')) {
          message =
            'Unable to connect to image storage. This might be due to network issues or expired URLs. Please try uploading the image directly.';
        } else {
          message = err.message;
        }
      }

      setError(message);
    } finally {
      setGeneratingBrief(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-500">Loading...</p>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-500">Wallpaper not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-6 space-y-4">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Edit Wallpaper</h1>
            <p className="text-sm text-slate-400">MongoDB ID: {item._id}</p>
          </div>
          <button
            onClick={() => router.push('/wallpapers')}
            className="px-3 py-1.5 text-xs rounded-md border border-slate-700 text-slate-300 hover:bg-slate-900">
            Back
          </button>
        </header>

        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          {item.previewUrl && (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.previewUrl}
                alt={item.displayName || item.fileName || 'Wallpaper'}
                className="h-40 w-full object-cover rounded-lg border border-slate-800/70"
                onError={e => {
                  // show a small console hint when image fails to load

                  console.warn('[admin] preview image failed to load', {
                    mongoDbId,
                    src: item.previewUrl,
                    err: e,
                  });
                }}
              />
              <p className="mt-2 text-xs text-slate-400">Preview URL: {item.previewUrl}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[10px] font-medium text-slate-400">
              Replace Image (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setImageFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 rounded-md bg-slate-950/80 border border-slate-700 text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {imageFile && (
              <p className="text-xs text-slate-400">
                Selected: {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            {!imageFile && item.previewUrl && (
              <p className="text-xs text-slate-400">
                Using existing image for brief generation. If this fails, try uploading the image
                file directly using the field above.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-medium text-slate-400">Display name</label>
            <input
              className="w-full px-3 py-2 rounded-md bg-slate-950/80 border border-slate-700 text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={item.displayName ?? ''}
              onChange={e => setItem({ ...item, displayName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-medium text-slate-400">Artist</label>
            <input
              className="w-full px-3 py-2 rounded-md bg-slate-950/80 border border-slate-700 text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={item.artist ?? ''}
              onChange={e => setItem({ ...item, artist: e.target.value })}
              placeholder="Artist or creator name"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="block text-[10px] font-medium text-slate-400">
                  Brief (AI-generated)
                </label>
                {reasoningText && <Tooltip text={reasoningText} />}
              </div>
              <button
                onClick={handleGenerateBrief}
                disabled={generatingBrief || (!imageFile && !item.previewUrl) || !item.displayName}
                className="text-xs px-2 py-1 rounded-md bg-blue-600 text-slate-50 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                title={
                  !imageFile
                    ? 'Tip: If using existing image fails, try uploading the file directly'
                    : 'Generate AI brief for the wallpaper'
                }>
                {generatingBrief ? 'Generating...' : 'Generate with Gemini'}
              </button>
            </div>
            <textarea
              className="w-full px-3 py-2 rounded-md bg-slate-950/80 border border-slate-700 text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-20"
              value={item.brief ?? ''}
              onChange={e => setItem({ ...item, brief: e.target.value })}
              placeholder="1-2 sentence AI-generated description of the wallpaper (use Generate with Gemini button or edit manually)"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-medium text-slate-400">File name</label>
            <input
              className="w-full px-3 py-2 rounded-md bg-slate-900/60 border border-slate-800 text-slate-500 text-xs"
              value={item.fileName ?? ''}
              disabled
              readOnly
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-medium text-slate-400">Description</label>
            <textarea
              className="w-full px-3 py-2 rounded-md bg-slate-950/80 border border-slate-700 text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-20"
              value={item.description ?? ''}
              onChange={e => setItem({ ...item, description: e.target.value })}
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={handleDelete}
              disabled={saving}
              className="px-3 py-2 text-xs rounded-md border border-red-500/70 text-red-400 hover:bg-red-500/10 disabled:opacity-60">
              Delete metadata
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-xs rounded-md bg-emerald-500 text-slate-950 font-medium hover:bg-emerald-400 disabled:opacity-60">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
