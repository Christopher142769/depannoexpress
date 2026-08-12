"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

/** Resynchronise le store client avec la session serveur (cookie httpOnly). */
export function AuthBootstrap() {
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (cancelled) return;
        if (!res.ok) {
          logout();
          return;
        }
        const data = (await res.json()) as {
          user: {
            id: string;
            email: string;
            name: string;
            role: import("@/lib/constants").UserRole;
            phone?: string;
          };
        };
        setUser(data.user);
      } catch {
        if (!cancelled) logout();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setUser, logout]);

  return null;
}
