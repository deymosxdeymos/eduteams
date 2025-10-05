'use client';

import {
  AnimatePresence,
  type MotionProps,
  motion,
  type ValueAnimationTransition,
} from 'framer-motion';
import type React from 'react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';

interface TextRotateProps extends React.HTMLAttributes<HTMLDivElement> {
  texts: string[];
  as?: React.ElementType;
  initial?: MotionProps['initial'] | MotionProps['initial'][];
  animate?: MotionProps['animate'] | MotionProps['animate'][];
  exit?: MotionProps['exit'] | MotionProps['exit'][];
  rotationInterval?: number;
  transition?: ValueAnimationTransition;
  staggerDuration?: number;
  staggerFrom?: 'first' | 'last' | 'center' | 'random' | number;
  loop?: boolean;
  auto?: boolean;
  splitBy?: 'words' | 'characters' | 'lines' | string;
  onNext?: (index: number) => void;
  mainClassName?: string;
  splitLevelClassName?: string;
  elementLevelClassName?: string;
}

export interface TextRotateRef {
  next: () => void;
  previous: () => void;
  jumpTo: (index: number) => void;
  reset: () => void;
}

export const TextRotate = forwardRef<TextRotateRef, TextRotateProps>(
  (
    {
      texts,
      as: Component = 'span',
      initial = { y: '100%', opacity: 0 },
      animate = { y: 0, opacity: 1 },
      exit = { y: '-120%', opacity: 0 },
      rotationInterval = 2000,
      transition = { type: 'spring', damping: 25, stiffness: 300 },
      staggerDuration = 0,
      staggerFrom = 'first',
      loop = true,
      auto = true,
      splitBy = 'words',
      onNext,
      mainClassName,
      splitLevelClassName,
      elementLevelClassName,
      className,
      ...props
    },
    ref
  ) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const next = useCallback(() => {
      setCurrentIndex(prev => {
        const nextIndex = loop
          ? (prev + 1) % texts.length
          : Math.min(prev + 1, texts.length - 1);
        onNext?.(nextIndex);
        return nextIndex;
      });
    }, [loop, texts.length, onNext]);

    const previous = () => {
      setCurrentIndex(prev => {
        const prevIndex = loop
          ? (prev - 1 + texts.length) % texts.length
          : Math.max(prev - 1, 0);
        return prevIndex;
      });
    };

    const jumpTo = (index: number) => {
      setCurrentIndex(Math.max(0, Math.min(index, texts.length - 1)));
    };

    const reset = () => {
      setCurrentIndex(0);
    };

    useImperativeHandle(ref, () => ({
      next,
      previous,
      jumpTo,
      reset,
    }));

    useEffect(() => {
      if (auto) {
        const mediaQuery = window.matchMedia(
          '(prefers-reduced-motion: reduce)'
        );
        const shouldAnimate = !mediaQuery.matches;

        if (shouldAnimate) {
          intervalRef.current = setInterval(next, rotationInterval);
        }

        const handleChange = (event: MediaQueryListEvent) => {
          if (event.matches && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          } else if (!event.matches && !intervalRef.current) {
            intervalRef.current = setInterval(next, rotationInterval);
          }
        };

        if (typeof mediaQuery.addEventListener === 'function') {
          mediaQuery.addEventListener('change', handleChange);
        } else {
          mediaQuery.addListener(handleChange);
        }

        return () => {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          if (typeof mediaQuery.removeEventListener === 'function') {
            mediaQuery.removeEventListener('change', handleChange);
          } else {
            mediaQuery.removeListener(handleChange);
          }
        };
      }
    }, [auto, rotationInterval, next]);

    const splitText = (text: string) => {
      switch (splitBy) {
        case 'words':
          return text.split(' ');
        case 'characters':
          return text.split('');
        case 'lines':
          return text.split('\n');
        default:
          return text.split(splitBy);
      }
    };

    const getStaggerDelay = (index: number, total: number) => {
      if (staggerDuration === 0) return 0;

      let startIndex: number;
      if (staggerFrom === 'first') startIndex = 0;
      else if (staggerFrom === 'last') startIndex = total - 1;
      else if (staggerFrom === 'center') startIndex = Math.floor(total / 2);
      else if (staggerFrom === 'random')
        startIndex = Math.floor(Math.random() * total);
      else startIndex = Math.max(0, Math.min(staggerFrom, total - 1));

      return Math.abs(index - startIndex) * staggerDuration;
    };

    const getAnimationProps = (index: number, propArray: unknown) => {
      if (Array.isArray(propArray)) {
        return propArray[index % propArray.length];
      }
      return propArray;
    };

    const currentText = texts[currentIndex] || '';
    const segments = splitText(currentText);

    return (
      <Component
        className={cn('inline-block', mainClassName, className)}
        {...props}
      >
        <AnimatePresence mode='wait' initial={false}>
          <motion.span
            key={currentIndex}
            className={cn('inline-block', splitLevelClassName)}
          >
            {segments.map((segment, segmentIndex) => (
              <motion.span
                key={segmentIndex}
                className={cn(
                  'inline-block motion-reduce:transform-none',
                  elementLevelClassName
                )}
                initial={getAnimationProps(segmentIndex, initial)}
                animate={getAnimationProps(segmentIndex, animate)}
                exit={getAnimationProps(segmentIndex, exit)}
                transition={{
                  ...transition,
                  delay: getStaggerDelay(segmentIndex, segments.length),
                }}
              >
                {segment}
                {splitBy === 'words' &&
                  segmentIndex < segments.length - 1 &&
                  ' '}
              </motion.span>
            ))}
          </motion.span>
        </AnimatePresence>
      </Component>
    );
  }
);

TextRotate.displayName = 'TextRotate';
