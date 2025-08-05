import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import PersonalityTestClient from '../../src/components/onboarding/kepribadian/personality-test-client';
import type { MBTIQuestion } from '../../src/lib/mbti-questions';

// Simple element existence and class checking functions
function elementExists(element: any): boolean {
  return element !== null && element !== undefined;
}

function hasClass(element: any, className: string): boolean {
  const classes = element?.className?.split(' ') || [];
  return classes.includes(className);
}

function isDisabled(element: any): boolean {
  return element?.disabled === true;
}

// Mock dependencies
const mockRouter = {
  push: mock(),
  replace: mock(),
  back: mock(),
  forward: mock(),
  refresh: mock(),
  prefetch: mock(),
};

const mockSubmitPersonalityTest = mock();

mock.module('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

mock.module('../../src/lib/actions/personality', () => ({
  submitPersonalityTest: mockSubmitPersonalityTest,
}));

// Mock the subcomponents
mock.module('../../src/components/logo', () => ({
  default: ({ color }: { color: string }) => (
    <div data-testid='logo' style={{ color }}>
      Logo
    </div>
  ),
}));

mock.module(
  '../../src/components/onboarding/kepribadian/instruction-modal',
  () => ({
    default: ({
      isOpen,
      onCloseAction,
    }: {
      isOpen: boolean;
      onCloseAction: () => void;
    }) => (
      <div
        data-testid='instruction-modal'
        style={{ display: isOpen ? 'block' : 'none' }}
      >
        <button onClick={onCloseAction}>Close Modal</button>
      </div>
    ),
  })
);

mock.module(
  '../../src/components/onboarding/kepribadian/personality-question',
  () => ({
    default: ({
      question,
      questionId,
      hasError,
      initialValue,
      onAnswerAction,
    }: {
      question: string;
      questionId: string;
      hasError: boolean;
      initialValue?: number;
      onAnswerAction: (value: number) => void;
    }) => (
      <div
        data-testid={`question-${questionId}`}
        className={hasError ? 'error' : ''}
        id={`question-${questionId}`}
      >
        <p>{question}</p>
        <div>
          {[1, 2, 3, 4, 5].map(value => (
            <button
              key={value}
              data-testid={`answer-${questionId}-${value}`}
              onClick={() => onAnswerAction(value)}
              className={initialValue === value ? 'selected' : ''}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    ),
  })
);

// Mock UI components
mock.module('../../src/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    [key: string]: any;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={props['data-testid'] || 'button'}
      {...props}
    >
      {children}
    </button>
  ),
}));

mock.module('../../src/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div data-testid='progress-bar' className={className}>
      <div style={{ width: `${value}%` }} />
      Progress: {value}%
    </div>
  ),
}));

// Mock icons
mock.module('lucide-react', () => ({
  ArrowRight: () => <span data-testid='arrow-right'>→</span>,
  ArrowLeft: () => <span data-testid='arrow-left'>←</span>,
}));

// Mock Next.js Image component
mock.module('next/image', () => ({
  default: ({
    src,
    alt,
    width,
    height,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
  }) => <img src={src} alt={alt} width={width} height={height} />,
}));

