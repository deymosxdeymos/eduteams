'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface InstructionModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
}

export default function InstructionModal({
  isOpen,
  onCloseAction,
}: InstructionModalProps) {
  const tInstructions = useTranslations('onboarding.kepribadian.instructions');
  const tLikert = useTranslations(
    'onboarding.kepribadian.instructions.likertScale'
  );
  const shouldReduceMotion = useReducedMotion();
  const contentInitial = shouldReduceMotion
    ? { opacity: 0 }
    : { scale: 0.98, opacity: 0 };
  const contentExit = shouldReduceMotion
    ? { opacity: 0 }
    : { scale: 0.98, opacity: 0 };
  const contentTransition = shouldReduceMotion
    ? { duration: 0.01 }
    : {
        duration: 0.2,
        delay: 0.04,
        ease: [0.215, 0.61, 0.355, 1] as const,
      };

  const likertScale = [
    {
      icon: 'Strongly-Disagree',
      label: tLikert('stronglyDisagree'),
    },
    {
      icon: 'Disagree',
      label: tLikert('disagree'),
    },
    {
      icon: 'Neutral',
      label: tLikert('neutral'),
    },
    {
      icon: 'Agree',
      label: tLikert('agree'),
    },
    {
      icon: 'Strongly-Agree',
      label: tLikert('stronglyAgree'),
    },
  ];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) onCloseAction();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className='max-w-4xl rounded-4xl border-0 bg-white p-0 overflow-visible'
      >
        <motion.div
          initial={contentInitial}
          animate={{ scale: 1, opacity: 1 }}
          exit={contentExit}
          transition={contentTransition}
          className='relative pt-12 px-12 pb-12'
        >
          <Image
            src='/mascot-yellow.svg'
            width={120}
            height={120}
            alt='mascot'
            className='absolute -top-20 left-1/2 transform -translate-x-1/2 z-10 w-auto h-auto'
          />
          <div className='text-center mb-8'>
            <DialogTitle className='text-3xl font-bold text-black mb-6 text-center'>
              {tInstructions('title')}
            </DialogTitle>

            <div className='text-left space-y-4 text-black leading-relaxed font-medium text-xl'>
              <p>1. {tInstructions('step1')}</p>
              <p>2. {tInstructions('step2')}</p>
              <p>3. {tInstructions('step3')}</p>
              <p>4. {tInstructions('step4')}</p>
            </div>
          </div>

          <div className='mb-8'>
            <div className='flex items-start justify-between relative px-4'>
              {likertScale.map(item => (
                <div
                  key={item.icon}
                  className='flex flex-col items-center space-y-3 relative z-10'
                >
                  <div className='bg-white flex items-center justify-center w-16 h-16'>
                    <Image
                      src={`/mbti-test/${item.icon}.svg`}
                      width={48}
                      height={48}
                      alt={item.label}
                      className='object-contain'
                    />
                  </div>
                  <p className='text-sm text-black text-center max-w-24 leading-tight whitespace-pre-line font-medium'>
                    {item.label}
                  </p>
                </div>
              ))}
              <div className='absolute top-8 left-12 right-12 h-1 bg-gray-300 z-0'></div>
            </div>
          </div>
          <div className='flex justify-center'>
            <Button
              variant='onboarding'
              size='long'
              onClick={onCloseAction}
              className='text-lg font-semibold'
            >
              {tInstructions('startNow')}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
