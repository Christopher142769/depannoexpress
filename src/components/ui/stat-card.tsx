"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCountUp } from "@/hooks/use-count-up";
import { staggerItem } from "@/lib/animations";
import type { LucideIcon } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon?: LucideIcon;
  trend?: { value: number; positive: boolean };
  className?: string;
  animate?: boolean;
}

/** Carte stat premium — glass + count-up */
export function StatCard({
  label,
  value,
  suffix = "",
  prefix = "",
  icon: Icon,
  trend,
  className,
  animate = true,
}: StatCardProps) {
  const displayValue = useCountUp(value, 1800, animate);

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className={cn(
        "card-premium group p-5 transition-all duration-300 hover:glow-blue-sm",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          {label}
        </p>
        {Icon ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-input bg-grad-brand shadow-[0_4px_12px_rgba(30,115,190,0.3)] group-hover:shadow-[0_4px_20px_rgba(46,156,240,0.4)] transition-shadow">
            <Icon className="h-4 w-4 text-white" />
          </div>
        ) : null}
      </div>
      <p className="font-display text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
        {prefix}
        {displayValue.toLocaleString("fr-BJ")}
        <span className="text-gradient-brand">{suffix}</span>
      </p>
      {trend ? (
        <p
          className={cn(
            "mt-2 text-xs font-semibold",
            trend.positive ? "text-success" : "text-brand-red"
          )}
        >
          {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}% ce mois
        </p>
      ) : null}
    </motion.div>
  );
}
