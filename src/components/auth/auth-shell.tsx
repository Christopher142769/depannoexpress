"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { AuthFormChrome } from "@/components/auth/auth-form-chrome";
import { AuthVisualPanel } from "@/components/auth/auth-visual-panel";
import { authAudienceFromPath } from "@/lib/landing-routes";
import { cn } from "@/lib/utils";

export function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const audience =
    roleParam === "pro"
      ? "pro"
      : roleParam === "admin"
        ? "admin"
        : authAudienceFromPath(pathname);

  return (
    <div
      className={cn(
        "auth-shell",
        audience === "pro" && "auth-shell--pro",
        audience === "admin" && "auth-shell--admin",
      )}
    >
      <AuthVisualPanel
        accent={audience === "pro" ? "pro" : audience === "admin" ? "admin" : "client"}
      />
      <AuthFormChrome>{children}</AuthFormChrome>
    </div>
  );
}
