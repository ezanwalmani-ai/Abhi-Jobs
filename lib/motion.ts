/**
 * ABHI JOBS — Centralized Global Motion & Animation System
 *
 * Core Animation Principles:
 * - Standardized cubic-bezier easing: EASE_PREMIUM [0.22, 1, 0.36, 1]
 * - Predictable timing scale (micro 150-200ms, UI 250-300ms, normal reveals 400-600ms, heroes 650-850ms)
 * - Strict prefers-reduced-motion accessibility compliance
 * - Hardware-accelerated transforms (translateY, scale, opacity) with zero horizontal overflow
 * - Single viewport trigger (`once: true`) to eliminate scroll jitter
 */

import { Variants, Transition } from 'motion/react';

// ============================================================================
// 1. EASING CURVES & TRANSITIONS
// ============================================================================

/**
 * Standard ABHI JOBS brand cubic-bezier curve for luxurious, responsive momentum.
 */
export const EASE_PREMIUM: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_IN_OUT: [number, number, number, number] = [0.4, 0, 0.2, 1];
export const EASE_BOUNCE: [number, number, number, number] = [0.34, 1.56, 0.64, 1];

export const EASE_SPRING = {
  type: 'spring',
  stiffness: 320,
  damping: 32,
  mass: 1,
} as const;

// Standard Durations (in seconds for motion components)
export const DURATION = {
  micro: 0.18,
  hover: 0.25,
  page: 0.35,
  normal: 0.55,
  hero: 0.75,
  countUp: 1.0,
} as const;

// Helper transition functions
export const transitionPremium = (duration: number = DURATION.normal, delay: number = 0): Transition => ({
  duration,
  delay,
  ease: EASE_PREMIUM,
});

export const transitionFast = (delay: number = 0): Transition => ({
  duration: DURATION.micro,
  delay,
  ease: EASE_OUT,
});

// Viewport trigger settings for scroll reveals
export const VIEWPORT_ONCE = {
  once: true,
  amount: 0.15,
} as const;

export const VIEWPORT_CARD_ONCE = {
  once: true,
  amount: 0.08,
} as const;

// ============================================================================
// 2. STAGGER CONFIGURATIONS & TIMINGS
// ============================================================================

/**
 * Standard stagger interval (in seconds) between sequential child elements.
 * 60ms – 100ms range (default: 80ms / 0.08s).
 */
export const STAGGER_CHILDREN = 0.08;

export const STAGGER_CONFIG = {
  default: 0.08,
  fast: 0.05,
  cards: 0.07,
  slow: 0.12,
} as const;

// ============================================================================
// 3. STANDARDIZED MOTION VARIANTS (UPPERCASE)
// ============================================================================

/**
 * Standard Fade Up Entrance (translateY(30px) -> translateY(0), opacity 0 -> 1)
 */
export const FADE_UP_VARIANTS: Variants = {
  hidden: (custom?: { distance?: number }) => ({
    opacity: 0,
    y: custom?.distance ?? 30,
  }),
  visible: (custom?: { delay?: number; duration?: number; distance?: number }) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: custom?.duration ?? DURATION.normal,
      delay: custom?.delay ?? 0,
      ease: EASE_PREMIUM,
    },
  }),
};

/**
 * Subtle Fade In (opacity 0 -> 1)
 */
export const FADE_IN_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  visible: (custom?: { delay?: number; duration?: number }) => ({
    opacity: 1,
    transition: {
      duration: custom?.duration ?? DURATION.normal,
      delay: custom?.delay ?? 0,
      ease: EASE_PREMIUM,
    },
  }),
};

/**
 * Header & Banner Fade Down Entrance (translateY(-20px) -> translateY(0))
 */
export const FADE_DOWN_VARIANTS: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: (custom?: { delay?: number; duration?: number }) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: custom?.duration ?? DURATION.normal,
      delay: custom?.delay ?? 0,
      ease: EASE_PREMIUM,
    },
  }),
};

/**
 * Lateral Horizontal Reveals
 */
export const FADE_LEFT_VARIANTS: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: (custom?: { delay?: number; duration?: number }) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: custom?.duration ?? DURATION.normal,
      delay: custom?.delay ?? 0,
      ease: EASE_PREMIUM,
    },
  }),
};

export const FADE_RIGHT_VARIANTS: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: (custom?: { delay?: number; duration?: number }) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: custom?.duration ?? DURATION.normal,
      delay: custom?.delay ?? 0,
      ease: EASE_PREMIUM,
    },
  }),
};

/**
 * Scale In Entrance (scale 0.96 -> 1, opacity 0 -> 1)
 */
export const SCALE_IN_VARIANTS: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: (custom?: { delay?: number; duration?: number }) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: custom?.duration ?? DURATION.normal,
      delay: custom?.delay ?? 0,
      ease: EASE_PREMIUM,
    },
  }),
};

/**
 * Soft Blur Reveal (filter blur(6px) -> blur(0px))
 */
export const BLUR_REVEAL_VARIANTS: Variants = {
  hidden: { opacity: 0, filter: 'blur(6px)', y: 16 },
  visible: (custom?: { delay?: number; duration?: number }) => ({
    opacity: 1,
    filter: 'blur(0px)',
    y: 0,
    transition: {
      duration: custom?.duration ?? DURATION.normal,
      delay: custom?.delay ?? 0,
      ease: EASE_PREMIUM,
    },
  }),
};

