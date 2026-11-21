import type { Transition, Variants } from "framer-motion"

/**
 * Calm, editorial motion tokens for MediSlot.
 * All presets use GPU-composited opacity & transform properties only.
 */
export const EDITORIAL_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

export const EDITORIAL_TRANSITION: Transition = {
  duration: 0.48,
  ease: EDITORIAL_EASE,
}

export const FAST_TRANSITION: Transition = {
  duration: 0.22,
  ease: EDITORIAL_EASE,
}

export const VIEWPORT_ONCE = {
  once: true,
  amount: 0.14,
} as const

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.52, ease: EDITORIAL_EASE },
  },
}

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.42, ease: EDITORIAL_EASE },
  },
}

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.065,
      delayChildren: 0.04,
    },
  },
}

export const cardRevealVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.44, ease: EDITORIAL_EASE },
  },
}

export const modalBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.16, ease: "easeIn" } },
}

export const modalDialogVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.28, ease: EDITORIAL_EASE },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 8,
    transition: { duration: 0.18, ease: "easeIn" },
  },
}
