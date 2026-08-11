"use client";

import { motion } from "framer-motion";
import { MapPin, Navigation, Clock } from "lucide-react";
import { slideInRight } from "@/lib/animations";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Aperçu carte live — marqueur pulse + trajet animé
 * (placeholder Mapbox — intégration réelle au module client)
 */
export function HeroMapPreview() {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className="relative w-full max-w-md mx-auto lg:mx-0 lg:max-w-none"
      initial={reduced ? false : "hidden"}
      animate="visible"
      variants={slideInRight}
    >
      <div className="card-premium overflow-hidden animate-float">
        {/* Barre titre */}
        <div className="glass-strong flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
            </span>
            <span className="text-xs font-semibold text-text-primary">Suivi en direct</span>
          </div>
          <span className="text-xs text-text-secondary flex items-center gap-1">
            <Clock className="h-3 w-3" />
            4 min
          </span>
        </div>

        {/* Zone carte stylisée */}
        <div className="relative h-64 sm:h-72 bg-bg-elevated overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-40" />

          {/* Route SVG animée */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 280" fill="none" preserveAspectRatio="xMidYMid slice">
            <motion.path
              d="M 60 220 Q 120 180 180 160 T 320 80"
              stroke="url(#routeGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              className={reduced ? "" : "route-line"}
              initial={reduced ? {} : { pathLength: 0, opacity: 0 }}
              animate={reduced ? {} : { pathLength: 1, opacity: 1 }}
              transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
            />
            <defs>
              <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1E73BE" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#2E9CF0" />
              </linearGradient>
            </defs>
          </svg>

          {/* Point client */}
          <div className="absolute bottom-12 left-12 flex flex-col items-center gap-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-red/20 border-2 border-brand-red">
              <MapPin className="h-4 w-4 text-brand-red" />
            </div>
            <span className="text-[10px] font-medium text-text-secondary bg-bg-surface/90 px-2 py-0.5 rounded-pill">Vous</span>
          </div>

          {/* Marqueur dépanneur — pulse halo */}
          <div className="absolute top-16 right-20">
            <div className="relative h-12 w-12">
              {!reduced && (
                <>
                  <span className="marker-pulse-ring" />
                  <span className="marker-pulse-ring marker-pulse-ring-delayed" />
                </>
              )}
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-grad-brand glow-blue-sm shadow-lg">
                <Navigation className="h-5 w-5 text-white" fill="white" />
              </div>
            </div>
            <div className="mt-2 text-center">
              <p className="text-[10px] font-bold text-text-primary">Koffi M.</p>
              <p className="text-[9px] text-brand-blue">Vulcanisateur · 1.2 km</p>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="flex gap-2 p-3 bg-bg-surface/80">
          <button type="button" className="flex-1 rounded-pill bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] text-xs font-semibold py-2 hover:bg-[#25D366]/25 transition-colors">
            WhatsApp
          </button>
          <button type="button" className="flex-1 rounded-pill bg-brand-blue/15 border border-brand-blue/30 text-brand-blue text-xs font-semibold py-2 hover:bg-brand-blue/25 transition-colors">
            Appeler
          </button>
        </div>
      </div>

      {/* Badge flottant ETA */}
      <motion.div
        className="absolute -bottom-4 -left-4 glass-strong rounded-card px-4 py-3 glow-blue-sm"
        initial={reduced ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-[10px] text-text-secondary uppercase tracking-wider">Arrivée estimée</p>
        <p className="font-display text-2xl font-bold text-gradient-brand">4 min</p>
      </motion.div>
    </motion.div>
  );
}
