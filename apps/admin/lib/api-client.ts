// Admin API client: calls internal Next.js API routes only.
const RAW_ADMIN_BASE = process.env.NEXT_PUBLIC_APP_URL || '';
const ADMIN_API_BASE_URL = RAW_ADMIN_BASE.replace(/\/+$/, '');

async function request(input: string, init?: RequestInit) {
  const path =
    input.startsWith('http://') || input.startsWith('https://')
      ? input
      : `${ADMIN_API_BASE_URL}${input}`;

  // Check if we're on the server side
  const isServer = typeof window === 'undefined';

  const headers: Record<string, string> = {
    ...(init?.headers || {}),
    'Content-Type': 'application/json',
  };

  // On server side, we need to forward cookies for authentication
  if (isServer) {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    if (allCookies.length > 0) {
      headers.Cookie = allCookies.map(c => `${c.name}=${c.value}`).join('; ');
    }
  }

  const res = await fetch(path, {
    ...init,
    headers,
    cache: 'no-store',
  });
  if (res.redirected) {
    throw new Error('Request was redirected (likely to login)');
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase();

  if (!res.ok) {
    if (contentType.includes('application/json')) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Request failed with ${res.status}`);
    }
    const text = await res.text().catch(() => '');
    throw new Error(
      text
        ? `Request failed with ${res.status}: ${text.slice(0, 200)}`
        : `Request failed with ${res.status}`,
    );
  }

  if (!contentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    throw new Error(
      text
        ? `Expected JSON response but received: ${text.slice(0, 200)}`
        : 'Expected JSON response',
    );
  }

  return res.json();
}

export const adminApi = {
  getWallpapers: () => request('/api/admin/wallpapers'),
  upsertWallpaper: (id: string, body: unknown) =>
    request(`/api/admin/wallpapers/${encodeURIComponent(id)}`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteWallpaper: (id: string) =>
    request(`/api/admin/wallpapers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  getCategories: () => request('/api/admin/categories'),
  upsertCategory: (body: unknown) =>
    request('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteCategory: (id: string) =>
    request(`/api/admin/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};
