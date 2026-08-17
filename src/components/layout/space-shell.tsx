"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOGO_MARK_SRC } from "@/components/brand/logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type SpaceNavItem = {
  href: string;
  label: string;
  exact?: boolean;
};

type SpaceShellProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeTone?: "blue" | "red" | "amber";
  tone?: "client" | "pro" | "admin";
  nav: SpaceNavItem[];
  children: React.ReactNode;
};

export function SpaceShell({
  title,
  subtitle,
  badge,
  badgeTone = "blue",
  tone = "client",
  nav,
  children,
}: SpaceShellProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "space-shell",
        tone === "pro" && "space-shell--pro",
      )}
    >
      <header className="space-shell__header">
        <div className="space-shell__header-inner">
          <div className="space-shell__brand-block">
            <Link href="/" className="space-shell__brand">
              <Image
                src={LOGO_MARK_SRC}
                alt=""
                width={36}
                height={36}
                className="space-shell__mark"
              />
              <span className="space-shell__brand-name">{APP_NAME}</span>
            </Link>
            <div className="space-shell__titles">
              {badge ? (
                <span
                  className={cn(
                    "space-shell__badge",
                    badgeTone === "red" && "space-shell__badge--red",
                    badgeTone === "amber" && "space-shell__badge--amber",
                  )}
                >
                  {badge}
                </span>
              ) : null}
              <p className="space-shell__title">{title}</p>
              {subtitle ? <p className="space-shell__subtitle">{subtitle}</p> : null}
            </div>
          </div>

          <nav className="space-shell__nav" aria-label="Navigation espace">
            {nav.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("space-shell__nav-link", active && "is-active")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="space-shell__actions">
            <LogoutButton variant="outline" />
          </div>
        </div>
      </header>

      <main className="space-shell__main">{children}</main>
    </div>
  );
}