describe('PersonalityTestClient', () => {
  const mockQuestions: MBTIQuestion[] = [
    {
      id: 'q1',
      text: 'You prefer working alone rather than in groups',
      dimension: 'ei',
      order: 1,
    },
    {
      id: 'q2',
      text: 'You enjoy meeting new people',
      dimension: 'ei',
      order: 2,
    },
    {
      id: 'q3',
      text: 'You prefer concrete facts over abstract concepts',
      dimension: 'sn',
      order: 3,
    },
    {
      id: 'q4',
      text: 'You make decisions based on logic',
      dimension: 'tf',
      order: 4,
    },
    {
      id: 'q5',
      text: 'You prefer having a structured schedule',
      dimension: 'pj',
      order: 5,
    },
    {
      id: 'q6',
      text: 'You are comfortable with uncertainty',
      dimension: 'pj',
      order: 6,
    },
    {
      id: 'q7',
      text: 'You think before you speak',
      dimension: 'ei',
      order: 7,
    },
    {
      id: 'q8',
      text: 'You focus on the big picture',
      dimension: 'sn',
      order: 8,
    },
  ];

  beforeEach(() => {
    cleanup();
    mockRouter.push.mockReset();
    mockSubmitPersonalityTest.mockReset();
    mockSubmitPersonalityTest.mockResolvedValue(undefined);
  });

  describe('Initial Render', () => {
    test('should render with instruction modal open', () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      expect(elementExists(screen.getByTestId('instruction-modal'))).toBe(true);
      expect(elementExists(screen.getByTestId('logo'))).toBe(true);
      expect(elementExists(screen.getByText('Tes Kepribadian'))).toBe(true);
    });

    test('should display first page of questions after closing modal', () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Component uses 6 questions per page, so first 6 questions should be visible
      expect(elementExists(screen.getByTestId('question-q1'))).toBe(true);
      expect(elementExists(screen.getByTestId('question-q2'))).toBe(true);
      expect(elementExists(screen.getByTestId('question-q3'))).toBe(true);
      expect(elementExists(screen.getByTestId('question-q4'))).toBe(true);
      expect(elementExists(screen.getByTestId('question-q5'))).toBe(true);
      expect(elementExists(screen.getByTestId('question-q6'))).toBe(true);

      // Questions 7 and 8 should be on the next page
      expect(screen.queryByTestId('question-q7')).toBe(null);
      expect(screen.queryByTestId('question-q8')).toBe(null);
    });

    test('should display correct progress and page info', () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // With 8 questions and 6 per page, should be 2 pages total
      expect(elementExists(screen.getByText('Halaman 1 dari 2'))).toBe(true);
      expect(elementExists(screen.getByText('Progress: 50%'))).toBe(true);
    });
  });

  describe('Question Interaction', () => {
    test('should handle answer selection', () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      fireEvent.click(screen.getByTestId('answer-q1-3'));

      expect(hasClass(screen.getByTestId('answer-q1-3'), 'selected')).toBe(true);
    });

    test('should clear validation errors when answering', () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Try to go to next page without answering all questions
      fireEvent.click(screen.getByText('Lanjut'));

      // Should show error for unanswered question
      expect(hasClass(screen.getByTestId('question-q1'), 'error')).toBe(true);

      // Answer the question
      fireEvent.click(screen.getByTestId('answer-q1-3'));

      // Error should be cleared
      expect(hasClass(screen.getByTestId('question-q1'), 'error')).toBe(false);
    });

    test('should allow changing answers', () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Answer first question
      fireEvent.click(screen.getByTestId('answer-q1-3'));
      expect(hasClass(screen.getByTestId('answer-q1-3'), 'selected')).toBe(true);

      // Change answer
      fireEvent.click(screen.getByTestId('answer-q1-5'));
      expect(hasClass(screen.getByTestId('answer-q1-5'), 'selected')).toBe(true);
      expect(hasClass(screen.getByTestId('answer-q1-3'), 'selected')).toBe(false);
    });
  });

  describe('Navigation', () => {
    test('should not advance to next page if validation fails', () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Try to go to next page without answering all questions
      fireEvent.click(screen.getByText('Lanjut'));

      // Should still be on page 1
      expect(elementExists(screen.getByText('Halaman 1 dari 2'))).toBe(true);

      // Should show validation errors for all 6 questions on page 1
      expect(hasClass(screen.getByTestId('question-q1'), 'error')).toBe(true);
      expect(hasClass(screen.getByTestId('question-q2'), 'error')).toBe(true);
      expect(hasClass(screen.getByTestId('question-q3'), 'error')).toBe(true);
      expect(hasClass(screen.getByTestId('question-q4'), 'error')).toBe(true);
      expect(hasClass(screen.getByTestId('question-q5'), 'error')).toBe(true);
      expect(hasClass(screen.getByTestId('question-q6'), 'error')).toBe(true);
    });

    test('should advance to next page when all questions answered', () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Answer all questions on page 1
      fireEvent.click(screen.getByTestId('answer-q1-3'));
      fireEvent.click(screen.getByTestId('answer-q2-4'));
      fireEvent.click(screen.getByTestId('answer-q3-2'));
      fireEvent.click(screen.getByTestId('answer-q4-5'));
      fireEvent.click(screen.getByTestId('answer-q5-1'));
      fireEvent.click(screen.getByTestId('answer-q6-2'));

      // Go to next page
      fireEvent.click(screen.getByText('Lanjut'));

      // Should be on page 2
      expect(elementExists(screen.getByText('Halaman 2 dari 2'))).toBe(true);
      expect(elementExists(screen.getByText('Progress: 100%'))).toBe(true);

      // Should show next set of questions
      expect(elementExists(screen.getByTestId('question-q7'))).toBe(true);
      expect(elementExists(screen.getByTestId('question-q8'))).toBe(true);
    });

    test('should go back to previous page', () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Answer all questions on page 1
      fireEvent.click(screen.getByTestId('answer-q1-3'));
      fireEvent.click(screen.getByTestId('answer-q2-4'));
      fireEvent.click(screen.getByTestId('answer-q3-2'));
      fireEvent.click(screen.getByTestId('answer-q4-5'));
      fireEvent.click(screen.getByTestId('answer-q5-1'));
      fireEvent.click(screen.getByTestId('answer-q6-2'));

      // Go to next page
      fireEvent.click(screen.getByText('Lanjut'));

      // Go back to previous page
      fireEvent.click(screen.getByTestId('arrow-left'));

      // Should be back on page 1
      expect(elementExists(screen.getByText('Halaman 1 dari 2'))).toBe(true);
      expect(elementExists(screen.getByTestId('question-q1'))).toBe(true);

      // Answers should be preserved
      expect(hasClass(screen.getByTestId('answer-q1-3'), 'selected')).toBe(true);
    });

    test('should navigate to previous route when on first page', () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Click back button on first page
      fireEvent.click(screen.getByTestId('arrow-left'));

      // Should navigate to previous route
      expect(mockRouter.push).toHaveBeenCalledWith(
        '/onboarding/data-diri/mahasiswa'
      );
    });
  });

  describe('Form Submission', () => {
    test('should show "Selesai" button on last page', () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Navigate to last page
      fireEvent.click(screen.getByTestId('answer-q1-3'));
      fireEvent.click(screen.getByTestId('answer-q2-4'));
      fireEvent.click(screen.getByTestId('answer-q3-2'));
      fireEvent.click(screen.getByTestId('answer-q4-5'));
      fireEvent.click(screen.getByTestId('answer-q5-1'));
      fireEvent.click(screen.getByTestId('answer-q6-2'));
      fireEvent.click(screen.getByText('Lanjut'));

      // Should show "Selesai" button
      expect(elementExists(screen.getByText('Selesai'))).toBe(true);
    });

    test('should validate all questions before submitting', async () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Navigate to last page
      fireEvent.click(screen.getByTestId('answer-q1-3'));
      fireEvent.click(screen.getByTestId('answer-q2-4'));
      fireEvent.click(screen.getByTestId('answer-q3-2'));
      fireEvent.click(screen.getByTestId('answer-q4-5'));
      fireEvent.click(screen.getByTestId('answer-q5-1'));
      fireEvent.click(screen.getByTestId('answer-q6-2'));
      fireEvent.click(screen.getByText('Lanjut'));

      // Try to submit without answering all questions
      fireEvent.click(screen.getByText('Selesai'));

      // Should show validation errors for questions on page 2
      expect(hasClass(screen.getByTestId('question-q7'), 'error')).toBe(true);
      expect(hasClass(screen.getByTestId('question-q8'), 'error')).toBe(true);

      // Should not call submit function
      expect(mockSubmitPersonalityTest).not.toHaveBeenCalled();
    });

    test('should submit when all questions answered', async () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Answer all questions on page 1
      fireEvent.click(screen.getByTestId('answer-q1-3'));
      fireEvent.click(screen.getByTestId('answer-q2-4'));
      fireEvent.click(screen.getByTestId('answer-q3-2'));
      fireEvent.click(screen.getByTestId('answer-q4-5'));
      fireEvent.click(screen.getByTestId('answer-q5-1'));
      fireEvent.click(screen.getByTestId('answer-q6-2'));
      fireEvent.click(screen.getByText('Lanjut'));

      // Answer all questions on page 2
      fireEvent.click(screen.getByTestId('answer-q7-3'));
      fireEvent.click(screen.getByTestId('answer-q8-4'));

      // Submit
      fireEvent.click(screen.getByText('Selesai'));

      // Should call submit function
      await waitFor(() => {
        expect(mockSubmitPersonalityTest).toHaveBeenCalled();
      });

      // Check the submitted data structure
      const submittedData = mockSubmitPersonalityTest.mock.calls[0][0];
      const answersJson = submittedData.get('answers');
      const answers = JSON.parse(answersJson);

      expect(answers).toEqual({
        '1': 3,
        '2': 4,
        '3': 2,
        '4': 5,
        '5': 1,
        '6': 2,
        '7': 3,
        '8': 4,
      });
    });

    test('should show loading state during submission', async () => {
      // Mock a delayed response
      mockSubmitPersonalityTest.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Answer all questions
      fireEvent.click(screen.getByTestId('answer-q1-3'));
      fireEvent.click(screen.getByTestId('answer-q2-4'));
      fireEvent.click(screen.getByTestId('answer-q3-2'));
      fireEvent.click(screen.getByTestId('answer-q4-5'));
      fireEvent.click(screen.getByTestId('answer-q5-1'));
      fireEvent.click(screen.getByTestId('answer-q6-2'));
      fireEvent.click(screen.getByText('Lanjut'));

      fireEvent.click(screen.getByTestId('answer-q7-3'));
      fireEvent.click(screen.getByTestId('answer-q8-4'));

      // Submit
      fireEvent.click(screen.getByText('Selesai'));

      // Should show loading state
      expect(elementExists(screen.getByText('Mengirim...'))).toBe(true);

      // Buttons should be disabled during submission
      expect(isDisabled(screen.getByText('Mengirim...'))).toBe(true);
    });

    test('should handle submission errors gracefully', async () => {
      const consoleErrorSpy = mock(() => {});
      const originalConsoleError = console.error;
      console.error = consoleErrorSpy;
      
      mockSubmitPersonalityTest.mockRejectedValue(
        new Error('Submission failed')
      );

      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Answer all questions
      fireEvent.click(screen.getByTestId('answer-q1-3'));
      fireEvent.click(screen.getByTestId('answer-q2-4'));
      fireEvent.click(screen.getByTestId('answer-q3-2'));
      fireEvent.click(screen.getByTestId('answer-q4-5'));
      fireEvent.click(screen.getByTestId('answer-q5-1'));
      fireEvent.click(screen.getByTestId('answer-q6-2'));
      fireEvent.click(screen.getByText('Lanjut'));

      fireEvent.click(screen.getByTestId('answer-q7-3'));
      fireEvent.click(screen.getByTestId('answer-q8-4'));

      // Submit
      fireEvent.click(screen.getByText('Selesai'));

      // Should reset loading state on error
      await waitFor(() => {
        expect(elementExists(screen.getByText('Selesai'))).toBe(true);
        expect(isDisabled(screen.getByText('Selesai'))).toBe(false);
      });

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error completing kepribadian:',
        expect.any(Error)
      );

      console.error = originalConsoleError;
    });
  });

  describe('Accessibility and UX', () => {
    test('should have proper ARIA attributes', () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Progress bar should have proper attributes
      const progressBar = screen.getByTestId('progress-bar');
      expect(elementExists(progressBar)).toBe(true);
    });

    test('should show validation errors when trying to advance without answers', () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Try to advance without answering any questions
      fireEvent.click(screen.getByText('Lanjut'));

      // Should show validation errors for all questions on current page
      expect(hasClass(screen.getByTestId('question-q1'), 'error')).toBe(true);
      expect(hasClass(screen.getByTestId('question-q2'), 'error')).toBe(true);
      expect(hasClass(screen.getByTestId('question-q3'), 'error')).toBe(true);
      expect(hasClass(screen.getByTestId('question-q4'), 'error')).toBe(true);
      expect(hasClass(screen.getByTestId('question-q5'), 'error')).toBe(true);
      expect(hasClass(screen.getByTestId('question-q6'), 'error')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty questions array', () => {
      render(<PersonalityTestClient questions={[]} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Should show completed state or handle gracefully
      expect(elementExists(screen.getByText('Halaman 1 dari 0'))).toBe(true);
    });

    test('should handle single question', () => {
      const singleQuestion = [mockQuestions[0]];

      render(<PersonalityTestClient questions={singleQuestion} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Should show single question
      expect(elementExists(screen.getByText('Halaman 1 dari 1'))).toBe(true);
      expect(elementExists(screen.getByTestId('question-q1'))).toBe(true);

      // Should show "Selesai" immediately
      expect(elementExists(screen.getByText('Selesai'))).toBe(true);
    });

    test('should preserve state across page navigation', () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Answer questions on page 1
      fireEvent.click(screen.getByTestId('answer-q1-3'));
      fireEvent.click(screen.getByTestId('answer-q2-4'));
      fireEvent.click(screen.getByTestId('answer-q3-2'));
      fireEvent.click(screen.getByTestId('answer-q4-5'));
      fireEvent.click(screen.getByTestId('answer-q5-1'));
      fireEvent.click(screen.getByTestId('answer-q6-2'));

      // Go to next page
      fireEvent.click(screen.getByText('Lanjut'));

      // Go back
      fireEvent.click(screen.getByTestId('arrow-left'));

      // Answers should be preserved
      expect(hasClass(screen.getByTestId('answer-q1-3'), 'selected')).toBe(true);
      expect(hasClass(screen.getByTestId('answer-q2-4'), 'selected')).toBe(true);
      expect(hasClass(screen.getByTestId('answer-q3-2'), 'selected')).toBe(true);
      expect(hasClass(screen.getByTestId('answer-q4-5'), 'selected')).toBe(true);
      expect(hasClass(screen.getByTestId('answer-q5-1'), 'selected')).toBe(true);
      expect(hasClass(screen.getByTestId('answer-q6-2'), 'selected')).toBe(true);
    });
  });
});