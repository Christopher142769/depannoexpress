"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { tapScale } from "@/lib/animations";

export interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  className?: string;
}

const sizeMap = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-7 w-7" };

/** Étoiles de notation — interactif ou lecture seule */
export function RatingStars({
  value,
  onChange,
  max = 5,
  size = "md",
  readonly = false,
  className,
}: RatingStarsProps) {
  const [hover, setHover] = React.useState(0);

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role={readonly ? "img" : "radiogroup"}
      aria-label={`Note : ${value} sur ${max}`}
    >
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1;
        const filled = starValue <= (hover || value);

        const star = (
          <Star
            className={cn(
              sizeMap[size],
              "transition-colors duration-150",
              filled
                ? "fill-warning text-warning"
                : "fill-transparent text-border"
            )}
          />
        );

        if (readonly) {
          return <span key={i}>{star}</span>;
        }

        return (
          <motion.button
            key={i}
            type="button"
            whileTap={tapScale}
            className="p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded"
            onMouseEnter={() => setHover(starValue)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange?.(starValue)}
            aria-label={`${starValue} étoile${starValue > 1 ? "s" : ""}`}
          >
            {star}
          </motion.button>
        );
      })}
    </div>
  );
}
