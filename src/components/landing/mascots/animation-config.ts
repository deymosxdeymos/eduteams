/**
 * Shared animation presets matching family.co's mascot animation system.
 *
 * Observed from family.co hero SVG (March 2026):
 *   - Arms swing ±17 deg, legs swing ±7–12 deg (about half-to-two-thirds of arms)
 *   - Left and right limbs use slightly different durations for asymmetry
 *   - All limbs pivot from their attachment point (shoulder / hip)
 */

/** Eye blink transition timing - used with clipPath eyelid rects */
export const blinkTransition = {
  duration: 1,
  repeatDelay: 3,
  repeat: Infinity,
  ease: "easeInOut" as const,
};

/** Arm sway: ±17 deg observed on family.co */
export const armSwayLeft = {
  animate: { rotate: [0, 17, 0, -17, 0] },
  transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const },
};

export const armSwayRight = {
  animate: { rotate: [0, -17, 0, 17, 0] },
  transition: { duration: 4.3, repeat: Infinity, ease: "easeInOut" as const },
};

/** Leg sway: ±7–12 deg observed on family.co (asymmetric L/R) */
export const legSwayLeft = {
  animate: { rotate: [0, -10, 0, 10, 0] },
  transition: { duration: 3.6, repeat: Infinity, ease: "easeInOut" as const },
};

export const legSwayRight = {
  animate: { rotate: [0, 12, 0, -12, 0] },
  transition: { duration: 3.9, repeat: Infinity, ease: "easeInOut" as const },
};

/** Continuous spin for accessories (stars, wheels) */
export const spinSlow = {
  animate: { rotate: 360 },
  transition: { duration: 10, repeat: Infinity, ease: "linear" as const },
};

export const spinMedium = {
  animate: { rotate: 360 },
  transition: { duration: 6, repeat: Infinity, ease: "linear" as const },
};
