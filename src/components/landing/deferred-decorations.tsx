"use client";

import dynamic from "next/dynamic";

const HeroMbtiCollage = dynamic(
  () =>
    import("@/components/landing/hero-mbti-collage").then((mod) => ({
      default: mod.HeroMbtiCollage,
    })),
  {
    ssr: false,
    loading: () => null,
  },
);

const AnimatedEntj = dynamic(
  () =>
    import("@/components/landing/animated-entj").then((mod) => ({
      default: mod.AnimatedEntj,
    })),
  {
    ssr: false,
    loading: () => null,
  },
);

export function DeferredHeroMbtiCollage() {
  return <HeroMbtiCollage />;
}

export function DeferredAnimatedEntj() {
  return <AnimatedEntj />;
}
