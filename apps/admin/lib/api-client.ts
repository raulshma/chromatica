// Admin API client: calls internal Next.js API routes only.
// NOTE: This module is used by both server and client components.
// Do NOT import `next/headers` (server-only) directly here.

const RAW_ADMIN_BASE = process.env.NEXT_PUBLIC_APP_URL || '';
const ADMIN_API_BASE_URL = RAW_ADMIN_BASE.replace(/\/+$/, '');

async function request(input: string, init?: RequestInit) {
  const path =
    input.startsWith('http://') || input.startsWith('https://')
      ? input
      : `${ADMIN_API_BASE_URL}${input}`;

  // Check if we're on the server side
  const isServer = typeof window === 'undefined';

  const headers: HeadersInit = {
    ...((init?.headers as Record<string, string>) || {}),
    'Content-Type': 'application/json',
  };

  // On server side, we need to forward cookies for authentication
  if (isServer && typeof document !== 'undefined') {
    const cookieHeader = document.cookie;
    if (cookieHeader) {
      headers.Cookie = cookieHeader;
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
  getWallpaper: (mongoDbId: string) => {
    if (!mongoDbId) {
      return Promise.reject(new Error('Wallpaper _id is required'));
    }
    return request(`/api/admin/wallpapers/${encodeURIComponent(mongoDbId)}`);
  },
  upsertWallpaper: (mongoDbId: string, body: unknown) =>
    request(`/api/admin/wallpapers/${encodeURIComponent(mongoDbId)}`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteWallpaper: (mongoDbId: string) =>
    request(`/api/admin/wallpapers/${encodeURIComponent(mongoDbId)}`, {
      method: 'DELETE',
    }),
  generateBriefWithImage: (
    mongoDbId: string,
    file: File | null,
    displayName: string,
    imageUrl?: string,
  ) => {
    const formData = new FormData();
    if (file) {
      formData.append('image', file);
    }
    if (imageUrl) {
      formData.append('imageUrl', imageUrl);
    }
    formData.append('displayName', displayName);

    // Note: We need to use fetch directly for FormData instead of the request wrapper
    const path = `${ADMIN_API_BASE_URL}/api/admin/wallpapers/${encodeURIComponent(mongoDbId)}/generate-brief`;

    return fetch(path, {
      method: 'POST',
      body: formData,
      cache: 'no-store',
    }).then(async res => {
      if (!res.ok) {
        const contentType = (res.headers.get('content-type') || '').toLowerCase();
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

      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (!contentType.includes('application/json')) {
        const text = await res.text().catch(() => '');
        throw new Error(
          text
            ? `Expected JSON response but received: ${text.slice(0, 200)}`
            : 'Expected JSON response',
        );
      }

      return res.json();
    });
  },
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
