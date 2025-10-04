'use client';

import {
  type AnimationOptions,
  motion,
  stagger,
  useAnimate,
} from 'framer-motion';
import { useState } from 'react';

interface TextProps {
  label: string;
  reverse?: boolean;
  transition?: AnimationOptions;
  staggerDuration?: number;
  staggerFrom?: 'first' | 'last' | 'center' | number;
  className?: string;
  onClick?: () => void;
}

const LetterSwapForward = ({
  label,
  reverse = true,
  transition = {
    type: 'spring',
    duration: 0.7,
  },
  staggerDuration = 0.03,
  staggerFrom = 'first',
  className,
  onClick,
  ...props
}: TextProps) => {
  const [scope, animate] = useAnimate();
  const [blocked, setBlocked] = useState(false);

  const hoverStart = () => {
    if (blocked) return;

    setBlocked(true);

    // Function to merge user transition with stagger and delay
    const mergeTransition = (baseTransition: AnimationOptions) => ({
      ...baseTransition,
      delay: stagger(staggerDuration, {
        from: staggerFrom,
      }),
    });

    animate(
      '.letter',
      { y: reverse ? '100%' : '-100%' },
      mergeTransition(transition)
    ).then(() => {
      animate(
        '.letter',
        {
          y: 0,
        },
        {
          duration: 0,
        }
      ).then(() => {
        setBlocked(false);
      });
    });

    animate(
      '.letter-secondary',
      {
        top: '0%',
      },
      mergeTransition(transition)
    ).then(() => {
      animate(
        '.letter-secondary',
        {
          top: reverse ? '-100%' : '100%',
        },
        {
          duration: 0,
        }
      );
    });
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Animation component used inside interactive elements
    // biome-ignore lint/a11y/useKeyWithClickEvents: Animation component used inside interactive elements
    <span
      className={`flex justify-center items-center relative overflow-hidden  ${className} `}
      onMouseEnter={hoverStart}
      onClick={onClick}
      {...(onClick && {
        onKeyDown: (e: React.KeyboardEvent) => e.key === 'Enter' && onClick(),
        role: 'button',
        tabIndex: 0,
      })}
      ref={scope}
      {...props}
    >
      <span className='sr-only'>{label}</span>

      {label.split('').map((letter: string, i: number) => {
        return (
          <span
            className='whitespace-pre relative flex'
            key={`letter-${i}-${letter}`}
            aria-hidden={true}
          >
            <motion.span className={`relative letter`} style={{ top: 0 }}>
              {letter}
            </motion.span>
            <motion.span
              className='absolute letter-secondary '
              style={{ top: reverse ? '-100%' : '100%' }}
            >
              {letter}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
};

export default LetterSwapForward;
