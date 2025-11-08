'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminApi } from '@/lib/api-client';

interface EditableWallpaper {
  id: string;
  name?: string;
  description?: string;
  previewUrl?: string;
  fullUrl?: string;
  size?: number;
}

export default function WallpaperDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const search = useSearchParams();
  const id = decodeURIComponent(params.id);
  const [item, setItem] = useState<EditableWallpaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await adminApi.getWallpapers();
        const found = (data.items ?? []).find((w: EditableWallpaper) => w.id === id);
        if (!cancelled) {
          setItem(found || { id });
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
  }, [id]);

  async function handleSave() {
    if (!item) return;
    setSaving(true);
    setError(null);
    try {
      await adminApi.upsertWallpaper(id, item);
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
      await adminApi.deleteWallpaper(id);
      router.push('/wallpapers');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete';
      setError(message);
    } finally {
      setSaving(false);
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
            <p className="text-sm text-slate-400">ID: {item.id}</p>
          </div>
          <button
            onClick={() => router.push('/wallpapers')}
            className="px-3 py-1.5 text-xs rounded-md border border-slate-700 text-slate-300 hover:bg-slate-900">
            Back
          </button>
        </header>

        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          {item.previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.previewUrl}
              alt={item.name || 'Wallpaper'}
              className="h-40 w-full object-cover rounded-lg border border-slate-800/70"
            />
          )}
          <div className="space-y-2">
            <label className="block text-[10px] font-medium text-slate-400">Name</label>
            <input
              className="w-full px-3 py-2 rounded-md bg-slate-950/80 border border-slate-700 text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={item.name ?? ''}
              onChange={e => setItem({ ...item, name: e.target.value })}
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
