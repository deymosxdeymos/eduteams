"use client";

import * as stylex from "@stylexjs/stylex";
import { LazyMotion, MotionConfig, domAnimation, m, type MotionProps } from "motion/react";
import Image from "next/image";
import { styles } from "./home-hero.styles";

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
    <m.a
      {...stylex.props(styles.brand)}
      href="/"
      aria-label="EquiTeam, halaman utama"
      {...brandMotion}
    >
      <span {...stylex.props(styles.brandMark)}>
        <Image
          {...stylex.props(styles.brandImage)}
          src="/brand/hero-mark.svg"
          width={52}
          height={56}
          alt=""
          loading="eager"
        />
      </span>
      <span>
        <strong {...stylex.props(styles.brandStrong)}>Equi</strong>Team
      </span>
    </m.a>
  );
}

function HeroCopy() {
  return (
    <>
      <m.h1 id="hero-title" {...stylex.props(styles.heading)} {...titleMotion}>
        Di Mana <mark {...stylex.props(styles.headingHighlight)}>Keadilan</mark>
        <span {...stylex.props(styles.headingSecondLine)}>Menciptakan Keunggulan</span>
      </m.h1>
      <m.p {...stylex.props(styles.description)} {...descriptionMotion}>
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
    <m.div {...stylex.props(styles.ctaMotion)} {...callToActionMotion}>
      <button {...stylex.props(styles.cta)} type="button" disabled>
        <Image
          {...stylex.props(styles.ctaImage)}
          src="/brand/google.svg"
          width={24}
          height={24}
          alt=""
          loading="eager"
        />
        Masuk dengan Google
      </button>
    </m.div>
  );
}

function HeroMascot() {
  return (
    <m.div {...stylex.props(styles.mascot)} aria-hidden="true" {...mascotMotion}>
      <Image
        {...stylex.props(styles.mascotImage)}
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
    <section {...stylex.props(styles.hero)} aria-labelledby="hero-title">
      <Brand />
      <LanguageControl />
      <div {...stylex.props(styles.content)}>
        <HeroCopy />
      </div>
      <HeroMascot />
      <div {...stylex.props(styles.curve)} aria-hidden="true">
        <Image
          {...stylex.props(styles.curveImage)}
          src="/brand/hero-curve.svg"
          fill
          sizes="100vw"
          alt=""
          loading="eager"
        />
      </div>
    </section>
  );
}

function LanguageControl() {
  return (
    <button {...stylex.props(styles.language)} type="button" aria-label="Bahasa Indonesia" disabled>
      <span {...stylex.props(styles.languagePill)} aria-hidden="true" />
      <span>ID</span>
      <span {...stylex.props(styles.languageFlag)}>
        <Image
          {...stylex.props(styles.languageFlagImage)}
          src="/brand/indonesia.png"
          fill
          sizes="47px"
          alt=""
          loading="eager"
        />
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
