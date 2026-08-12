"use client";

import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toast";
import { AuthBootstrap } from "@/components/auth/auth-bootstrap";
import { useThemeStore } from "@/stores/theme-store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

/** Providers globaux : React Query, thème, toasts, session */
export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  // Applique le thème persisté dès le montage client
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap />
      {children}
      <Toaster theme={theme} position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
