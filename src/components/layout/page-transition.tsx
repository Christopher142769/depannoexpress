"use client";

import { motion } from "framer-motion";
import { pageTransition, pageVariants } from "@/lib/animations";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Wrapper de transition entre pages
 * fade + slide-up 16px, 350ms, easing premium
 */
export function PageTransition({ children }: PageTransitionProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}
