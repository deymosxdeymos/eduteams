'use client';

import { motion } from 'framer-motion';
import { MessageSquareWarning } from 'lucide-react';
import Image from 'next/image';

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
  const selectedValue = typeof initialValue === 'number' ? initialValue : null;

  const likertScale = [
    {
      icon: 'Strongly-Disagree',
      label: 'Sangat Tidak\nSetuju',
      value: 1,
      size: 64,
    },
    { icon: 'Disagree', label: 'Tidak Setuju', value: 2, size: 56 },
    { icon: 'Neutral', label: 'Netral', value: 3, size: 48 },
    { icon: 'Agree', label: 'Setuju', value: 4, size: 56 },
    { icon: 'Strongly-Agree', label: 'Sangat Setuju', value: 5, size: 64 },
  ];

  const handleSelection = (value: number) => {
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

          <div className='flex items-center justify-center max-w-5xl mx-auto'>
            {likertScale.map((item, index) => (
              <div key={item.value} className='flex items-center'>
                <motion.div
                  className='flex flex-col items-center space-y-3 cursor-pointer'
                  onClick={() => handleSelection(item.value)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    scale: selectedValue === item.value ? 1.1 : 1,
                    y: selectedValue === item.value ? -5 : 0,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                  }}
                >
                  <Image
                    src={`/mbti-test/${item.icon}${selectedValue === item.value ? '' : '-not-active'}.svg`}
                    width={item.size}
                    height={item.size}
                    alt={item.label}
                    className='object-contain'
                  />
                  <div className='text-xs font-medium text-gray-700 whitespace-pre-line text-center'>
                    {item.label}
                  </div>
                </motion.div>
                {index < likertScale.length - 1 && (
                  <div className='h-1 w-16 bg-gray-300 mx-4' />
                )}
              </div>
            ))}
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
