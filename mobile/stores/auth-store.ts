import { create } from "zustand";
import { apiFetch } from "@/lib/api";
import { clearToken, getStoredToken, saveToken } from "@/lib/session";
import type { AuthUser } from "@/lib/types";

type AuthState = {
  user: AuthUser | null;
  isReady: boolean;
  bootstrap: () => Promise<void>;
  setSession: (user: AuthUser, token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<boolean>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isReady: false,

  bootstrap: async () => {
    try {
      const token = await getStoredToken();
      if (!token) {
        set({ user: null, isReady: true });
        return;
      }
      const res = await apiFetch<{ user: AuthUser }>("/api/auth/me");
      if (res.ok) {
        set({ user: res.data.user, isReady: true });
      } else {
        await clearToken();
        set({ user: null, isReady: true });
      }
    } catch {
      set({ user: null, isReady: true });
    }
  },

  setSession: async (user, token) => {
    await saveToken(token);
    set({ user, isReady: true });
  },

  logout: async () => {
    await apiFetch("/api/auth/logout", { method: "POST", auth: false }).catch(() => null);
    await clearToken();
    set({ user: null });
  },

  refreshUser: async () => {
    const res = await apiFetch<{ user: AuthUser }>("/api/auth/me");
    if (!res.ok) return false;
    set({ user: res.data.user });
    return true;
  },
}));
