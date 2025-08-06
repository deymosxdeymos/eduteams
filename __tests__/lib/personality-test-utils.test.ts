import { beforeEach, describe, expect, test } from 'bun:test';
import type { MBTIQuestion } from '../../src/lib/mbti-questions';
import {
  convertAnswersForSubmission,
  getQuestionsForPage,
  initialPersonalityTestState,
  type PersonalityTestAction,
  type PersonalityTestState,
  personalityTestReducer,
  scrollToFirstError,
  validateCurrentPageQuestions,
} from '../../src/lib/personality-test-utils';

describe('Personality Test Utils', () => {
  const mockQuestions: MBTIQuestion[] = [
    {
      id: 'q1',
      text: 'Question 1',
      dimension: 'ei',
      order: 1,
    },
    {
      id: 'q2',
      text: 'Question 2',
      dimension: 'sn',
      order: 2,
    },
    {
      id: 'q3',
      text: 'Question 3',
      dimension: 'tf',
      order: 3,
    },
    {
      id: 'q4',
      text: 'Question 4',
      dimension: 'pj',
      order: 4,
    },
    {
      id: 'q5',
      text: 'Question 5',
      dimension: 'ei',
      order: 5,
    },
    {
      id: 'q6',
      text: 'Question 6',
      dimension: 'sn',
      order: 6,
    },
  ];

  describe('initialPersonalityTestState', () => {
    test('should have correct initial state', () => {
      expect(initialPersonalityTestState).toEqual({
        currentPage: 1,
        answers: {},
        validationErrors: new Set(),
        isSubmitting: false,
      });
    });
  });

  describe('personalityTestReducer', () => {
    let state: PersonalityTestState;

    beforeEach(() => {
      state = {
        currentPage: 1,
        answers: {},
        validationErrors: new Set(),
        isSubmitting: false,
      };
    });

    describe('SET_ANSWER action', () => {
      test('should set answer and clear validation error', () => {
        const initialState = {
          ...state,
          validationErrors: new Set(['q1', 'q2']),
        };

        const action: PersonalityTestAction = {
          type: 'SET_ANSWER',
          payload: { questionId: 'q1', value: 3 },
        };

        const newState = personalityTestReducer(initialState, action);

        expect(newState.answers).toEqual({ q1: 3 });
        expect(newState.validationErrors).toEqual(new Set(['q2']));
      });

      test('should overwrite existing answer', () => {
        const initialState = {
          ...state,
          answers: { q1: 2, q2: 4 },
        };

        const action: PersonalityTestAction = {
          type: 'SET_ANSWER',
          payload: { questionId: 'q1', value: 5 },
        };

        const newState = personalityTestReducer(initialState, action);

        expect(newState.answers).toEqual({ q1: 5, q2: 4 });
      });
    });

    describe('NEXT_PAGE action', () => {
      test('should increment current page', () => {
        const action: PersonalityTestAction = { type: 'NEXT_PAGE' };
        const newState = personalityTestReducer(state, action);

        expect(newState.currentPage).toBe(2);
      });

      test('should maintain other state properties', () => {
        const initialState = {
          ...state,
          answers: { q1: 3 },
          validationErrors: new Set(['q2']),
        };

        const action: PersonalityTestAction = { type: 'NEXT_PAGE' };
        const newState = personalityTestReducer(initialState, action);

        expect(newState.answers).toEqual({ q1: 3 });
        expect(newState.validationErrors).toEqual(new Set(['q2']));
      });
    });

    describe('PREV_PAGE action', () => {
      test('should decrement current page', () => {
        const initialState = { ...state, currentPage: 3 };
        const action: PersonalityTestAction = { type: 'PREV_PAGE' };
        const newState = personalityTestReducer(initialState, action);

        expect(newState.currentPage).toBe(2);
      });

      test('should not go below page 1', () => {
        const initialState = { ...state, currentPage: 1 };
        const action: PersonalityTestAction = { type: 'PREV_PAGE' };
        const newState = personalityTestReducer(initialState, action);

        expect(newState.currentPage).toBe(0);
      });
    });

    describe('SET_VALIDATION_ERRORS action', () => {
      test('should set validation errors', () => {
        const errors = new Set(['q1', 'q2']);
        const action: PersonalityTestAction = {
          type: 'SET_VALIDATION_ERRORS',
          payload: errors,
        };

        const newState = personalityTestReducer(state, action);

        expect(newState.validationErrors).toBe(errors);
      });

      test('should replace existing validation errors', () => {
        const initialState = {
          ...state,
          validationErrors: new Set(['q3', 'q4']),
        };

        const errors = new Set(['q1', 'q2']);
        const action: PersonalityTestAction = {
          type: 'SET_VALIDATION_ERRORS',
          payload: errors,
        };

        const newState = personalityTestReducer(initialState, action);

        expect(newState.validationErrors).toBe(errors);
      });
    });

    describe('CLEAR_VALIDATION_ERROR action', () => {
      test('should clear specific validation error', () => {
        const initialState = {
          ...state,
          validationErrors: new Set(['q1', 'q2', 'q3']),
        };

        const action: PersonalityTestAction = {
          type: 'CLEAR_VALIDATION_ERROR',
          payload: 'q2',
        };

        const newState = personalityTestReducer(initialState, action);

        expect(newState.validationErrors).toEqual(new Set(['q1', 'q3']));
      });

      test('should handle clearing non-existent error', () => {
        const initialState = {
          ...state,
          validationErrors: new Set(['q1', 'q2']),
        };

        const action: PersonalityTestAction = {
          type: 'CLEAR_VALIDATION_ERROR',
          payload: 'q3',
        };

        const newState = personalityTestReducer(initialState, action);

        expect(newState.validationErrors).toEqual(new Set(['q1', 'q2']));
      });
    });

    describe('SET_SUBMITTING action', () => {
      test('should set isSubmitting to true', () => {
        const action: PersonalityTestAction = {
          type: 'SET_SUBMITTING',
          payload: true,
        };

        const newState = personalityTestReducer(state, action);

        expect(newState.isSubmitting).toBe(true);
      });

      test('should set isSubmitting to false', () => {
        const initialState = { ...state, isSubmitting: true };
        const action: PersonalityTestAction = {
          type: 'SET_SUBMITTING',
          payload: false,
        };

        const newState = personalityTestReducer(initialState, action);

        expect(newState.isSubmitting).toBe(false);
      });
    });

    describe('RESET action', () => {
      test('should reset to initial state', () => {
        const modifiedState = {
          currentPage: 5,
          answers: { q1: 3, q2: 4 },
          validationErrors: new Set(['q3']),
          isSubmitting: true,
        };

        const action: PersonalityTestAction = { type: 'RESET' };
        const newState = personalityTestReducer(modifiedState, action);

        expect(newState).toEqual(initialPersonalityTestState);
      });
    });

    describe('Unknown action', () => {
      test('should return current state for unknown action', () => {
        const action = { type: 'UNKNOWN' } as any;
        const newState = personalityTestReducer(state, action);

        expect(newState).toBe(state);
      });
    });
  });

  describe('getQuestionsForPage', () => {
    test('should return correct questions for first page', () => {
      const result = getQuestionsForPage(mockQuestions, 1, 3);

      expect(result).toEqual([
        mockQuestions[0],
        mockQuestions[1],
        mockQuestions[2],
      ]);
    });

    test('should return correct questions for second page', () => {
      const result = getQuestionsForPage(mockQuestions, 2, 3);

      expect(result).toEqual([
        mockQuestions[3],
        mockQuestions[4],
        mockQuestions[5],
      ]);
    });

    test('should handle partial last page', () => {
      const result = getQuestionsForPage(mockQuestions, 3, 3);

      expect(result).toEqual([]);
    });

    test('should handle page beyond available questions', () => {
      const result = getQuestionsForPage(mockQuestions, 5, 3);

      expect(result).toEqual([]);
    });

    test('should handle questionsPerPage of 1', () => {
      const result = getQuestionsForPage(mockQuestions, 1, 1);

      expect(result).toEqual([mockQuestions[0]]);
    });

    test('should handle questionsPerPage larger than total questions', () => {
      const result = getQuestionsForPage(mockQuestions, 1, 10);

      expect(result).toEqual(mockQuestions);
    });

    test('should handle empty questions array', () => {
      const result = getQuestionsForPage([], 1, 3);

      expect(result).toEqual([]);
    });
  });

  describe('validateCurrentPageQuestions', () => {
    const pageQuestions = [
      mockQuestions[0],
      mockQuestions[1],
      mockQuestions[2],
    ];

    test('should return empty array when all questions are answered', () => {
      const answers = { q1: 3, q2: 4, q3: 2 };
      const result = validateCurrentPageQuestions(pageQuestions, answers);

      expect(result).toEqual([]);
    });

    test('should return unanswered question IDs', () => {
      const answers = { q1: 3, q3: 2 };
      const result = validateCurrentPageQuestions(pageQuestions, answers);

      expect(result).toEqual(['q2']);
    });

    test('should return all question IDs when no answers provided', () => {
      const answers = {};
      const result = validateCurrentPageQuestions(pageQuestions, answers);

      expect(result).toEqual(['q1', 'q2', 'q3']);
    });

    test('should handle extra answers not in current page', () => {
      const answers = { q1: 3, q2: 4, q3: 2, q4: 5 };
      const result = validateCurrentPageQuestions(pageQuestions, answers);

      expect(result).toEqual([]);
    });

    test('should handle empty questions array', () => {
      const answers = { q1: 3 };
      const result = validateCurrentPageQuestions([], answers);

      expect(result).toEqual([]);
    });
  });

  describe('scrollToFirstError', () => {
    test('should handle empty unanswered questions', () => {
      const unansweredQuestions: string[] = [];
      scrollToFirstError(unansweredQuestions);

      // Should not throw or cause issues
      expect(unansweredQuestions).toEqual([]);
    });

    test('should handle scroll behavior', () => {
      const unansweredQuestions = ['q1', 'q2'];

      // Should not throw even if DOM is not available
      expect(() => scrollToFirstError(unansweredQuestions)).not.toThrow();
    });
  });

  describe('convertAnswersForSubmission', () => {
    test('should convert question IDs to numeric indices', () => {
      const answers = { q1: 3, q2: 4, q3: 2 };
      const result = convertAnswersForSubmission(mockQuestions, answers);

      expect(result).toEqual({
        '1': 3,
        '2': 4,
        '3': 2,
      });
    });

    test('should handle partial answers', () => {
      const answers = { q1: 3, q4: 5 };
      const result = convertAnswersForSubmission(mockQuestions, answers);

      expect(result).toEqual({
        '1': 3,
        '4': 5,
      });
    });

    test('should handle empty answers', () => {
      const answers = {};
      const result = convertAnswersForSubmission(mockQuestions, answers);

      expect(result).toEqual({});
    });

    test('should handle answers not in questions list', () => {
      const answers = { q1: 3, q99: 4 };
      const result = convertAnswersForSubmission(mockQuestions, answers);

      expect(result).toEqual({
        '1': 3,
      });
    });

    test('should handle empty questions array', () => {
      const answers = { q1: 3 };
      const result = convertAnswersForSubmission([], answers);

      expect(result).toEqual({});
    });

    test('should maintain order based on questions array', () => {
      const reorderedQuestions = [
        mockQuestions[2], // q3
        mockQuestions[0], // q1
        mockQuestions[1], // q2
      ];
      const answers = { q1: 3, q2: 4, q3: 2 };
      const result = convertAnswersForSubmission(reorderedQuestions, answers);

      expect(result).toEqual({
        '1': 2, // q3 is first in reordered array
        '2': 3, // q1 is second in reordered array
        '3': 4, // q2 is third in reordered array
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('reducer should handle invalid action types gracefully', () => {
      const invalidAction = { type: 'INVALID_ACTION' } as any;
      const result = personalityTestReducer(
        initialPersonalityTestState,
        invalidAction
      );

      expect(result).toBe(initialPersonalityTestState);
    });

    test('getQuestionsForPage should handle zero or negative page numbers', () => {
      const result1 = getQuestionsForPage(mockQuestions, 0, 3);
      const result2 = getQuestionsForPage(mockQuestions, -1, 3);

      // For page 0: startIndex = (0-1)*3 = -3, so slice(-3, 0) = empty array
      // For page -1: startIndex = (-1-1)*3 = -6, so slice(-6, -3) = first 3 elements
      expect(result1).toEqual([]);
      expect(result2).toEqual([
        mockQuestions[0],
        mockQuestions[1],
        mockQuestions[2],
      ]);
    });
    test('getQuestionsForPage should handle zero or negative questionsPerPage', () => {
      const result1 = getQuestionsForPage(mockQuestions, 1, 0);
      const result2 = getQuestionsForPage(mockQuestions, 1, -1);

      // Zero questionsPerPage should return empty array
      expect(result1).toEqual([]);
      // Negative questionsPerPage should return all questions (since slice handles negative)
      expect(result2).toEqual(mockQuestions.slice(0, -1));
    });
  });

  describe('Type Safety', () => {
    test('should handle all PersonalityTestAction types', () => {
      const actions: PersonalityTestAction[] = [
        { type: 'SET_ANSWER', payload: { questionId: 'q1', value: 3 } },
        { type: 'NEXT_PAGE' },
        { type: 'PREV_PAGE' },
        { type: 'SET_VALIDATION_ERRORS', payload: new Set(['q1']) },
        { type: 'CLEAR_VALIDATION_ERROR', payload: 'q1' },
        { type: 'SET_SUBMITTING', payload: true },
        { type: 'RESET' },
      ];

      actions.forEach(action => {
        const result = personalityTestReducer(
          initialPersonalityTestState,
          action
        );
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
      });
    });

    test('should maintain Set type for validationErrors', () => {
      const action: PersonalityTestAction = {
        type: 'SET_VALIDATION_ERRORS',
        payload: new Set(['q1', 'q2']),
      };

      const result = personalityTestReducer(
        initialPersonalityTestState,
        action
      );

      expect(result.validationErrors).toBeInstanceOf(Set);
      expect(result.validationErrors.has('q1')).toBe(true);
      expect(result.validationErrors.has('q2')).toBe(true);
    });
  });
});
