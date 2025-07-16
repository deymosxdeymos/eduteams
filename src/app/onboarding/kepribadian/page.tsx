'use client';

import Logo from '@/components/logo';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import InstructionModal from '@/components/onboarding/kepribadian/instruction-modal';
import PersonalityQuestion from '@/components/onboarding/kepribadian/personality-question';
import {
  getQuestionsForPage,
  getTotalPages,
} from '@/data/personality-questions';

export default function KepribadianPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [validationErrors, setValidationErrors] = useState<Set<number>>(
    new Set()
  );
  const questionsRefs = useRef<Record<number, HTMLDivElement>>({});

  const totalPages = getTotalPages();
  const currentQuestions = getQuestionsForPage(currentPage);
  const progress = (currentPage / totalPages) * 100;

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setValidationErrors(prev => {
      const newErrors = new Set(prev);
      newErrors.delete(questionId);
      return newErrors;
    });
  };

  const validateCurrentPage = () => {
    const unansweredQuestions = currentQuestions.filter(q => !answers[q.id]);
    if (unansweredQuestions.length > 0) {
      const newErrors = new Set(unansweredQuestions.map(q => q.id));
      setValidationErrors(newErrors);

      const firstUnanswered = unansweredQuestions[0];
      const element = document.getElementById(`question-${firstUnanswered.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentPage()) return;

    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    } else {
      router.push('/onboarding/data-diri/mahasiswa');
    }
  };

  const handleComplete = async () => {
    if (!validateCurrentPage()) return;

    try {
      await fetch('/api/user/onboarding-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ step: 'kepribadian' }),
      });

      const response = await fetch('/api/user/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });

      if (response.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error completing kepribadian:', error);
    }
  };

  return (
    <main className='bg-white min-h-screen px-12 pb-14'>
      <InstructionModal isOpen={isModalOpen} onCloseAction={handleCloseModal} />

      <Logo color='black' />

      <div className='flex items-center justify-center space-x-2 pt-20'>
        <Image src='/emoji/monocle.svg' width={80} height={80} alt='monocle' />
        <h1 className='font-bold text-black text-6xl tracking-tighter'>
          Tes Kepribadian
        </h1>
      </div>

      <div className='flex items-center justify-center p-6'>
        <p className='font-normal text-black text-xl tracking-tight'>
          Jawab pertanyaan berikut dengan jujur ya 😬 hasilnya akan digunakan
          <br />
          untuk membentuk tim belajar yang paling cocok buat kamu!
        </p>
      </div>

      <div className='px-8 max-w-4xl mx-auto pt-8'>
        <div className='mb-8'>
          <div className='flex items-center justify-between gap-4'>
            <span className='text-md font-medium text-black'>
              Halaman {currentPage} dari {totalPages}
            </span>
            <Progress
              value={progress}
              className='h-3 flex-1 bg-gray-200'
              indicatorClassName='bg-green-400'
            />
          </div>
        </div>

        <div className='space-y-8'>
          {currentQuestions.map(question => (
            <PersonalityQuestion
              key={question.id}
              question={question.text}
              questionId={question.id}
              hasError={validationErrors.has(question.id)}
              onAnswerAction={value => handleAnswer(question.id, value)}
            />
          ))}
        </div>
      </div>

      <div className='flex items-center justify-center gap-x-6 pt-10'>
        <Button
          variant='ghost'
          size='icon'
          className='rounded-full w-14 h-14 border border-black'
          onClick={handlePrevious}
        >
          <ArrowLeft strokeWidth={3} className='font-bold text-black text-lg' />
        </Button>
        <Button variant='onboarding' size='long' onClick={handleNext}>
          {currentPage === totalPages ? 'Selesai' : 'Lanjut'}
          <ArrowRight
            strokeWidth={3}
            className='font-bold text-white text-lg'
          />
        </Button>
      </div>
    </main>
  );
}
