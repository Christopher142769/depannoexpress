"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type LandingScrollOptions = {
  heroRef: React.RefObject<HTMLElement | null>;
  heroCopyRef: React.RefObject<HTMLElement | null>;
  figureRef: React.RefObject<HTMLElement | null>;
};

/** Parallax hero + état nav sticky */
export function useLandingScroll({
  heroRef,
  heroCopyRef,
  figureRef,
}: LandingScrollOptions) {
  const [scrolled, setScrolled] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    let raf = 0;

    const update = () => {
      const y = window.scrollY;
      setScrolled(y > 36);

      if (reducedMotion) return;

      const hero = heroRef.current;
      if (!hero) return;

      const rect = hero.getBoundingClientRect();
      const height = rect.height || 1;
      const progress = Math.min(Math.max((height - rect.bottom) / height, 0), 1);

      const copy = heroCopyRef.current;
      if (copy) {
        copy.style.transform = `translate3d(0, ${progress * 32}px, 0)`;
        copy.style.opacity = `${1 - progress * 0.5}`;
      }

      const figure = figureRef.current;
      if (figure) {
        figure.style.transform = `translate3d(-50%, ${progress * 64}px, 0) scale(${1 - progress * 0.06})`;
        figure.style.opacity = `${1 - progress * 0.3}`;
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [heroRef, heroCopyRef, figureRef, reducedMotion]);

  return { scrolled };
}
