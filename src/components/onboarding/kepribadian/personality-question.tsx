'use client';

import { motion } from 'framer-motion';
import { MessageSquareWarning } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface PersonalityQuestionProps {
  question: string;
  onAnswerAction: (value: number) => void;
  hasError?: boolean;
  questionId?: number | string;
  initialValue?: number;
}

export default function PersonalityQuestion({
  question,
  onAnswerAction,
  hasError = false,
  questionId,
  initialValue,
}: PersonalityQuestionProps) {
  const [selectedValue, setSelectedValue] = useState<number | null>(
    initialValue || null
  );
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const likertScale = [
    { icon: 'sangat-tidak-setuju', label: 'Sangat Tidak\nSetuju', value: 1 },
    { icon: 'tidak-setuju', label: 'Tidak Setuju', value: 2 },
    { icon: 'netral', label: 'Netral', value: 3 },
    { icon: 'setuju', label: 'Setuju', value: 4 },
    { icon: 'sangat-setuju', label: 'Sangat Setuju', value: 5 },
  ];

  const handleSelection = (value: number) => {
    if (isAnimating) return; // Prevent clicks during animation
    setIsAnimating(true);
    setPreviousValue(selectedValue);
    setSelectedValue(value);
    onAnswerAction(value);
  };

  return (
    <div
      role='group'
      className='space-y-6'
      id={questionId ? `question-${questionId}` : undefined}
    >
      <div className='mb-2'>
        <div
          className={`rounded-lg px-6 py-4 ${hasError ? 'border border-red-700' : 'border border-transparent'}`}
        >
          <div className='text-center mb-6'>
            <p className='text-md font-normal text-black'>{question}</p>
          </div>

          <div className='flex items-center justify-between relative px-8 max-w-4xl mx-auto'>
            <div className='text-center text-md text-red-400 font-light'>
              Tidak <br />
              Setuju
            </div>

            <div className='flex items-start justify-between relative flex-1 mx-8'>
              {likertScale.map(item => (
                <motion.div
                  key={item.value}
                  className='relative z-10 flex flex-col items-center space-y-3 cursor-pointer'
                  onClick={() => handleSelection(item.value)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    scale:
                      selectedValue === item.value
                        ? [1, 1.15]
                        : previousValue === item.value
                          ? [1.15, 1]
                          : 1,
                    y: selectedValue === item.value ? -5 : 0,
                  }}
                  transition={{
                    duration: 0.15,
                    ease: 'easeOut',
                    delay: previousValue === item.value ? 0 : 0.05,
                  }}
                  onAnimationComplete={() => {
                    if (selectedValue === item.value) {
                      setIsAnimating(false);
                    }
                  }}
                >
                  <div className='w-16 h-16 bg-white flex items-center justify-center'>
                    <Image
                      src={`/mbti-test/${item.icon}${selectedValue === item.value ? '' : '-not-active'}.svg`}
                      width={48}
                      height={48}
                      alt={item.label}
                      className='object-contain'
                    />
                  </div>
                </motion.div>
              ))}

              <div className='absolute top-8 left-0 right-0 h-1 bg-gray-300 z-[1]' />
            </div>

            <div className='text-md text-green-400 font-light'>Setuju</div>
          </div>

          <motion.div
            key={hasError ? `error-${Date.now()}` : 'no-error'}
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{
              opacity: hasError ? 1 : 0,
              height: hasError ? 'auto' : 0,
              y: hasError ? 0 : -10,
            }}
            transition={{
              duration: 0.3,
              ease: 'easeOut',
            }}
            className='overflow-hidden'
          >
            <div className='flex items-center justify-start px-30 mt-4 text-red-700'>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  duration: 0.4,
                  type: 'spring',
                  stiffness: 200,
                  damping: 10,
                }}
              >
                <MessageSquareWarning className='w-4 h-4 mr-2' />
              </motion.div>
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.3,
                  delay: 0.1,
                  ease: 'easeOut',
                }}
                className='text-sm font-normal'
              >
                Pertanyaan ini wajib diisi
              </motion.span>
            </div>
          </motion.div>
        </div>
      </div>

      {!hasError && <div className='border-b border-gray-300 w-full'></div>}
    </div>
  );
}
