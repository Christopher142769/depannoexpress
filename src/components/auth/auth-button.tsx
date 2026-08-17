"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { tapScale } from "@/lib/animations";

type AuthButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "accent" | "ghost";
  loading?: boolean;
};

export function AuthButton({
  variant = "primary",
  loading,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: AuthButtonProps) {
  return (
    <motion.button
      type={type}
      className={cn(
        "auth-btn",
        variant === "accent" && "auth-btn--accent",
        variant === "ghost" && "auth-btn--ghost",
        variant === "primary" && "auth-btn--primary",
        className
      )}
      whileTap={tapScale}
      whileHover={{ scale: disabled || loading ? 1 : 1.01 }}
      disabled={disabled || loading}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : null}
      {children}
    </motion.button>
  );
}

type AuthLinkButtonProps = {
  href: string;
  variant?: "primary" | "ghost";
  className?: string;
  children: React.ReactNode;
};

export function AuthLinkButton({
  variant = "ghost",
  className,
  href,
  children,
}: AuthLinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "auth-btn",
        variant === "primary" && "auth-btn--primary",
        variant === "ghost" && "auth-btn--ghost",
        className
      )}
    >
      {children}
    </Link>
  );
}
