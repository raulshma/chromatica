'use client';

import { useState } from 'react';
import { adminApi } from '@/lib/api-client';

export function CategoryRow({
  category,
}: {
  category: { id: string; name: string; description?: string; items?: unknown[] };
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm('Delete this category?')) return;
    setDeleting(true);
    setError(null);
    try {
      await adminApi.deleteCategory(category.id);
      window.location.reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete';
      setError(message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 border border-slate-800/70 rounded-lg px-3 py-2 bg-slate-950/60">
      <div className="space-y-0.5">
        <div className="text-sm font-medium">{category.name}</div>
        <div className="text-[10px] text-slate-500">{category.description}</div>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-slate-400">
        <span>{category.items?.length ?? 0} wallpapers</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-2 py-1 rounded-md border border-red-500/70 text-red-400 hover:bg-red-500/10 disabled:opacity-60">
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
