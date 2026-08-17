import { clearToken, getStoredToken } from "@/lib/session";

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export function getApiBaseUrl() {
  return API_BASE;
}

/** URL absolue pour les assets servis par Next (/products/..., etc.) */
export function resolveAssetUrl(path: string | undefined | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export function formatFCFA(amount: number) {
  return new Intl.NumberFormat("fr-BJ", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(amount);
}

type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { auth?: boolean }
): Promise<ApiResult<T>> {
  const useAuth = init?.auth !== false;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (useAuth) {
    const token = await getStoredToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  try {
    const res = await fetch(url, { ...init, headers });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };

    if (!res.ok) {
      if (res.status === 401 && useAuth) {
        await clearToken();
      }
      return {
        ok: false,
        error: data.error ?? "Erreur serveur",
        status: res.status,
      };
    }

    return { ok: true, data };
  } catch {
    return { ok: false, error: "Erreur réseau. Vérifiez EXPO_PUBLIC_API_URL", status: 0 };
  }
}
