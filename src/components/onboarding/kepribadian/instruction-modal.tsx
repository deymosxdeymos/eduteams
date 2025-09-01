'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface InstructionModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
}

export default function InstructionModal({
  isOpen,
  onCloseAction,
}: InstructionModalProps) {
  const likertScale = [
    { icon: 'Strongly-Disagree', label: 'Sangat Tidak\nSetuju' },
    { icon: 'Disagree', label: 'Tidak Setuju' },
    { icon: 'Neutral', label: 'Netral' },
    { icon: 'Agree', label: 'Setuju' },
    { icon: 'Strongly-Agree', label: 'Sangat Setuju' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'
        >
          <motion.div
            initial={{ y: -200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -200, opacity: 0 }}
            transition={{
              duration: 0.5,
              ease: [0.16, 1, 0.3, 1], // easeOutExpo
            }}
            className='relative'
          >
            <Image
              src='/mascot-yellow.svg'
              width={120}
              height={120}
              alt='mascot'
              className='absolute -top-20 left-1/2 transform -translate-x-1/2 z-10 w-auto h-auto'
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{
                duration: 0.3,
                delay: 0.1,
                ease: [0.25, 0.1, 0.25, 1], // easeOutQuart
              }}
              className='bg-white rounded-4xl max-w-4xl w-full pt-12 px-12 pb-12 shadow-2xl'
            >
              <div className='text-center mb-8'>
                <h1 className='text-3xl font-bold text-black mb-6'>
                  Instruksi Pengerjaan Tes Kepribadian
                </h1>

                <div className='text-left space-y-4 text-black leading-relaxed font-medium text-xl'>
                  <p>
                    1. Pilihlah jawaban{' '}
                    <span className='font-bold'>yang paling sesuai</span> hingga{' '}
                    <span className='font-bold'>yang tidak sesuai</span> dengan
                    kondisimu saat ini.
                  </p>
                  <p>
                    2. Temukan posisi senyaman mungkin dan pastikan tidak ada
                    kegiatan lain yang sedang kamu lakukan saat menjawab tes.
                  </p>
                  <p>
                    3. Jawablah setiap pertanyaan dengan jujur. Setiap soal
                    dalam tes ini hanya bisa satu kali, jadi kerjakanlah dengan
                    teliti.
                  </p>
                  <p>
                    4. Sesuaikan jawaban kamu dengan parameter jawaban berikut:
                  </p>
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
                        />{' '}
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
                  Mulai Sekarang
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
