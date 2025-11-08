// Admin API client: calls internal Next.js API routes only.
const ADMIN_API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || '';

async function request(input: string, init?: RequestInit) {
  const url = `${ADMIN_API_BASE_URL}${input}` || input;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed with ${res.status}`);
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
