import { requireAdminSession } from '@/lib/auth';
import { adminApi } from '@/lib/api-client';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function WallpapersPage() {
  await requireAdminSession();
  const data = await adminApi.getWallpapers();
  const items = (data.items ?? []) as {
    id: string;
    name?: string;
    description?: string;
    previewUrl?: string;
    size?: number;
  }[];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-6 space-y-4">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Wallpapers</h1>
            <p className="text-sm text-slate-400">Manage wallpapers, metadata, and visibility.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/categories"
              className="px-3 py-1.5 text-xs rounded-md border border-slate-700 text-slate-300 hover:bg-slate-900">
              Categories
            </Link>
            <Link
              href="/upload"
              className="px-3 py-1.5 text-xs rounded-md bg-emerald-500 text-slate-950 hover:bg-emerald-400">
              Upload wallpaper
            </Link>
          </div>
        </header>

        <section className="rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
            {items.map(w => (
              <article
                key={w.id}
                className="group relative overflow-hidden rounded-lg border border-slate-800/70 bg-slate-950/60 hover:border-emerald-500/60 hover:bg-slate-900/80 transition">
                {w.previewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={w.previewUrl}
                    alt={w.name || 'Wallpaper'}
                    className="h-32 w-full object-cover"
                  />
                )}
                <div className="p-2 space-y-1">
                  <h2 className="text-xs font-medium line-clamp-1">{w.name || w.id}</h2>
                  <p className="text-[10px] text-slate-500 line-clamp-2">
                    {w.description || 'No description'}
                  </p>
                  <div className="flex justify-between items-center pt-1">
                    <a
                      href={`/wallpapers/${encodeURIComponent(w.id)}`}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300">
                      Edit
                    </a>
                    <span className="text-[9px] text-slate-500">
                      {w.size ? `${Math.round(w.size / 1024)} KB` : ''}
                    </span>
                  </div>
                </div>
              </article>
            ))}
            {items.length === 0 && (
              <div className="col-span-full flex items-center justify-center py-10 text-sm text-slate-500">
                No wallpapers yet. Upload your first wallpaper.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
