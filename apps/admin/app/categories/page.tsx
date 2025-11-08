import { requireAdminSession } from "@/lib/auth";
import { adminApi } from "@/lib/api-client";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  await requireAdminSession();
  const data = await adminApi.getCategories();
  const items = (data.items ?? []) as any[];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-6 space-y-4">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Categories
            </h1>
            <p className="text-sm text-slate-400">
              Curate collections and organize wallpapers.
            </p>
          </div>
          <a
            href="/wallpapers"
            className="px-3 py-1.5 text-xs rounded-md border border-slate-700 text-slate-300 hover:bg-slate-900"
          >
            Back to wallpapers
          </a>
        </header>

        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
          {items.length === 0 && (
            <p className="text-sm text-slate-500">
              No categories yet. You can add them via API or extend this page with a form.
            </p>
          )}
          {items.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 border border-slate-800/70 rounded-lg px-3 py-2 bg-slate-950/60"
            >
              <div className="space-y-0.5">
                <div className="text-sm font-medium">{c.name}</div>
                <div className="text-[10px] text-slate-500">{c.description}</div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span>{c.items?.length ?? 0} wallpapers</span>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
