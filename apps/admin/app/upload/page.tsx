'use client';

import Link from 'next/link';
import { useState } from 'react';
import { UploadDropzone } from '@/lib/uploadthing';

export default function UploadPage() {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-6 space-y-4">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Upload Wallpapers</h1>
            <p className="text-sm text-slate-400">
              Upload images via UploadThing; then adjust metadata from the Wallpapers view.
            </p>
          </div>
          <Link
            href="/wallpapers"
            className="px-3 py-1.5 text-xs rounded-md border border-slate-700 text-slate-300 hover:bg-slate-900">
            Back to wallpapers
          </Link>
        </header>

        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-4">
          <UploadDropzone
            endpoint="wallpaperImage"
            className="ut-label:text-slate-200 ut-allowed-content:text-slate-500"
            onClientUploadComplete={res => {
              if (!res || res.length === 0) return;
              setMessage(`Uploaded ${res.length} file(s).`);
            }}
            onUploadError={(error: Error) => {
              setMessage(error.message || 'Upload failed');
            }}
          />
          {message && (
            <p className="text-xs text-emerald-400" data-testid="upload-message">
              {message}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
