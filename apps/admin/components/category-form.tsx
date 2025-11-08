'use client';

import { useState } from 'react';
import { adminApi } from '@/lib/api-client';

export function CategoryForm({ onChanged }: { onChanged: () => void }) {
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
