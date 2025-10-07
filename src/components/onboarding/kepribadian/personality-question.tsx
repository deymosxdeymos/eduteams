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
    { icon: 'Strongly-Disagree', label: 'Sangat Tidak\nSetuju', value: 1 },
    { icon: 'Disagree', label: 'Tidak Setuju', value: 2 },
    { icon: 'Neutral', label: 'Netral', value: 3 },
    { icon: 'Agree', label: 'Setuju', value: 4 },
    { icon: 'Strongly-Agree', label: 'Sangat Setuju', value: 5 },
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

          <div className='flex items-center justify-between px-8 max-w-4xl mx-auto'>
            <div className='text-center text-md text-red-400 font-light'>
              Tidak <br />
              Setuju
            </div>

            <div className='flex items-start justify-center mx-8'>
              {likertScale.map((item, index) => (
                <div key={item.value} className='flex items-start'>
                  <motion.div
                    className='flex flex-col items-center space-y-3 cursor-pointer'
                    onClick={() => handleSelection(item.value)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{
                      scale:
                        selectedValue === item.value
                          ? 1.1
                          : previousValue === item.value
                            ? 1
                            : 1,
                      y: selectedValue === item.value ? -5 : 0,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 25,
                    }}
                    onAnimationComplete={() => {
                      if (selectedValue === item.value) {
                        setIsAnimating(false);
                      }
                    }}
                  >
                    <Image
                      src={`/mbti-test/${item.icon}${selectedValue === item.value ? '' : '-not-active'}.svg`}
                      width={48}
                      height={48}
                      alt={item.label}
                      className='object-contain'
                    />
                  </motion.div>
                  {index < likertScale.length - 1 && (
                    <div className='h-1 w-16 bg-gray-300 mx-4 mt-6' />
                  )}
                </div>
              ))}
            </div>

            <div className='text-md text-green-400 font-light'>Setuju</div>
          </div>

          <motion.div
            key={hasError ? `error-${Date.now()}` : 'no-error'}
            initial={{ opacity: 0, y: -10 }}
            animate={{
              opacity: hasError ? 1 : 0,
              y: hasError ? 0 : -10,
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30,
            }}
            className='overflow-hidden'
          >
            <div className='flex items-center justify-start px-30 mt-4 text-red-700'>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                }}
              >
                <MessageSquareWarning className='w-4 h-4 mr-2' />
              </motion.div>
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 30,
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