/**
 * Stagger Container Parent Variants
 */
export const STAGGER_CONTAINER_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  visible: (custom?: { stagger?: number; delay?: number }) => ({
    opacity: 1,
    transition: {
      staggerChildren: custom?.stagger ?? STAGGER_CHILDREN,
      delayChildren: custom?.delay ?? 0.05,
    },
  }),
};

/**
 * Stagger Item Child Variants
 */
export const STAGGER_ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: EASE_PREMIUM,
    },
  },
};

/**
 * Hero Word Reveal Variants (word-by-word stagger sequence)
 */
export const HERO_WORD_CONTAINER_VARIANTS: Variants = {
  hidden: { opacity: 1 },
  visible: (custom?: { stagger?: number; delay?: number }) => ({
    opacity: 1,
    transition: {
      staggerChildren: custom?.stagger ?? STAGGER_CHILDREN,
      delayChildren: custom?.delay ?? 0.1,
    },
  }),
};

export const HERO_WORD_ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: EASE_PREMIUM,
    },
  },
};

/**
 * Interactive Controls (Cards & Buttons)
 */
export const CARD_HOVER_VARIANTS = {
  initial: { y: 0, scale: 1 },
  hover: {
    y: -4,
    scale: 1.008,
    transition: { duration: 0.25, ease: EASE_PREMIUM },
  },
  tap: {
    y: 0,
    scale: 0.99,
    transition: { duration: 0.15, ease: EASE_OUT },
  },
};

export const BUTTON_INTERACTION_VARIANTS = {
  initial: { scale: 1 },
  hover: { scale: 1.02, transition: { duration: 0.2, ease: EASE_PREMIUM } },
  tap: { scale: 0.98, transition: { duration: 0.1, ease: EASE_OUT } },
};

/**
 * Modal Dialogs & Backdrops
 */
export const MODAL_BACKDROP_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.22, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.18, ease: EASE_IN_OUT },
  },
};

export const MODAL_DIALOG_VARIANTS: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.26, ease: EASE_PREMIUM },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 6,
    transition: { duration: 0.18, ease: EASE_IN_OUT },
  },
};

/**
 * Dropdowns & Menus
 */
export const DROPDOWN_VARIANTS: Variants = {
  hidden: { opacity: 0, scale: 0.98, y: -4 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.2, ease: EASE_PREMIUM },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -3,
    transition: { duration: 0.15, ease: EASE_IN_OUT },
  },
};

/**
 * Notification Toasts
 */
export const TOAST_VARIANTS: Variants = {
  hiddenDesktop: { opacity: 0, x: 20, y: 0 },
  visibleDesktop: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.3, ease: EASE_PREMIUM },
  },
  exitDesktop: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2, ease: EASE_IN_OUT },
  },
  hiddenMobile: { opacity: 0, y: -16, x: 0 },
  visibleMobile: {
    opacity: 1,
    y: 0,
    x: 0,
    transition: { duration: 0.3, ease: EASE_PREMIUM },
  },
  exitMobile: {
    opacity: 0,
    y: -16,
    transition: { duration: 0.2, ease: EASE_IN_OUT },
  },
};

/**
 * Accessibility: Fallback reduced-motion variants without spatial displacement
 */
export const REDUCED_MOTION_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.25 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

// ============================================================================
// 4. BACKWARDS-COMPATIBLE ALIASES
// ============================================================================

export const fadeUpVariants = FADE_UP_VARIANTS;
export const fadeInVariants = FADE_IN_VARIANTS;
export const fadeDownVariants = FADE_DOWN_VARIANTS;
export const fadeLeftVariants = FADE_LEFT_VARIANTS;
export const fadeRightVariants = FADE_RIGHT_VARIANTS;
export const scaleInVariants = SCALE_IN_VARIANTS;
export const blurRevealVariants = BLUR_REVEAL_VARIANTS;
export const staggerContainerVariants = STAGGER_CONTAINER_VARIANTS;
export const staggerCardItemVariants = STAGGER_ITEM_VARIANTS;
export const heroWordContainerVariants = HERO_WORD_CONTAINER_VARIANTS;
export const heroWordItemVariants = HERO_WORD_ITEM_VARIANTS;
export const modalBackdropVariants = MODAL_BACKDROP_VARIANTS;
export const modalDialogVariants = MODAL_DIALOG_VARIANTS;
export const dropdownVariants = DROPDOWN_VARIANTS;
export const toastNotificationVariants = TOAST_VARIANTS;
export const reducedMotionVariants = REDUCED_MOTION_VARIANTS;

// ============================================================================
// 5. RE-EXPORT MOTION COMPONENTS FOR CENTRAL ACCESS
// ============================================================================

export { ScrollReveal } from '../components/motion/ScrollReveal';
export { HeroTextReveal } from '../components/motion/HeroTextReveal';
export { TextMaskReveal } from '../components/motion/TextMaskReveal';
export { ScrollProgress } from '../components/motion/ScrollProgress';
export { StaggerGroup, StaggerItem } from '../components/motion/StaggerGroup';
export { CountUpNumber } from '../components/motion/CountUpNumber';
export { AnimatedProgressBar } from '../components/motion/AnimatedProgress';
export { ImageReveal } from '../components/motion/ImageReveal';
