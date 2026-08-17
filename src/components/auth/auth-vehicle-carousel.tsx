"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AUTH_VEHICLE_SLIDES } from "@/lib/auth-vehicles";
import { EASE_OUT_EXPO, EASE_SMOOTH } from "@/lib/animations";
import { cn } from "@/lib/utils";

const AUTO_MS = 5200;

type AuthVehicleCarouselProps = {
  accent?: "client" | "pro";
};

export function AuthVehicleCarousel({
  accent = "client",
}: AuthVehicleCarouselProps) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const total = AUTH_VEHICLE_SLIDES.length;
  const slide = AUTH_VEHICLE_SLIDES[index]!;

  const goTo = useCallback(
    (next: number, dir: number) => {
      setDirection(dir);
      setIndex(((next % total) + total) % total);
    },
    [total],
  );

  const next = useCallback(() => goTo(index + 1, 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1, -1), [goTo, index]);

  useEffect(() => {
    if (paused || reduceMotion) return;
    const id = window.setInterval(next, AUTO_MS);
    return () => window.clearInterval(id);
  }, [next, paused, reduceMotion]);

  return (
    <aside
      className={cn("auth-visual", accent === "pro" && "auth-visual--pro")}
      aria-roledescription="carousel"
      aria-label="Véhicules Dépannage Express"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div className="auth-visual__media">
        <AnimatePresence initial={false} custom={direction} mode="sync">
          <motion.div
            key={slide.src}
            className="auth-visual__slide"
            custom={direction}
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 1.08, x: direction > 0 ? 40 : -40 }
            }
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : {
                    opacity: 0,
                    scale: 1.03,
                    x: direction > 0 ? -32 : 32,
                  }
            }
            transition={{ duration: reduceMotion ? 0.2 : 0.95, ease: EASE_OUT_EXPO }}
          >
            <motion.div
              className="auth-visual__zoom"
              initial={{ scale: 1 }}
              animate={{ scale: reduceMotion ? 1 : 1.1 }}
              transition={{
                duration: reduceMotion ? 0 : AUTO_MS / 1000,
                ease: "linear",
              }}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                priority={index === 0}
                sizes="(max-width: 960px) 100vw, 52vw"
                className="auth-visual__img"
                quality={90}
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <div className="auth-visual__scrim" aria-hidden />
        <div className="auth-visual__glow" aria-hidden />
      </div>

      <div className="auth-visual__content">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.caption}
            className="auth-visual__copy"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
            transition={{ duration: 0.75, ease: EASE_SMOOTH, delay: 0.12 }}
          >
            <p className="auth-visual__eyebrow">{slide.caption}</p>
            <p className="auth-visual__detail">{slide.detail}</p>
          </motion.div>
        </AnimatePresence>

        <div className="auth-visual__controls">
          <button
            type="button"
            className="auth-visual__nav"
            onClick={prev}
            aria-label="Image précédente"
          >
            <ChevronLeft size={18} strokeWidth={2.4} />
          </button>

          <div className="auth-visual__dots" role="tablist" aria-label="Diapositives">
            {AUTH_VEHICLE_SLIDES.map((item, i) => (
              <button
                key={item.src}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Véhicule ${i + 1}`}
                className={cn("auth-visual__dot", i === index && "is-active")}
                onClick={() => goTo(i, i > index ? 1 : -1)}
              />
            ))}
          </div>

          <button
            type="button"
            className="auth-visual__nav"
            onClick={next}
            aria-label="Image suivante"
          >
            <ChevronRight size={18} strokeWidth={2.4} />
          </button>
        </div>

        <div className="auth-visual__progress" aria-hidden>
          <motion.span
            key={`${index}-${paused ? "p" : "r"}`}
            className="auth-visual__progress-bar"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: paused || reduceMotion ? 0 : 1 }}
            transition={
              reduceMotion || paused
                ? { duration: 0 }
                : { duration: AUTO_MS / 1000, ease: "linear" }
            }
          />
        </div>
      </div>
    </aside>
  );
}
