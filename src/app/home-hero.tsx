"use client";

// oxlint-disable react-doctor/anchor-target-exists -- AboutSection renders the target in page.tsx.
import { LazyMotion, MotionConfig, domAnimation, m, type MotionProps } from "motion/react";
import Image from "next/image";

const enterTransition = {
  duration: 0.36,
  ease: [0.16, 1, 0.3, 1],
} as const;

const brandMotion: MotionProps = {
  initial: { y: -12 },
  animate: { y: 0 },
  transition: enterTransition,
};

const titleMotion: MotionProps = {
  initial: { y: 20 },
  animate: { y: 0 },
  transition: { ...enterTransition, delay: 0.06 },
};

const descriptionMotion: MotionProps = {
  initial: { y: 16 },
  animate: { y: 0 },
  transition: { ...enterTransition, delay: 0.12 },
};

const callToActionMotion: MotionProps = {
  initial: { y: 14 },
  animate: { y: 0 },
  whileHover: { y: -2 },
  whileTap: { scale: 0.98 },
  transition: { ...enterTransition, delay: 0.18 },
};

const mascotMotion: MotionProps = {
  initial: { y: 24, scale: 0.96 },
  animate: { y: 0, scale: 1 },
  transition: { ...enterTransition, delay: 0.22 },
};

function Brand() {
  return (
    <m.a className="brand" href="/" aria-label="EquiTeam, halaman utama" {...brandMotion}>
      <Image src="/equiteam-mascot.png" width={488} height={472} alt="" priority />
      <span>
        <strong>Equi</strong>Team
      </span>
    </m.a>
  );
}

function HeroCopy() {
  return (
    <>
      <m.h1 id="hero-title" {...titleMotion}>
        Di Mana <mark>Keadilan</mark>
        <span>Menciptakan Keunggulan</span>
      </m.h1>
      <m.p className="hero-description" {...descriptionMotion}>
        Setiap hasil yang hebat dimulai dengan tim yang hebat. Selamat datang di EquiTeam, mari kita
        mulai sesuatu yang luar biasa.
      </m.p>
      <m.div className="hero-cta-motion" {...callToActionMotion}>
        <a className="hero-cta" href="#tentang">
          Kenali EquiTeam
        </a>
      </m.div>
    </>
  );
}

function HeroMascot() {
  return (
    <m.div className="hero-mascot" aria-hidden="true" {...mascotMotion}>
      <Image src="/equiteam-mascot.png" width={488} height={472} alt="" priority />
    </m.div>
  );
}

function HeroScene() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <Brand />
      <div className="hero-content">
        <HeroCopy />
        <HeroMascot />
      </div>
      <Image
        className="hero-curve"
        src="/equiteam-curve.svg"
        width={1440}
        height={614}
        sizes="100vw"
        alt=""
        priority
      />
    </section>
  );
}

export function HomeHero() {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <HeroScene />
      </MotionConfig>
    </LazyMotion>
  );
}
