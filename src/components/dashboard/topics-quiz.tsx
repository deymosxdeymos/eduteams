'use client';

import { motion } from 'framer-motion';
import { MessageSquareWarning } from 'lucide-react';
import Image from 'next/image';

interface TopicsQuizProps {
  topics: string[];
  onAnswerAction: (topicIndex: number, value: number) => void;
  hasError?: boolean;
  answers: Record<number, number>;
}

export default function TopicsQuiz({
  topics,
  onAnswerAction,
  hasError = false,
  answers,
}: TopicsQuizProps) {
  const likertScale = [
    {
      icon: 'Strongly-Disagree',
      label: 'Sangat Tidak\nTertarik',
      value: 1,
      size: 64,
    },
    { icon: 'Disagree', label: 'Tidak Tertarik', value: 2, size: 56 },
    { icon: 'Neutral', label: 'Netral', value: 3, size: 48 },
    { icon: 'Agree', label: 'Tertarik', value: 4, size: 56 },
    { icon: 'Strongly-Agree', label: 'Sangat Tertarik', value: 5, size: 64 },
  ];

  const handleSelection = (topicIndex: number, value: number) => {
    onAnswerAction(topicIndex, value);
  };

  return (
    <div className='space-y-8'>
      {topics.map((topic, topicIndex) => (
        <div
          key={topicIndex}
          role='group'
          className='space-y-6'
          id={`topic-${topicIndex}`}
        >
          <div className='mb-2'>
            <div
              className={`rounded-lg px-6 py-4 ${hasError && !answers[topicIndex] ? 'border border-red-700' : 'border border-transparent'}`}
            >
              <div className='text-center mb-6'>
                <p className='text-md font-normal text-black'>
                  Seberapa Tertarik Anda dengan topik{' '}
                  <strong>
                    #{topicIndex + 1}: {topic}
                  </strong>
                  ?
                </p>
              </div>

              <div className='flex items-start justify-center max-w-5xl mx-auto'>
                {likertScale.map((item, index) => (
                  <div key={item.value} className='flex items-start'>
                    <motion.div
                      className='flex flex-col items-center space-y-3 cursor-pointer'
                      onClick={() => handleSelection(topicIndex, item.value)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      animate={{
                        scale: answers[topicIndex] === item.value ? 1.1 : 1,
                        y: answers[topicIndex] === item.value ? -5 : 0,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 25,
                      }}
                    >
                      <div
                        style={{ height: '64px' }}
                        className='flex items-center justify-center'
                      >
                        <Image
                          src={`/mbti-test/${item.icon}${answers[topicIndex] === item.value ? '' : '-not-active'}.svg`}
                          width={item.size}
                          height={item.size}
                          alt={item.label}
                          className='object-contain'
                        />
                      </div>
                      <div className='text-center'>
                        <div className='text-xs font-medium text-gray-700 whitespace-pre-line'>
                          {item.label}
                        </div>
                      </div>
                    </motion.div>
                    {index < likertScale.length - 1 && (
                      <div className='h-1 w-16 bg-gray-300 mx-4 mt-6' />
                    )}
                  </div>
                ))}
              </div>

              {hasError && !answers[topicIndex] && (
                <motion.div
                  key={`error-${topicIndex}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
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
              )}
            </div>
          </div>

          {!hasError && <div className='border-b border-gray-300 w-full'></div>}
        </div>
      ))}
    </div>
  );
}
