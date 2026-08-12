"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProTabBar() {
  const pathname = usePathname();
  const active = pathname.startsWith("/pro");

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-bg-surface/92 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
      aria-label="Navigation dépanneur"
    >
      <div className="flex items-stretch justify-center max-w-lg mx-auto">
        <Link
          href="/pro"
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
            active ? "text-brand-blue" : "text-text-secondary"
          )}
        >
          <Briefcase className={cn("h-5 w-5", active && "scale-105")} strokeWidth={active ? 2.4 : 2} />
          Missions
        </Link>
      </div>
    </nav>
  );
}
