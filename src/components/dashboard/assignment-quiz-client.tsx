'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useReducer, useRef, useState } from 'react';
import PreferenceTestInstructionModal from '@/components/dashboard/preference-test-instruction-modal';
import SkillTestInstructionModal from '@/components/dashboard/skill-test-instruction-modal';
import { Button } from '@/components/ui/button';
import SkillsQuiz from './skills-quiz';
import TopicsQuiz from './topics-quiz';

interface Assignment {
  id: string;
  title: string;
  skills: string[];
  topics: string[];
  hasTopics: boolean;
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
  const t = useTranslations('dashboard.assignments.quiz');
  const router = useRouter();
  const [state, dispatch] = useReducer(quizReducer, initialQuizState);
  const formRef = useRef<HTMLFormElement>(null);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(true);
  const [isPreferenceModalOpen, setIsPreferenceModalOpen] = useState(false);

  // No step header/progress UI

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
    if (state.validationErrors.size > 0) {
      dispatch({ type: 'SET_VALIDATION_ERRORS', payload: new Set() });
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) return;

    if (state.currentStep === 'skills') {
      if (!assignment.hasTopics || assignment.topics.length === 0) {
        await handleComplete();
        return;
      }
      dispatch({ type: 'NEXT_STEP' });
      setIsPreferenceModalOpen(true);
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
      // Normalize to 0..1 like summerschool but better shape
      const toNorm = (v: number) => Math.max(0, Math.min(1, (v - 1) / 4));
      const skills = assignment.skills
        .map((name, idx) => ({ name, level: toNorm(state.skillsAnswers[idx]) }))
        .filter(s => Number.isFinite(s.level));
      const topics = assignment.topics
        .map((name, idx) => ({
          name,
          preference: toNorm(state.topicsAnswers[idx]),
        }))
        .filter(t => Number.isFinite(t.preference));

      const response = await fetch(
        `/api/courses/${classId}/assignments/${assignmentId}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ skills, topics }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      // Redirect to assignment page (CTA will guide to task)
      router.push(`/dashboard/class/${classId}/assignments/${assignmentId}`);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert(t('error'));
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
      <SkillTestInstructionModal
        isOpen={isSkillModalOpen && state.currentStep === 'skills'}
        onCloseAction={() => setIsSkillModalOpen(false)}
      />
      <PreferenceTestInstructionModal
        isOpen={isPreferenceModalOpen && state.currentStep === 'topics'}
        onCloseAction={() => setIsPreferenceModalOpen(false)}
      />
      <div className='flex items-center justify-center space-x-2 pt-20'>
        <h1 className='font-bold text-black text-6xl tracking-tighter'>
          {state.currentStep === 'skills' ? t('skillsTitle') : t('topicsTitle')}
        </h1>
      </div>

      <div className='flex items-center justify-center p-6'>
        <p className='font-normal text-black text-xl tracking-tight'>
          {t('description')}
        </p>
      </div>

      <form ref={formRef} className='px-8 max-w-4xl mx-auto pt-8'>
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
            ? t('sending')
            : state.currentStep === 'skills'
              ? assignment.hasTopics
                ? t('nextToTopics')
                : t('finish')
              : t('finish')}
          <ArrowRight
            strokeWidth={3}
            className='font-bold text-white text-lg'
          />
        </Button>
      </div>
    </main>
  );
}
