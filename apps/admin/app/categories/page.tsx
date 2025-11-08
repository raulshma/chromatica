import { requireAdminSession } from '@/lib/auth';
import { adminApi } from '@/lib/api-client';
import Link from 'next/link';
import { useState } from 'react';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  await requireAdminSession();
  const data = await adminApi.getCategories();
  const items = (data.items ?? []) as {
    id: string;
    name: string;
    description?: string;
    items?: unknown[];
  }[];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-6 space-y-4">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
            <p className="text-sm text-slate-400">Curate collections and organize wallpapers.</p>
          </div>
          <Link
            href="/wallpapers"
            className="px-3 py-1.5 text-xs rounded-md border border-slate-700 text-slate-300 hover:bg-slate-900">
            Back to wallpapers
          </Link>
        </header>

        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
          <CategoryForm onChanged={() => window.location.reload()} />
          {items.length === 0 && (
            <p className="text-sm text-slate-500">
              No categories yet. Create your first collection below.
            </p>
          )}
          {items.map(c => (
            <CategoryRow key={c.id} category={c} />
          ))}
        </section>
      </div>
    </main>
  );
}

function CategoryForm({ onChanged }: { onChanged: () => void }) {
  'use client';
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const id = name.toLowerCase().replace(/\s+/g, '-');
      await adminApi.upsertCategory({ id, name, description });
      setName('');
      setDescription('');
      onChanged();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col md:flex-row gap-2 items-stretch md:items-end">
      <div className="flex-1 space-y-1">
        <label className="block text-[10px] font-medium text-slate-400">Name</label>
        <input
          className="w-full px-3 py-2 rounded-md bg-slate-950/80 border border-slate-700 text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
      </div>
      <div className="flex-2 space-y-1">
        <label className="block text-[10px] font-medium text-slate-400">Description</label>
        <input
          className="w-full px-3 py-2 rounded-md bg-slate-950/80 border border-slate-700 text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="px-3 py-2 text-xs rounded-md bg-emerald-500 text-slate-950 font-medium hover:bg-emerald-400 disabled:opacity-60">
        {saving ? 'Saving...' : 'Add'}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  );
}

function CategoryRow({
  category,
}: {
  category: { id: string; name: string; description?: string; items?: unknown[] };
}) {
  'use client';
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
