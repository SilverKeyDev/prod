export const ONBOARDING_HEADER_SPRING = {
  type: "spring",
  stiffness: 600,
  damping: 35,
  mass: 0.7,
} as const;

export const ONBOARDING_HEADER_FADE = { type: "tween", ease: "easeOut", duration: 0.22 } as const;

export const ONBOARDING_HEADER_INSTANT = { type: "tween", duration: 0 } as const;

export const ONBOARDING_HEADER_MIN_SCALE = 0.2;
