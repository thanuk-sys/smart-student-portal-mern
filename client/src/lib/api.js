const BASE = (
  import.meta.env.VITE_API_URL ||
  "https://smart-student-portal-mern-server.vercel.app"
).replace(/\/$/, "");

const TOKEN_KEY = "ssp-token";

export const getToken = () =>
  localStorage.getItem(TOKEN_KEY);

export const setToken = (t) =>
  t
    ? localStorage.setItem(TOKEN_KEY, t)
    : localStorage.removeItem(TOKEN_KEY);

export async function api(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
      ...(options.headers ?? {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message ?? "Request failed");
  }

  return data;
}