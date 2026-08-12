export async function apiFetch<T>(
  input: string,
  init?: RequestInit
): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  try {
    const res = await fetch(input, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) {
      return {
        ok: false,
        error: (data as { error?: string }).error ?? "Erreur serveur",
        status: res.status,
      };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Erreur réseau", status: 0 };
  }
}
