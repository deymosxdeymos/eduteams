"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EntJMascot } from "./mascots/entj";

const springEntry = {
  type: "spring" as const,
  mass: 4,
  stiffness: 800,
  damping: 80,
  restDelta: 1e-4,
};

const entjFloat = {
  y: {
    animate: { y: [-5.8, 0, -7.1] },
    transition: {
      duration: 3.2,
      delay: 0.12,
      repeat: Infinity,
      repeatType: "mirror" as const,
      ease: "easeInOut" as const,
    },
  },
  rotate: {
    animate: { rotate: [-1.3, 1.9] },
    transition: {
      duration: 3.4,
      delay: 0.08,
      repeat: Infinity,
      repeatType: "mirror" as const,
      ease: "easeInOut" as const,
    },
  },
};

export function AnimatedEntj() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="h-auto w-full"
      initial={{ opacity: 0, y: 40, scale: 0 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...springEntry, delay: 0.3 }}
    >
      {/* Layer 1: Y float */}
      <motion.div
        style={{ transformOrigin: "center bottom" }}
        {...(shouldReduceMotion ? {} : entjFloat.y)}
      >
        {/* Layer 2: Rotate float */}
        <motion.div
          style={{ transformOrigin: "center bottom" }}
          {...(shouldReduceMotion ? {} : entjFloat.rotate)}
        >
          {/* Layer 3: Draggable with spring snap-back */}
          <motion.div
            drag={!shouldReduceMotion}
            dragSnapToOrigin
            dragElastic={0.12}
            dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
            dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
            style={{ cursor: shouldReduceMotion ? "default" : "grab" }}
            whileDrag={{ cursor: "grabbing", scale: 1.05 }}
          >
            <EntJMascot className="h-auto w-auto" />
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
