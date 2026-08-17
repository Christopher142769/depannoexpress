"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, UserRound } from "lucide-react";
import { LANDING_ROUTES } from "@/lib/landing-routes";
import { cn } from "@/lib/utils";

const TABS = [
  { href: LANDING_ROUTES.proApp, label: "Missions", icon: Briefcase, exact: true },
  { href: LANDING_ROUTES.proProfile, label: "Profil", icon: UserRound, exact: false },
] as const;

export function ProTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-bg-surface/92 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
      aria-label="Navigation dépanneur"
    >
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        {TABS.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-brand-red" : "text-text-secondary",
              )}
            >
              <Icon
                className={cn("h-5 w-5", active && "scale-105")}
                strokeWidth={active ? 2.4 : 2}
              />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
