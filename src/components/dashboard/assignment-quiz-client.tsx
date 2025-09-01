'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useReducer, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import SkillsQuiz from './skills-quiz';
import TopicsQuiz from './topics-quiz';

interface Assignment {
  id: string;
  title: string;
  skills: string[];
  topics: string[];
}

interface AssignmentQuizClientProps {
  classId: string;
  assignmentId: string;
  assignment: Assignment;
}

type QuizState = {
  currentStep: 'skills' | 'topics';
  skillsAnswers: Record<number, number>;
  topicsAnswers: Record<number, number>;
  validationErrors: Set<string>;
  isSubmitting: boolean;
};

type QuizAction =
  | {
      type: 'SET_SKILLS_ANSWER';
      payload: { skillIndex: number; value: number };
    }
  | {
      type: 'SET_TOPICS_ANSWER';
      payload: { topicIndex: number; value: number };
    }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_VALIDATION_ERRORS'; payload: Set<string> }
  | { type: 'SET_SUBMITTING'; payload: boolean };

const initialQuizState: QuizState = {
  currentStep: 'skills',
  skillsAnswers: {},
  topicsAnswers: {},
  validationErrors: new Set(),
  isSubmitting: false,
};

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'SET_SKILLS_ANSWER':
      return {
        ...state,
        skillsAnswers: {
          ...state.skillsAnswers,
          [action.payload.skillIndex]: action.payload.value,
        },
      };
    case 'SET_TOPICS_ANSWER':
      return {
        ...state,
        topicsAnswers: {
          ...state.topicsAnswers,
          [action.payload.topicIndex]: action.payload.value,
        },
      };
    case 'NEXT_STEP':
      return {
        ...state,
        currentStep: 'topics',
      };
    case 'PREV_STEP':
      return {
        ...state,
        currentStep: 'skills',
      };
    case 'SET_VALIDATION_ERRORS':
      return {
        ...state,
        validationErrors: action.payload,
      };
    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.payload,
      };
    default:
      return state;
  }
}

export function AssignmentQuizClient({
  classId,
  assignmentId,
  assignment,
}: AssignmentQuizClientProps) {
  const router = useRouter();
  const [state, dispatch] = useReducer(quizReducer, initialQuizState);
  const formRef = useRef<HTMLFormElement>(null);

  const totalSteps = 2;
  const currentStepIndex = state.currentStep === 'skills' ? 0 : 1;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  const validateCurrentStep = () => {
    const errors = new Set<string>();

    if (state.currentStep === 'skills') {
      assignment.skills.forEach((_, index) => {
        if (!state.skillsAnswers[index]) {
          errors.add(`skill-${index}`);
        }
      });
    } else {
      assignment.topics.forEach((_, index) => {
        if (!state.topicsAnswers[index]) {
          errors.add(`topic-${index}`);
        }
      });
    }

    if (errors.size > 0) {
      dispatch({ type: 'SET_VALIDATION_ERRORS', payload: errors });
      // Scroll to first error
      const firstError = Array.from(errors)[0];
      const element = document.getElementById(firstError);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) return;

    if (state.currentStep === 'skills') {
      dispatch({ type: 'NEXT_STEP' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      await handleComplete();
    }
  };

  const handlePrevious = () => {
    if (state.currentStep === 'topics') {
      dispatch({ type: 'PREV_STEP' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.push(`/dashboard/class/${classId}`);
    }
  };

  const handleComplete = async () => {
    if (!validateCurrentStep()) return;

    dispatch({ type: 'SET_SUBMITTING', payload: true });

    try {
      const response = await fetch(
        `/api/courses/${classId}/assignments/${assignmentId}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            skillsAnswers: state.skillsAnswers,
            topicsAnswers: state.topicsAnswers,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      // Redirect to task page
      router.push(`/dashboard/class/${classId}/assignments/${assignmentId}`);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Terjadi kesalahan saat mengirim jawaban. Silakan coba lagi.');
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  };

  const handleSkillsAnswer = (skillIndex: number, value: number) => {
    dispatch({ type: 'SET_SKILLS_ANSWER', payload: { skillIndex, value } });
  };

  const handleTopicsAnswer = (topicIndex: number, value: number) => {
    dispatch({ type: 'SET_TOPICS_ANSWER', payload: { topicIndex, value } });
  };

  return (
    <main className='bg-white min-h-screen px-12 py-14'>
      <div className='flex items-center justify-center space-x-2 pt-20'>
        <Image
          src='/emoji/monocle.svg'
          width={80}
          height={80}
          alt='rocket'
          className='w-20 h-20'
        />
        <h1 className='font-bold text-black text-6xl tracking-tighter'>
          🚀 Tes Keahlian
        </h1>
      </div>

      <div className='flex items-center justify-center p-6'>
        <p className='font-normal text-black text-xl tracking-tight'>
          Jawab pertanyaan berikut dengan jujur ya 😬 hasilnya akan digunakan
          <br />
          untuk membentuk tim belajar yang paling cocok buat kamu!
        </p>
      </div>

      <form ref={formRef} className='px-8 max-w-4xl mx-auto pt-8'>
        <div className='mb-8'>
          <div className='flex items-center justify-between gap-4'>
            <span className='text-md font-medium text-black'>
              {state.currentStep === 'skills'
                ? 'Tes Keahlian'
                : 'Preferensi Topik'}{' '}
              - Halaman {currentStepIndex + 1} dari {totalSteps}
            </span>
            <Progress
              value={progress}
              className='h-3 flex-1 bg-gray-200'
              indicatorClassName='bg-green-400'
            />
          </div>
        </div>

        <div className='space-y-8'>
          {state.currentStep === 'skills' ? (
            <SkillsQuiz
              skills={assignment.skills}
              onAnswerAction={handleSkillsAnswer}
              hasError={state.validationErrors.size > 0}
              answers={state.skillsAnswers}
            />
          ) : (
            <TopicsQuiz
              topics={assignment.topics}
              onAnswerAction={handleTopicsAnswer}
              hasError={state.validationErrors.size > 0}
              answers={state.topicsAnswers}
            />
          )}
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
            ? 'Mengirim...'
            : state.currentStep === 'skills'
              ? 'Lanjut ke Preferensi Topik'
              : 'Selesai'}
          <ArrowRight
            strokeWidth={3}
            className='font-bold text-white text-lg'
          />
        </Button>
      </div>
    </main>
  );
}
