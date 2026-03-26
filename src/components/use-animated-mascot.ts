"use client";

import { useAnimate } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { useWebHaptics } from "web-haptics/react";

export type MascotMood = "idle" | "annoyed" | "furious" | "defeated";

const THRESHOLDS = { annoyed: 3, furious: 8, defeated: 15 } as const;
const COOLDOWNS = { annoyed: 1500, furious: 2200, defeated: 3500 } as const;
const TAP_WINDOW = 2000;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randomTransform() {
  const x = randomBetween(-140, 140);
  const y = randomBetween(-200, 200);
  const rotate = randomBetween(-90, 90);
  const scaleX = randomBetween(0.4, 1.6);
  const scaleY = randomBetween(0.35, 1.7);
  return `translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${scaleX}, ${scaleY})`;
}

const SPRING_SMOOTH = { type: "spring" as const, duration: 0.55, bounce: 0 };
const SPRING_BOUNCE = { type: "spring" as const, duration: 0.5, bounce: 0.2 };

export function useAnimatedMascot() {
  const haptic = useWebHaptics();
  const [mood, setMood] = useState<MascotMood>("idle");
  const [returning, setReturning] = useState(false);
  const [scope, animate] = useAnimate<SVGSVGElement>();
  const tapsRef = useRef(0);
  const lastTapRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const springToIdle = useCallback(async () => {
    const s = scope.current;
    if (!s) return;

    const tasks = [
      animate(
        "[data-part='body']",
        { transform: "scaleY(1) scaleX(1) translateX(0px) rotate(0deg)" },
        SPRING_SMOOTH,
      ),
      animate(
        "[data-part='left-eye']",
        { transform: "scaleY(1) scaleX(1)" },
        { ...SPRING_BOUNCE, delay: 0.03 },
      ),
      animate(
        "[data-part='right-eye']",
        { transform: "scaleY(1) scaleX(1)" },
        { ...SPRING_BOUNCE, delay: 0.05 },
      ),
      animate(
        "[data-part='left-pupil']",
        { transform: "translate(0px, 0px) scale(1)" },
        { ...SPRING_SMOOTH, delay: 0.06 },
      ),
      animate(
        "[data-part='right-pupil']",
        { transform: "translate(0px, 0px) scale(1)" },
        { ...SPRING_SMOOTH, delay: 0.06 },
      ),
      animate(
        "[data-part='arm']",
        { transform: "rotate(0deg)" },
        { ...SPRING_BOUNCE, delay: 0.04 },
      ),
      animate(
        "[data-part='flag']",
        { transform: "rotate(0deg) scaleY(1)" },
        { ...SPRING_BOUNCE, delay: 0.06 },
      ),
      animate(
        "[data-part='cloud']",
        { transform: "translateY(0px) scale(1) rotate(0deg)", opacity: 0.9 },
        { ...SPRING_SMOOTH, delay: 0.08 },
      ),
      animate(
        "[data-part='cheek']",
        { opacity: 1, transform: "scale(1)" },
        { ...SPRING_SMOOTH, delay: 0.08 },
      ),
    ];

    await Promise.all(tasks);
    setMood("idle");
  }, [scope, animate]);

  const handlePoke = useCallback(() => {
    const now = Date.now();

    if (now - lastTapRef.current > TAP_WINDOW) {
      tapsRef.current = 0;
    }

    tapsRef.current += 1;
    lastTapRef.current = now;

    const taps = tapsRef.current;
    let nextMood: MascotMood = "annoyed";
    if (taps >= THRESHOLDS.defeated) nextMood = "defeated";
    else if (taps >= THRESHOLDS.furious) nextMood = "furious";

    const hapticType =
      nextMood === "defeated" ? "heavy" : nextMood === "furious" ? "medium" : "light";
    haptic.trigger(hapticType);

    setMood(nextMood);
    setReturning(false);

    const el = scope.current;
    if (el) {
      if (nextMood === "defeated") {
        el.style.transform = randomTransform();
      } else {
        el.style.transform = "";
      }

      if (nextMood !== "defeated") {
        el.style.scale = "0.95 1.03";
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.scale = "";
          });
        });
      }
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (tapsRef.current >= THRESHOLDS.defeated) {
        setReturning(true);
        if (scope.current) scope.current.style.transform = "";
      }
      tapsRef.current = 0;

      springToIdle();
    }, COOLDOWNS[nextMood]);
  }, [springToIdle, haptic, scope]);

  return { mood, returning, svgRef: scope, handlePoke };
}
