'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      console.log('Submitting login form with username:', username);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include', // Explicitly include cookies
      });
      console.log('Login response status:', res.status);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error('Login failed with data:', data);
        throw new Error(data.error || 'Login failed');
      }

      console.log('Login successful, redirecting...');
      router.push('/wallpapers');
    } catch (err) {
      console.error('Login error:', err);
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 bg-slate-900/70 border border-slate-800 rounded-xl p-6 shadow-xl">
        <h1 className="text-xl font-semibold text-white">Chromatica Admin</h1>
        <p className="text-sm text-slate-400">Sign in with the configured admin credentials.</p>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Username</label>
          <input
            className="w-full px-3 py-2 rounded-md bg-slate-950/80 border border-slate-700 text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
          <input
            className="w-full px-3 py-2 rounded-md bg-slate-950/80 border border-slate-700 text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 text-sm font-medium rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition disabled:opacity-60">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
