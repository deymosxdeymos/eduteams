"use client";

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
      <span className="brand-mark">
        <Image src="/brand/hero-mark.svg" width={52} height={56} alt="" loading="eager" />
      </span>
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
        Setiap tim hebat dimulai dari proses pembagian yang tepat.
        <br />
        Yuk, mulai petualangan seru kamu di sini.
      </m.p>
      <GoogleSignIn />
    </>
  );
}

function GoogleSignIn() {
  return (
    <m.div className="hero-cta-motion" {...callToActionMotion}>
      <button className="hero-cta" type="button" disabled>
        <Image src="/brand/google.svg" width={24} height={24} alt="" loading="eager" />
        Masuk dengan Google
      </button>
    </m.div>
  );
}

function HeroMascot() {
  return (
    <m.div className="hero-mascot" aria-hidden="true" {...mascotMotion}>
      <Image
        src="/mascots/equiteam-hero-illustration.png"
        width={730}
        height={289}
        sizes="(max-width: 480px) 86vw, (max-width: 768px) calc(27.5vw + 221px), (max-width: 1304px) 56vw, 730px"
        alt=""
        loading="eager"
      />
    </m.div>
  );
}

function HeroScene() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <Brand />
      <LanguageControl />
      <div className="hero-content">
        <HeroCopy />
      </div>
      <HeroMascot />
      <div className="hero-curve" aria-hidden="true">
        <Image src="/brand/hero-curve.svg" fill sizes="100vw" alt="" loading="eager" />
      </div>
    </section>
  );
}

function LanguageControl() {
  return (
    <button className="hero-language" type="button" aria-label="Bahasa Indonesia" disabled>
      <span>ID</span>
      <span className="hero-language-flag">
        <Image src="/brand/indonesia.png" fill sizes="47px" alt="" loading="eager" />
      </span>
    </button>
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
