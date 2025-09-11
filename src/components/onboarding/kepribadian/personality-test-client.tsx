'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useReducer, useRef, useState } from 'react';
import Logo from '@/components/logo';
import InstructionModal from '@/components/onboarding/kepribadian/instruction-modal';
import PersonalityQuestion from '@/components/onboarding/kepribadian/personality-question';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { submitPersonalityTest } from '@/lib/actions/personality';
import type { MBTIQuestion } from '@/lib/mbti-questions';
import {
  convertAnswersForSubmission,
  getQuestionsForPage,
  initialPersonalityTestState,
  personalityTestReducer,
  scrollToFirstError,
  validateCurrentPageQuestions,
} from '@/lib/personality-test-utils';

interface PersonalityTestClientProps {
  questions: MBTIQuestion[];
  dict: {
    onboarding: {
      kepribadian: {
        title: string;
        description: string;
        pageOf: string;
        sending: string;
        selesai: string;
        lanjut: string;
        instructions: {
          title: string;
          step1: string;
          step2: string;
          step3: string;
          step4: string;
          likertScale: {
            stronglyDisagree: string;
            disagree: string;
            neutral: string;
            agree: string;
            stronglyAgree: string;
          };
          startNow: string;
        };
      };
    };
  };
}

export default function PersonalityTestClient({
  questions,
  dict,
}: PersonalityTestClientProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [state, dispatch] = useReducer(
    personalityTestReducer,
    initialPersonalityTestState
  );
  const formRef = useRef<HTMLFormElement>(null);

  const questionsPerPage = 6;
  const totalPages = Math.ceil(questions.length / questionsPerPage);

  const currentQuestions = getQuestionsForPage(
    questions,
    state.currentPage,
    questionsPerPage
  );
  const progress = (state.currentPage / totalPages) * 100;

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleAnswer = (questionId: string, value: number) => {
    dispatch({ type: 'SET_ANSWER', payload: { questionId, value } });
  };

  const validateCurrentPage = () => {
    const unansweredQuestions = validateCurrentPageQuestions(
      currentQuestions,
      state.answers
    );
    if (unansweredQuestions.length > 0) {
      const newErrors = new Set(unansweredQuestions);
      dispatch({ type: 'SET_VALIDATION_ERRORS', payload: newErrors });
      scrollToFirstError(unansweredQuestions);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentPage()) return;

    if (state.currentPage < totalPages) {
      dispatch({ type: 'NEXT_PAGE' });
      // Auto scroll to top for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (state.currentPage > 1) {
      dispatch({ type: 'PREV_PAGE' });
    } else {
      router.push('/onboarding/data-diri/mahasiswa');
    }
  };

  const handleComplete = async () => {
    if (!validateCurrentPage()) return;

    dispatch({ type: 'SET_SUBMITTING', payload: true });

    const numericAnswers = convertAnswersForSubmission(
      questions,
      state.answers
    );

    const formData = new FormData();
    formData.append('answers', JSON.stringify(numericAnswers));
    try {
      await submitPersonalityTest(formData);
    } catch (err) {
      // Allow Next.js redirects to propagate
      if (err && typeof err === 'object') {
        const digest = (err as { digest?: unknown }).digest;
        if (typeof digest === 'string' && digest.includes('NEXT_REDIRECT')) {
          throw err;
        }
      }

      // Log and reset submitting state on regular errors
      console.error('Error completing kepribadian:', err);
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  };

  return (
    <main className='bg-white min-h-screen px-12 py-14'>
      <InstructionModal
        isOpen={isModalOpen}
        onCloseAction={handleCloseModal}
        dict={dict}
      />

      <Logo color='black' className='justify-center' />

      <div className='flex items-center justify-center space-x-2 pt-20'>
        <Image
          src='/emoji/monocle.svg'
          width={80}
          height={80}
          alt='monocle'
          className='w-20 h-20'
        />
        <h1 className='font-bold text-black text-6xl tracking-tighter'>
          {dict.onboarding.kepribadian.title}
        </h1>
      </div>

      <div className='flex items-center justify-center p-6'>
        <p className='font-normal text-black text-xl tracking-tight'>
          {dict.onboarding.kepribadian.description}
        </p>
      </div>

      <form ref={formRef} className='px-8 max-w-4xl mx-auto pt-8'>
        <div className='mb-8'>
          <div className='flex items-center justify-between gap-4'>
            <span className='text-md font-medium text-black'>
              {dict.onboarding.kepribadian.pageOf
                .replace('{current}', state.currentPage.toString())
                .replace('{total}', totalPages.toString())}
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
              hasError={state.validationErrors.has(question.id)}
              initialValue={state.answers[question.id]}
              onAnswerAction={value => handleAnswer(question.id, value)}
            />
          ))}
        </div>
      </form>

      <div className='flex items-center justify-center gap-x-6 pt-10'>
        <Button
          variant='ghost'
          size='icon'
          className='rounded-full w-14 h-14 border border-black'
          onClick={handlePrevious}
          disabled={state.isSubmitting}
        >
          <ArrowLeft strokeWidth={3} className='font-bold text-black text-lg' />
        </Button>
        <Button
          variant='onboarding'
          size='long'
          onClick={handleNext}
          disabled={state.isSubmitting}
        >
          {state.isSubmitting
            ? dict.onboarding.kepribadian.sending
            : state.currentPage === totalPages
              ? dict.onboarding.kepribadian.selesai
              : dict.onboarding.kepribadian.lanjut}
          <ArrowRight
            strokeWidth={3}
            className='font-bold text-white text-lg'
          />
        </Button>
      </div>
    </main>
  );
}
