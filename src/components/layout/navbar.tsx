"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/stores/theme-store";
import { APP_NAME } from "@/lib/constants";
import { EASE_SMOOTH } from "@/lib/animations";

const navLinks = [
  { href: "/#services", label: "Services" },
  { href: "/#suivi", label: "Suivi live" },
  { href: "/#comment-ca-marche", label: "Comment ça marche" },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();
  const navOpacity = useTransform(scrollY, [0, 80], [0.85, 1]);

  useEffect(() => setMounted(true), []);

  const isLanding = pathname === "/";

  return (
    <motion.header
      className="fixed top-0 inset-x-0 z-50"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE_SMOOTH }}
    >
      <motion.nav
        style={{ opacity: navOpacity }}
        className="glass-strong mx-4 mt-4 rounded-pill px-5 sm:px-7 py-3.5 flex items-center justify-between max-w-6xl lg:mx-auto shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
      >
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <img
            src="/logo.svg"
            alt={APP_NAME}
            width={150}
            height={36}
            className="h-9 w-auto transition-transform duration-300 group-hover:scale-105"
            decoding="async"
          />
        </Link>

        {isLanding && (
          <ul className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="nav-link text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-300"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Mode clair" : "Mode sombre"}
            className="border-transparent hover:border-border"
          >
            {mounted ? (
              theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )
            ) : (
              <span className="h-4 w-4" aria-hidden />
            )}
          </Button>

          <div className="hidden sm:flex items-center gap-2.5">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Connexion</Link>
            </Button>
            <Button variant="primary" size="sm" showArrow asChild>
              <Link href="/signup">S&apos;inscrire</Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </motion.nav>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: EASE_SMOOTH }}
          className="glass-strong mx-4 mt-2 rounded-card p-5 md:hidden shadow-xl"
        >
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block text-sm font-medium py-3 px-2 text-text-secondary hover:text-text-primary rounded-input hover:bg-bg-elevated/50 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="flex gap-2 pt-4 mt-2 border-t border-border">
              <Button variant="ghost" size="sm" className="flex-1" asChild>
                <Link href="/login">Connexion</Link>
              </Button>
              <Button variant="primary" size="sm" className="flex-1" showArrow asChild>
                <Link href="/signup">S&apos;inscrire</Link>
              </Button>
            </li>
          </ul>
        </motion.div>
      )}
    </motion.header>
  );
}
