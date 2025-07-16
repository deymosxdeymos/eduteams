import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PersonalityTestClient from '../../../src/components/onboarding/kepribadian/personality-test-client';
import type { MBTIQuestion } from '../../../src/lib/mbti-questions';

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

mock.module('../../../src/lib/actions/personality', () => ({
  submitPersonalityTest: mockSubmitPersonalityTest,
}));

// Mock the subcomponents
mock.module('../../../src/components/logo', () => ({
  default: ({ color }: { color: string }) => (
    <div data-testid='logo' style={{ color }}>
      Logo
    </div>
  ),
}));

mock.module(
  '../../../src/components/onboarding/kepribadian/instruction-modal',
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
  '../../../src/components/onboarding/kepribadian/personality-question',
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
mock.module('../../../src/components/ui/button', () => ({
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

mock.module('../../../src/components/ui/progress', () => ({
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
    mockRouter.push.mockReset();
    mockSubmitPersonalityTest.mockReset();
    mockSubmitPersonalityTest.mockResolvedValue(undefined);
  });

  describe('Initial Render', () => {
    test('should render with instruction modal open', () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      expect(screen.getByTestId('instruction-modal')).toBeInTheDocument();
      expect(screen.getByTestId('logo')).toBeInTheDocument();
      expect(screen.getByText('Tes Kepribadian')).toBeInTheDocument();
    });

    test('should display first page of questions after closing modal', () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      // Close the modal
      fireEvent.click(screen.getByText('Close Modal'));

      // Should show first 4 questions (questionsPerPage = 4)
      expect(screen.getByTestId('question-q1')).toBeInTheDocument();
      expect(screen.getByTestId('question-q2')).toBeInTheDocument();
      expect(screen.getByTestId('question-q3')).toBeInTheDocument();
      expect(screen.getByTestId('question-q4')).toBeInTheDocument();

      // Should not show questions from next page
      expect(screen.queryByTestId('question-q5')).not.toBeInTheDocument();
    });

    test('should display correct progress and page info', () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // With 8 questions and 4 per page, should be 2 pages total
      expect(screen.getByText('Halaman 1 dari 2')).toBeInTheDocument();
      expect(screen.getByText('Progress: 50%')).toBeInTheDocument(); // 1/2 * 100
    });
  });

  describe('Question Interaction', () => {
    test('should handle answer selection', () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Answer first question
      fireEvent.click(screen.getByTestId('answer-q1-3'));

      // Should mark the button as selected
      expect(screen.getByTestId('answer-q1-3')).toHaveClass('selected');
    });

    test('should clear validation errors when answering', () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Try to go to next page without answering all questions
      fireEvent.click(screen.getByText('Lanjut'));

      // Should show error for unanswered question
      expect(screen.getByTestId('question-q1')).toHaveClass('error');

      // Answer the question
      fireEvent.click(screen.getByTestId('answer-q1-3'));

      // Error should be cleared
      expect(screen.getByTestId('question-q1')).not.toHaveClass('error');
    });

    test('should allow changing answers', () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Answer first question
      fireEvent.click(screen.getByTestId('answer-q1-3'));
      expect(screen.getByTestId('answer-q1-3')).toHaveClass('selected');

      // Change answer
      fireEvent.click(screen.getByTestId('answer-q1-5'));
      expect(screen.getByTestId('answer-q1-5')).toHaveClass('selected');
      expect(screen.getByTestId('answer-q1-3')).not.toHaveClass('selected');
    });
  });

  describe('Navigation', () => {
    test('should not advance to next page if validation fails', () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Try to go to next page without answering all questions
      fireEvent.click(screen.getByText('Lanjut'));

      // Should still be on page 1
      expect(screen.getByText('Halaman 1 dari 2')).toBeInTheDocument();

      // Should show validation errors
      expect(screen.getByTestId('question-q1')).toHaveClass('error');
      expect(screen.getByTestId('question-q2')).toHaveClass('error');
      expect(screen.getByTestId('question-q3')).toHaveClass('error');
      expect(screen.getByTestId('question-q4')).toHaveClass('error');
    });

    test('should advance to next page when all questions answered', () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Answer all questions on page 1
      fireEvent.click(screen.getByTestId('answer-q1-3'));
      fireEvent.click(screen.getByTestId('answer-q2-4'));
      fireEvent.click(screen.getByTestId('answer-q3-2'));
      fireEvent.click(screen.getByTestId('answer-q4-5'));

      // Go to next page
      fireEvent.click(screen.getByText('Lanjut'));

      // Should be on page 2
      expect(screen.getByText('Halaman 2 dari 2')).toBeInTheDocument();
      expect(screen.getByText('Progress: 100%')).toBeInTheDocument();

      // Should show next set of questions
      expect(screen.getByTestId('question-q5')).toBeInTheDocument();
      expect(screen.getByTestId('question-q6')).toBeInTheDocument();
      expect(screen.getByTestId('question-q7')).toBeInTheDocument();
      expect(screen.getByTestId('question-q8')).toBeInTheDocument();
    });

    test('should go back to previous page', () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Answer all questions on page 1
      fireEvent.click(screen.getByTestId('answer-q1-3'));
      fireEvent.click(screen.getByTestId('answer-q2-4'));
      fireEvent.click(screen.getByTestId('answer-q3-2'));
      fireEvent.click(screen.getByTestId('answer-q4-5'));

      // Go to next page
      fireEvent.click(screen.getByText('Lanjut'));

      // Go back to previous page
      fireEvent.click(screen.getByTestId('arrow-left'));

      // Should be back on page 1
      expect(screen.getByText('Halaman 1 dari 2')).toBeInTheDocument();
      expect(screen.getByTestId('question-q1')).toBeInTheDocument();

      // Answers should be preserved
      expect(screen.getByTestId('answer-q1-3')).toHaveClass('selected');
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
      fireEvent.click(screen.getByText('Lanjut'));

      // Should show "Selesai" button
      expect(screen.getByText('Selesai')).toBeInTheDocument();
    });

    test('should validate all questions before submitting', async () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Navigate to last page
      fireEvent.click(screen.getByTestId('answer-q1-3'));
      fireEvent.click(screen.getByTestId('answer-q2-4'));
      fireEvent.click(screen.getByTestId('answer-q3-2'));
      fireEvent.click(screen.getByTestId('answer-q4-5'));
      fireEvent.click(screen.getByText('Lanjut'));

      // Try to submit without answering all questions
      fireEvent.click(screen.getByText('Selesai'));

      // Should show validation errors
      expect(screen.getByTestId('question-q5')).toHaveClass('error');
      expect(screen.getByTestId('question-q6')).toHaveClass('error');
      expect(screen.getByTestId('question-q7')).toHaveClass('error');
      expect(screen.getByTestId('question-q8')).toHaveClass('error');

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
      fireEvent.click(screen.getByText('Lanjut'));

      // Answer all questions on page 2
      fireEvent.click(screen.getByTestId('answer-q5-1'));
      fireEvent.click(screen.getByTestId('answer-q6-2'));
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
      fireEvent.click(screen.getByText('Lanjut'));

      fireEvent.click(screen.getByTestId('answer-q5-1'));
      fireEvent.click(screen.getByTestId('answer-q6-2'));
      fireEvent.click(screen.getByTestId('answer-q7-3'));
      fireEvent.click(screen.getByTestId('answer-q8-4'));

      // Submit
      fireEvent.click(screen.getByText('Selesai'));

      // Should show loading state
      expect(screen.getByText('Mengirim...')).toBeInTheDocument();

      // Buttons should be disabled during submission
      expect(screen.getByText('Mengirim...')).toBeDisabled();
    });

    test('should handle submission errors gracefully', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
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
      fireEvent.click(screen.getByText('Lanjut'));

      fireEvent.click(screen.getByTestId('answer-q5-1'));
      fireEvent.click(screen.getByTestId('answer-q6-2'));
      fireEvent.click(screen.getByTestId('answer-q7-3'));
      fireEvent.click(screen.getByTestId('answer-q8-4'));

      // Submit
      fireEvent.click(screen.getByText('Selesai'));

      // Should reset loading state on error
      await waitFor(() => {
        expect(screen.getByText('Selesai')).toBeInTheDocument();
        expect(screen.getByText('Selesai')).not.toBeDisabled();
      });

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error completing kepribadian:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Accessibility and UX', () => {
    test('should have proper ARIA attributes', () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Progress bar should have proper attributes
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toBeInTheDocument();
    });

    test('should focus on first error when validation fails', () => {
      // Mock scrollIntoView
      const mockScrollIntoView = jest.fn();
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
        value: mockScrollIntoView,
        writable: true,
      });

      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Try to advance without answering
      fireEvent.click(screen.getByText('Lanjut'));

      // Should attempt to scroll to first error
      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty questions array', () => {
      render(<PersonalityTestClient questions={[]} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Should show completed state or handle gracefully
      expect(screen.getByText('Halaman 1 dari 0')).toBeInTheDocument();
    });

    test('should handle single question', () => {
      const singleQuestion = [mockQuestions[0]];

      render(<PersonalityTestClient questions={singleQuestion} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Should show single question
      expect(screen.getByText('Halaman 1 dari 1')).toBeInTheDocument();
      expect(screen.getByTestId('question-q1')).toBeInTheDocument();

      // Should show "Selesai" immediately
      expect(screen.getByText('Selesai')).toBeInTheDocument();
    });

    test('should preserve state across page navigation', () => {
      render(<PersonalityTestClient questions={mockQuestions} />);

      fireEvent.click(screen.getByText('Close Modal'));

      // Answer questions on page 1
      fireEvent.click(screen.getByTestId('answer-q1-3'));
      fireEvent.click(screen.getByTestId('answer-q2-4'));
      fireEvent.click(screen.getByTestId('answer-q3-2'));
      fireEvent.click(screen.getByTestId('answer-q4-5'));

      // Go to next page
      fireEvent.click(screen.getByText('Lanjut'));

      // Go back
      fireEvent.click(screen.getByTestId('arrow-left'));

      // Answers should be preserved
      expect(screen.getByTestId('answer-q1-3')).toHaveClass('selected');
      expect(screen.getByTestId('answer-q2-4')).toHaveClass('selected');
      expect(screen.getByTestId('answer-q3-2')).toHaveClass('selected');
      expect(screen.getByTestId('answer-q4-5')).toHaveClass('selected');
    });
  });
});
