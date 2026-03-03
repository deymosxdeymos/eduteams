'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { EstPMascot, IsfJMascot, InfJMascot, EntPMascot } from './mascots';

// --- Animation spring (family.co: mass 4, stiffness 800, damping 80) ---

const springEntry = {
  type: 'spring' as const,
  mass: 4,
  stiffness: 800,
  damping: 80,
  restDelta: 1e-4,
};

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      staggerDirection: -1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springEntry,
  },
};

// --- Character definitions ---

interface HeroCharacter {
  id: string;
  className: string;
  Mascot: React.ComponentType<{ className?: string }>;
  float: {
    y: {
      animate: { y: number[] };
      transition: {
        duration: number;
        delay: number;
        repeat: typeof Infinity;
        repeatType: 'mirror';
        ease: 'easeInOut';
      };
    };
    rotate: {
      animate: { rotate: number[] };
      transition: {
        duration: number;
        delay: number;
        repeat: typeof Infinity;
        repeatType: 'mirror';
        ease: 'easeInOut';
      };
    };
  };
}

const heroCharacters: HeroCharacter[] = [
  {
    id: 'estp',
    Mascot: EstPMascot,
    className:
      'left-[4%] bottom-[7%] z-10 w-[28%] max-w-[245px] sm:left-[7%] sm:bottom-[7%] sm:w-[24%] sm:max-w-[285px] lg:left-[8%] lg:bottom-[6%] lg:w-[24%] lg:max-w-[325px]',
    float: {
      y: {
        animate: { y: [-6.5, 0, -8.1] },
        transition: {
          duration: 2.9,
          delay: 0.08,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        },
      },
      rotate: {
        animate: { rotate: [-1.6, 2.2] },
        transition: {
          duration: 3.1,
          delay: 0.14,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        },
      },
    },
  },
  {
    id: 'isfj',
    Mascot: IsfJMascot,
    className:
      'left-[19%] bottom-[6%] z-20 w-[43%] max-w-[330px] sm:left-[21%] sm:bottom-[6%] sm:w-[37%] sm:max-w-[395px] lg:left-[22%] lg:bottom-[5%] lg:w-[37%] lg:max-w-[465px]',
    float: {
      y: {
        animate: { y: [-5.9, 0, -7.4] },
        transition: {
          duration: 2.7,
          delay: 0.18,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        },
      },
      rotate: {
        animate: { rotate: [-1.2, 1.8] },
        transition: {
          duration: 2.8,
          delay: 0.12,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        },
      },
    },
  },
  {
    id: 'infj',
    Mascot: InfJMascot,
    className:
      'right-[14%] bottom-[7%] z-30 w-[35%] max-w-[280px] sm:right-[15%] sm:bottom-[6%] sm:w-[31%] sm:max-w-[340px] lg:right-[15%] lg:bottom-[5%] lg:w-[31%] lg:max-w-[390px]',
    float: {
      y: {
        animate: { y: [-7.2, 0, -6.1] },
        transition: {
          duration: 3.2,
          delay: 0.06,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        },
      },
      rotate: {
        animate: { rotate: [-2.1, 1.4] },
        transition: {
          duration: 2.9,
          delay: 0.22,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        },
      },
    },
  },
  {
    id: 'entp',
    Mascot: EntPMascot,
    className:
      'right-[4%] bottom-[8%] z-0 w-[23%] max-w-[200px] sm:right-[6%] sm:bottom-[8%] sm:w-[20%] sm:max-w-[240px] lg:right-[6%] lg:bottom-[7%] lg:w-[20%] lg:max-w-[275px]',
    float: {
      y: {
        animate: { y: [-4.8, 0, -6.6] },
        transition: {
          duration: 2.6,
          delay: 0.16,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        },
      },
      rotate: {
        animate: { rotate: [-1.5, 2.5] },
        transition: {
          duration: 3,
          delay: 0.1,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        },
      },
    },
  },
];

// --- Individual Character component ---
// family.co pattern: stable randomized floats, two nested layers (y + rotate), draggable

function Character({ character }: { character: HeroCharacter }) {
  const shouldReduceMotion = useReducedMotion();

  const { Mascot } = character;

  return (
    <motion.div
      className={`absolute ${character.className}`}
      style={{ transformOrigin: 'center bottom' }}
      variants={itemVariants}
    >
      {/* Layer 1: Y float */}
      <motion.div
        style={{ transformOrigin: 'center bottom' }}
        {...(shouldReduceMotion ? {} : character.float.y)}
      >
        {/* Layer 2: Rotate float */}
        <motion.div
          style={{ transformOrigin: 'center bottom' }}
          {...(shouldReduceMotion ? {} : character.float.rotate)}
        >
          {/* Layer 3: Draggable with spring snap-back */}
          <motion.div
            drag={!shouldReduceMotion}
            dragSnapToOrigin
            dragElastic={0.12}
            dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
            dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
            style={{ cursor: shouldReduceMotion ? 'default' : 'grab' }}
            whileDrag={{ cursor: 'grabbing', scale: 1.04 }}
          >
            <Mascot className="h-auto w-full drop-shadow-xl" />
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// --- Main export ---

export function HeroMbtiCollage() {
  return (
    <motion.div
      className="animate-mascot relative mt-4 mb-6 h-[255px] w-full max-w-[980px] sm:h-[365px] md:h-[350px] lg:mb-0 lg:h-[420px]"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {heroCharacters.map((character) => (
        <Character key={character.id} character={character} />
      ))}
    </motion.div>
  );
}
