'use client';

import { motion } from 'framer-motion';
import { MessageSquareWarning } from 'lucide-react';
import Image from 'next/image';

interface SkillsQuizProps {
  skills: string[];
  onAnswerAction: (skillIndex: number, value: number) => void;
  hasError?: boolean;
  answers: Record<number, number>;
}

export default function SkillsQuiz({
  skills,
  onAnswerAction,
  hasError = false,
  answers,
}: SkillsQuizProps) {
  const likertScale = [
    {
      icon: 'Novice',
      label: 'Pemula',
      description: 'Belum pernah atau sangat jarang menggunakan',
      value: 1,
    },
    {
      icon: 'Advanced-Beginner',
      label: 'Pemula\nLanjut',
      description: 'Pernah menggunakan tapi masih butuh bantuan',
      value: 2,
    },
    {
      icon: 'Competent',
      label: 'Kompeten',
      description: 'Bisa menggunakan dengan baik dan mandiri',
      value: 3,
    },
    {
      icon: 'Proficient',
      label: 'Mahir',
      description: 'Sangat ahli dan bisa mengajari orang lain',
      value: 4,
    },
    {
      icon: 'Expert',
      label: 'Jago\nBanget',
      description: 'Master level, bisa membuat inovasi baru',
      value: 5,
    },
  ];

  const handleSelection = (skillIndex: number, value: number) => {
    onAnswerAction(skillIndex, value);
  };

  return (
    <div className='space-y-8'>
      {skills.map((skill, skillIndex) => (
        <div
          key={skillIndex}
          role='group'
          className='space-y-6'
          id={`skill-${skillIndex}`}
        >
          <div className='mb-2'>
            <div
              className={`rounded-lg px-6 py-4 ${hasError && !answers[skillIndex] ? 'border border-red-700' : 'border border-transparent'}`}
            >
              <div className='text-center mb-6'>
                <p className='text-md font-normal text-black'>
                  Seberapa mahir kamu dengan keahlian <strong>{skill}</strong>?
                </p>
              </div>

              <div className='flex items-center justify-between relative px-8 max-w-4xl mx-auto'>
                <div className='text-center text-md text-red-400 font-light'>
                  Pemula
                </div>

                <div className='flex items-start justify-between relative flex-1 mx-8'>
                  {likertScale.map(item => (
                    <motion.div
                      key={item.value}
                      className='relative z-10 flex flex-col items-center space-y-3 cursor-pointer'
                      onClick={() => handleSelection(skillIndex, item.value)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      animate={{
                        scale:
                          answers[skillIndex] === item.value ? [1, 1.15] : 1,
                        y: answers[skillIndex] === item.value ? -5 : 0,
                      }}
                      transition={{
                        duration: 0.15,
                        ease: 'easeOut',
                      }}
                    >
                      <div className='w-16 h-16 bg-white flex items-center justify-center'>
                        <Image
                          src={`/quiz/skills/${item.icon}.svg`}
                          width={48}
                          height={48}
                          alt={item.label}
                          className='object-contain'
                        />
                      </div>
                      <div className='text-center'>
                        <div className='text-xs font-medium text-gray-700 whitespace-pre-line'>
                          {item.label}
                        </div>
                        <div className='text-xs text-gray-500 mt-1 max-w-20 leading-tight'>
                          {item.description}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  <div className='absolute top-8 left-0 right-0 h-1 bg-gray-300 z-[1]' />
                </div>

                <div className='text-md text-green-400 font-light'>
                  Jago Banget
                </div>
              </div>

              {hasError && !answers[skillIndex] && (
                <motion.div
                  key={`error-${skillIndex}`}
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
