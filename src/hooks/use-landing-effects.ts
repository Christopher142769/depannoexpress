"use client";

import { useEffect } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/** Effets scroll reveal + count-up — reprend le script de depannage-express-landing.html */
export function useLandingEffects(rootRef: React.RefObject<HTMLElement | null>) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion) {
      root?.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
      return;
    }

    const revealIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          const parent = el.parentElement;
          if (parent) {
            const sibs = [...parent.querySelectorAll(":scope > .reveal")];
            const i = sibs.indexOf(el);
            el.style.transitionDelay = (i > 0 ? Math.min(i, 4) * 0.09 : 0) + "s";
          }
          el.classList.add("in");
          revealIO.unobserve(el);
        });
      },
      { threshold: 0.15 }
    );

    root.querySelectorAll(".reveal").forEach((el) => revealIO.observe(el));

    const countIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          const target = parseFloat(el.dataset.target ?? "0");
          const dec = el.dataset.decimal === "true";
          const suffix = el.dataset.suffix ?? "";
          const dur = 1500;
          const t0 = performance.now();

          const tick = (now: number) => {
            const p = Math.min((now - t0) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            const v = target * eased;
            el.textContent = dec
              ? (v / 10).toFixed(1).replace(".", ",") + suffix
              : Math.round(v).toLocaleString("fr-FR") + suffix;
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          countIO.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );

    root.querySelectorAll(".stat .val").forEach((el) => countIO.observe(el));

    return () => {
      revealIO.disconnect();
      countIO.disconnect();
    };
  }, [rootRef, reducedMotion]);
}
