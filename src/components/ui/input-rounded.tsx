'use client';

import type { Easing } from 'framer-motion';
import { AnimatePresence, animate, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { ComponentProps, ReactNode, RefObject } from 'react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { useMeasure } from '@/lib/use-measure';
import { cn } from '@/lib/utils';

type ForbiddenEventKeys =
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onDragCapture'
  | 'onDragEnter'
  | 'onDragLeave'
  | 'onDragOver'
  | 'onDragExit'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
  | 'onAnimationStartCapture'
  | 'onAnimationEndCapture'
  | 'onAnimationIterationCapture'
  | 'onTransitionEnd'
  | 'onTransitionEndCapture';

type NativeInputProps = Omit<ComponentProps<'input'>, ForbiddenEventKeys>;

interface InputRoundedProps extends NativeInputProps {
  onValidationChange?: (isValid: boolean) => void;
  hint?: ReactNode;
  hintWhenInvalid?: boolean;
  hintDelay?: number;
  showSuccessIndicator?: boolean;
  containerClassName?: string;
  floating?: boolean;
  resetDelay?: number;
  lockWhileSuccess?: boolean;
  clearOnSuccess?: boolean;
  validationTriggerKey?: unknown;
  animationTargetRef?: RefObject<HTMLElement | null>;
}

const MotionDiv = motion.div;
const MotionInput = motion.input;
const MotionParagraph = motion.p;
const MotionSpan = motion.span;

type ValidationState = 'default' | 'error' | 'success';

const shakeEase: Easing = [0.25, 0.46, 0.45, 0.94];

const successTransition = {
  type: 'spring' as const,
  stiffness: 110,
  damping: 12,
  mass: 0.1,
};

const resetAfterMs = 1000;

function getAnimationTarget(element: HTMLElement) {
  const parent = element.parentElement;
  if (parent instanceof HTMLElement && parent.classList.contains('relative')) {
    return parent;
  }
  return element;
}

const InputRounded = forwardRef<HTMLInputElement, InputRoundedProps>(
  (
    {
      className,
      type,
      onValidationChange,
      hint,
      hintWhenInvalid = Boolean(hint),
      hintDelay = 1000,
      showSuccessIndicator = true,
      containerClassName,
      floating = false,
      resetDelay = 2000,
      lockWhileSuccess = false,
      clearOnSuccess = false,
      validationTriggerKey,
      animationTargetRef,
      readOnly,
      onChange,
      ...rest
    },
    ref
  ) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const prevInvalidRef = useRef<boolean | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [validationState, setValidationState] =
      useState<ValidationState>('default');
    const [hintVisible, setHintVisible] = useState(false);
    const [measureRef, measuredRect] = useMeasure<HTMLDivElement>();
    const lastTriggerRef = useRef<unknown>(validationTriggerKey);

    useImperativeHandle(ref, () => {
      if (!internalRef.current) {
        throw new Error('Input ref is not assigned');
      }

      return internalRef.current;
    });

    const runErrorAnimation = useCallback(
      (target: HTMLElement) => {
        setValidationState('error');
        setHintVisible(false);

        const prefersReducedMotion =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
          animate(target, { opacity: [1, 0.7, 1] }, { duration: 0.3 });
        } else {
          animate(
            target,
            {
              transform: [
                'translateX(-24px)',
                'translateX(24px)',
                'translateX(-24px)',
                'translateX(24px)',
                'translateX(0px)',
              ],
            },
            { duration: 0.3, ease: shakeEase }
          );
        }

        if (hint && hintWhenInvalid) {
          if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
          hintTimeoutRef.current = setTimeout(() => {
            setHintVisible(true);
            hintTimeoutRef.current = null;
          }, hintDelay);
        }

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setValidationState('default');
          timeoutRef.current = null;
        }, resetAfterMs);
      },
      [hint, hintDelay, hintWhenInvalid]
    );

    useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      };
    }, []);

    const ariaInvalid = rest['aria-invalid'];
    const normalizedAriaInvalid =
      typeof ariaInvalid === 'boolean' ? ariaInvalid : ariaInvalid === 'true';
    const isUncontrolled = rest.value === undefined;

    useEffect(() => {
      const element = internalRef.current;
      if (!element) return;

      const invalid = normalizedAriaInvalid;
      const prevInvalid = prevInvalidRef.current;

      if (invalid !== prevInvalid && prevInvalid !== null) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);

        const animationTarget =
          animationTargetRef?.current ?? getAnimationTarget(element);

        if (invalid && !prevInvalid) {
          runErrorAnimation(animationTarget);
          onValidationChange?.(false);
        } else if (!invalid && prevInvalid) {
          setValidationState('success');
          setHintVisible(false);

          const prefersReducedMotion =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

          if (!prefersReducedMotion) {
            animate(
              animationTarget,
              { transform: 'translateX(0px)' },
              successTransition
            );
          }

          onValidationChange?.(true);

          timeoutRef.current = setTimeout(() => {
            setValidationState('default');
            if (clearOnSuccess && isUncontrolled && internalRef.current) {
              internalRef.current.value = '';
            }
            timeoutRef.current = null;
          }, resetDelay);
        }
      }

      prevInvalidRef.current = invalid;
    }, [
      normalizedAriaInvalid,
      isUncontrolled,
      onValidationChange,
      resetDelay,
      runErrorAnimation,
      clearOnSuccess,
      animationTargetRef,
    ]);

    useEffect(() => {
      const element = internalRef.current;
      if (!element) return;

      const animationTarget =
        animationTargetRef?.current ?? getAnimationTarget(element);

      if (
        validationTriggerKey !== lastTriggerRef.current &&
        normalizedAriaInvalid === true
      ) {
        runErrorAnimation(animationTarget);
        onValidationChange?.(false);
      }

      lastTriggerRef.current = validationTriggerKey;
    }, [
      normalizedAriaInvalid,
      onValidationChange,
      runErrorAnimation,
      validationTriggerKey,
      animationTargetRef,
    ]);

    const isSuccess = validationState === 'success';
    const isError = validationState === 'error';
    const shouldShowHint = Boolean(hint && hintVisible);
    const measuredHeight =
      measuredRect.height > 10 ? measuredRect.height : undefined;

    const stateClasses = cn(
      isError && 'text-destructive bg-destructive/5 ring-2 ring-destructive/60',
      isSuccess &&
        'text-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/50'
    );

    const baseClasses = cn(
      'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground bg-secondary h-12 w-full min-w-0 rounded-md border-0 px-4 py-3 text-base font-medium outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
      'transition-all duration-200 ease-out',
      'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/10 focus-visible:ring-offset-[3px] focus-visible:ring-offset-background',
      'aria-invalid:text-destructive'
    );

    return (
      <MotionDiv
        initial={false}
        animate={{ height: measuredHeight ?? 'auto' }}
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1], delay: 0.01 }}
        className={cn(
          'relative z-0 w-full',
          floating ? 'flex justify-center' : undefined,
          containerClassName
        )}
      >
        <div
          ref={measureRef}
          className={cn(
            'flex w-full flex-col gap-1',
            floating ? 'items-center' : undefined
          )}
          style={
            floating
              ? {
                  whiteSpace: 'nowrap',
                  width: 'fit-content',
                  padding: '0 12px',
                  position: 'relative',
                }
              : undefined
          }
        >
          <MotionDiv layout className='relative w-full'>
            <MotionInput
              layout
              type={type}
              data-slot='input'
              onChange={event => {
                if (!isSuccess && hintVisible) setHintVisible(false);
                onChange?.(event);
              }}
              className={cn(
                baseClasses,
                stateClasses,
                isSuccess && showSuccessIndicator && 'pr-11',
                floating ? 'w-[256px]' : undefined,
                className
              )}
              ref={internalRef}
              readOnly={(lockWhileSuccess && isSuccess) || readOnly}
              {...rest}
            />
            <AnimatePresence>
              {showSuccessIndicator && isSuccess ? (
                <MotionSpan
                  key='input-success-indicator'
                  initial={{ opacity: 0, scale: 0.8, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.6, y: -4 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500'
                >
                  <Check aria-hidden className='h-4 w-4' />
                </MotionSpan>
              ) : null}
            </AnimatePresence>
          </MotionDiv>
          <AnimatePresence initial={false}>
            {shouldShowHint ? (
              <MotionParagraph
                key='input-hint'
                initial={{ opacity: 0, filter: 'blur(4px)', y: -4 }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                exit={{ opacity: 0, filter: 'blur(4px)', y: -4 }}
                transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                className='text-xs font-medium text-muted-foreground'
                role='status'
                aria-live='polite'
              >
                {hint}
              </MotionParagraph>
            ) : null}
          </AnimatePresence>
        </div>
      </MotionDiv>
    );
  }
);

InputRounded.displayName = 'InputRounded';

export { InputRounded };
