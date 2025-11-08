const ADMIN_API_BASE_URL = process.env.ADMIN_API_BASE_URL || "http://localhost:3000";
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN;

if (!ADMIN_API_TOKEN && process.env.NODE_ENV === "development") {
  console.warn("[admin] ADMIN_API_TOKEN is not set; admin API calls may fail.");
}

async function request(input: string, init?: RequestInit) {
  const url = `${ADMIN_API_BASE_URL}${input}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      "Content-Type": "application/json",
      "X-Admin-Token": ADMIN_API_TOKEN || "",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed with ${res.status}`);
  }
  return res.json();
}

export const adminApi = {
  getWallpapers: () => request("/admin/wallpapers"),
  upsertWallpaper: (id: string, body: unknown) =>
    request(`/admin/wallpapers/${encodeURIComponent(id)}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteWallpaper: (id: string) =>
    request(`/admin/wallpapers/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  getCategories: () => request("/admin/categories"),
  upsertCategory: (body: unknown) =>
    request("/admin/categories", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteCategory: (id: string) =>
    request(`/admin/categories/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};
