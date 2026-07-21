/* ===================================================================
   CreatorTank — Framer Motion Animation Presets
   Consistent, premium animations throughout the application
   =================================================================== */

import type { Transition } from 'framer-motion';

// --- Shared Physics Constants ---
export const SPRING_CONFIG = { type: 'spring' as const, damping: 25, stiffness: 200 };
export const SPRING_GENTLE = { type: 'spring' as const, damping: 28, stiffness: 220 };
export const EASE_OUT: [number, number, number, number] = [0.4, 0, 0.2, 1];

// --- View Transitions ---
export const viewTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: EASE_OUT } as Transition,
};

// --- Panel Slide-in (from right) ---
export const panelSlideIn = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
  transition: SPRING_GENTLE,
};

// --- Overlay / Backdrop ---
export const overlayFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 } as Transition,
};

// --- Modal Content ---
export const modalPop = {
  initial: { opacity: 0, scale: 0.96, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 12 },
  transition: { duration: 0.2, ease: EASE_OUT } as Transition,
};

// --- Search Modal (Command Palette) ---
export const searchModalPop = {
  initial: { opacity: 0, scale: 0.97, y: -16 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.97, y: -16 },
  transition: { duration: 0.18 } as Transition,
};

// --- List Item ---
export const listItem = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0 },
};

// --- Empty State Entrance ---
export const emptyStateEntrance = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { delay: 0.15, type: 'spring' as const, damping: 20 } as Transition,
};

// --- Skeleton Pulse ---
export const skeletonPulse = {
  animate: { opacity: [0.4, 0.7, 0.4] },
  transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const },
};
