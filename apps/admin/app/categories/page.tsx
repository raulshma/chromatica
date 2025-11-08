import { requireAdminSession } from '@/lib/auth';
import { adminApi } from '@/lib/api-client';
import Link from 'next/link';
import { CategoryForm } from '@/components/category-form';
import { CategoryRow } from '@/components/category-row';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  await requireAdminSession();

  let items: {
    id: string;
    name: string;
    description?: string;
    items?: unknown[];
  }[] = [];

  let error: string | null = null;

  try {
    const data = await adminApi.getCategories();
    items = (data.items ?? []) as {
      id: string;
      name: string;
      description?: string;
      items?: unknown[];
    }[];
  } catch (err) {
    console.error('[CategoriesPage] Error fetching categories:', err);
    error = err instanceof Error ? err.message : 'Failed to load categories';
  }

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

        {error && (
          <div className="rounded-lg border border-red-800 bg-red-950/40 p-4 text-red-200">
            <p className="text-sm font-semibold">Error loading categories</p>
            <p className="text-xs text-red-300 mt-1">{error}</p>
          </div>
        )}

        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
          <CategoryForm onChanged={() => window.location.reload()} />
          {items.length === 0 && !error && (
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
