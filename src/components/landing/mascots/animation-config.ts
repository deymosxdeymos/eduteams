/** Shared animation presets matching family.co's mascot animation system */

/** Eye blink: mostly open, two quick blinks */
export const blinkAnimation = {
  animate: { scaleY: [1, 1, 1, 1, 1, 0.05, 1, 1, 1, 0.05, 1] },
  transition: { duration: 1, repeatDelay: 3, repeat: Infinity, ease: 'easeInOut' as const },
};

/** Arm sway: gentle rotation back and forth */
export const armSwayLeft = {
  animate: { rotate: [0, 12, 0] },
  transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' as const },
};

export const armSwayRight = {
  animate: { rotate: [0, -12, 0] },
  transition: { duration: 5.3, repeat: Infinity, ease: 'easeInOut' as const },
};

/** Leg sway: subtle back and forth */
export const legSwayLeft = {
  animate: { rotate: [0, -8, 0] },
  transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const },
};

export const legSwayRight = {
  animate: { rotate: [0, 6, 0] },
  transition: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' as const },
};

/** Continuous spin for accessories (stars, wheels) */
export const spinSlow = {
  animate: { rotate: 360 },
  transition: { duration: 10, repeat: Infinity, ease: 'linear' as const },
};

export const spinMedium = {
  animate: { rotate: 360 },
  transition: { duration: 6, repeat: Infinity, ease: 'linear' as const },
};
