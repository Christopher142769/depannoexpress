"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/components/ui/toast";

export function LogoutButton({
  className,
  variant = "ghost",
}: {
  className?: string;
  variant?: "ghost" | "outline" | "primary";
}) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // on vide le store même si le réseau échoue
    }
    logout();
    toast.success("Déconnexion réussie");
    router.push("/");
    router.refresh();
  };

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={handleLogout}
    >
      Se déconnecter
    </Button>
  );
}
