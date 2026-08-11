import type { Transition, Variants } from "framer-motion";

/** Easing signature premium — fluidité Gozem */
export const EASE_SMOOTH = [0.22, 1, 0.36, 1] as const;
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export const pageTransition: Transition = {
  duration: 0.35,
  ease: EASE_SMOOTH,
};

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

/** Cascade reveal — stagger 60ms */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_SMOOTH },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE_OUT_EXPO },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: EASE_SMOOTH },
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 48 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.9, ease: EASE_OUT_EXPO },
  },
};

/** Orbes ambients flottants */
export const floatOrb = (delay = 0): Variants => ({
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: [0.4, 0.7, 0.4],
    scale: [1, 1.08, 1],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    },
  },
});

export const tapScale = { scale: 0.97 };
export const hoverLift = { y: -4, transition: { duration: 0.3, ease: EASE_SMOOTH } };
