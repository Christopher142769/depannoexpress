"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "./use-reduced-motion";

/**
 * Compteur animé (count-up) à l'apparition
 * Respecte prefers-reduced-motion
 */
export function useCountUp(
  target: number,
  duration = 1500,
  enabled = true
): number {
  const reducedMotion = useReducedMotion();
  const [value, setValue] = useState(enabled && !reducedMotion ? 0 : target);

  useEffect(() => {
    if (!enabled || reducedMotion) {
      setValue(target);
      return;
    }

    let start: number | null = null;
    let raf: number;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // Easing ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));

      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, enabled, reducedMotion]);

  return value;
}
