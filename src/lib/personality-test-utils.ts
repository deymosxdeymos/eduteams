import type { MBTIQuestion } from '@/lib/mbti-questions';

export interface PersonalityTestState {
  currentPage: number;
  answers: Record<string, number>;
  validationErrors: Set<string>;
  isSubmitting: boolean;
}

export type PersonalityTestAction =
  | { type: 'SET_ANSWER'; payload: { questionId: string; value: number } }
  | { type: 'NEXT_PAGE' }
  | { type: 'PREV_PAGE' }
  | { type: 'SET_VALIDATION_ERRORS'; payload: Set<string> }
  | { type: 'CLEAR_VALIDATION_ERROR'; payload: string }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'RESET' };

export const initialPersonalityTestState: PersonalityTestState = {
  currentPage: 1,
  answers: {},
  validationErrors: new Set(),
  isSubmitting: false,
};

export function personalityTestReducer(
  state: PersonalityTestState,
  action: PersonalityTestAction
): PersonalityTestState {
  switch (action.type) {
    case 'SET_ANSWER':
      const newErrors = new Set(state.validationErrors);
      newErrors.delete(action.payload.questionId);
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.payload.questionId]: action.payload.value,
        },
        validationErrors: newErrors,
      };

    case 'NEXT_PAGE':
      return {
        ...state,
        currentPage: state.currentPage + 1,
      };

    case 'PREV_PAGE':
      return {
        ...state,
        currentPage: state.currentPage - 1,
      };

    case 'SET_VALIDATION_ERRORS':
      return {
        ...state,
        validationErrors: action.payload,
      };

    case 'CLEAR_VALIDATION_ERROR':
      const clearedErrors = new Set(state.validationErrors);
      clearedErrors.delete(action.payload);
      return {
        ...state,
        validationErrors: clearedErrors,
      };

    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.payload,
      };

    case 'RESET':
      return initialPersonalityTestState;

    default:
      return state;
  }
}

export function getQuestionsForPage(
  questions: MBTIQuestion[],
  page: number,
  questionsPerPage: number
): MBTIQuestion[] {
  const startIndex = (page - 1) * questionsPerPage;
  return questions.slice(startIndex, startIndex + questionsPerPage);
}

export function validateCurrentPageQuestions(
  questions: MBTIQuestion[],
  answers: Record<string, number>
): string[] {
  return questions.filter(q => !answers[q.id]).map(q => q.id);
}

export function scrollToFirstError(unansweredQuestions: string[]): void {
  if (unansweredQuestions.length > 0) {
    const firstUnanswered = unansweredQuestions[0];
    const element = document.getElementById(`question-${firstUnanswered}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

export function convertAnswersForSubmission(
  questions: MBTIQuestion[],
  answers: Record<string, number>
): Record<string, number> {
  const convertedAnswers: Record<string, number> = {};
  questions.forEach((question, index) => {
    if (answers[question.id]) {
      convertedAnswers[(index + 1).toString()] = answers[question.id];
    }
  });
  return convertedAnswers;
}
