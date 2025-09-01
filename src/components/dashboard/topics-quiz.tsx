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
    { icon: 'Strongly-Disagree', label: 'Sangat Tidak\nTertarik', value: 1 },
    { icon: 'Disagree', label: 'Tidak Tertarik', value: 2 },
    { icon: 'Neutral', label: 'Netral', value: 3 },
    { icon: 'Agree', label: 'Tertarik', value: 4 },
    { icon: 'Strongly-Agree', label: 'Sangat Tertarik', value: 5 },
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
                  Seberapa Tertarik Anda dengan topik <strong>{topic}</strong>?
                </p>
              </div>

              <div className='flex items-center justify-between relative px-8 max-w-4xl mx-auto'>
                <div className='text-center text-md text-red-400 font-light'>
                  Sangat Tidak
                  <br />
                  Tertarik
                </div>

                <div className='flex items-start justify-between relative flex-1 mx-8'>
                  {likertScale.map(item => (
                    <motion.div
                      key={item.value}
                      className='relative z-10 flex flex-col items-center space-y-3 cursor-pointer'
                      onClick={() => handleSelection(topicIndex, item.value)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      animate={{
                        scale:
                          answers[topicIndex] === item.value ? [1, 1.15] : 1,
                        y: answers[topicIndex] === item.value ? -5 : 0,
                      }}
                      transition={{
                        duration: 0.15,
                        ease: 'easeOut',
                      }}
                    >
                      <div className='w-16 h-16 bg-white flex items-center justify-center'>
                        <Image
                          src={`/mbti-test/${item.icon}${answers[topicIndex] === item.value ? '' : '-not-active'}.svg`}
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

                <div className='text-md text-green-400 font-light'>
                  Sangat
                  <br />
                  Tertarik
                </div>
              </div>

              {hasError && !answers[topicIndex] && (
                <motion.div
                  key={`error-${topicIndex}`}
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{
                    opacity: 1,
                    height: 'auto',
                    y: 0,
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
              )}
            </div>
          </div>

          {!hasError && <div className='border-b border-gray-300 w-full'></div>}
        </div>
      ))}
    </div>
  );
}
