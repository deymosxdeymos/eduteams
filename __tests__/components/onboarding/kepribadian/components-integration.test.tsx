import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import InstructionModal from '../../../../src/components/onboarding/kepribadian/instruction-modal';
import PersonalityQuestion from '../../../../src/components/onboarding/kepribadian/personality-question';

// Mock Next.js Image component
mock.module('next/image', () => ({
  default: ({ src, alt, width, height, className }: any) => (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  ),
}));

// Mock Lucide React icons
mock.module('lucide-react', () => ({
  MessageSquareWarning: ({ className }: { className: string }) => (
    <span data-testid='warning-icon' className={className}>
      ⚠️
    </span>
  ),
}));

// Mock Framer Motion
mock.module('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, onAnimationComplete, ...props }: any) => (
      <div
        onClick={onClick}
        onAnimationEnd={onAnimationComplete}
        data-testid={props['data-testid'] || 'motion-div'}
        {...props}
      >
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock Button component
mock.module('../../../../src/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className, ...props }: any) => (
    <button
      onClick={onClick}
      className={`${variant} ${size} ${className}`}
      data-testid={props['data-testid'] || 'button'}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Integration test component that uses both components
const PersonalityTestIntegration = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(true);
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  const [errors, setErrors] = React.useState<Record<string, boolean>>({});

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));

    // Clear error when answered
    if (errors[questionId]) {
      setErrors(prev => ({
        ...prev,
        [questionId]: false,
      }));
    }
  };

  const validateAnswers = () => {
    const questions = ['q1', 'q2', 'q3'];
    const newErrors: Record<string, boolean> = {};

    questions.forEach(questionId => {
      if (!answers[questionId]) {
        newErrors[questionId] = true;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <div data-testid='personality-test-integration'>
      <InstructionModal isOpen={isModalOpen} onCloseAction={handleCloseModal} />

      {!isModalOpen && (
        <div data-testid='questions-container'>
          <PersonalityQuestion
            question='Do you enjoy working in teams?'
            questionId='q1'
            hasError={errors.q1}
            onAnswerAction={value => handleAnswer('q1', value)}
            initialValue={answers.q1}
          />

          <PersonalityQuestion
            question='Are you comfortable with leadership roles?'
            questionId='q2'
            hasError={errors.q2}
            onAnswerAction={value => handleAnswer('q2', value)}
            initialValue={answers.q2}
          />

          <PersonalityQuestion
            question='Do you prefer detailed planning over spontaneous decisions?'
            questionId='q3'
            hasError={errors.q3}
            onAnswerAction={value => handleAnswer('q3', value)}
            initialValue={answers.q3}
          />

          <button data-testid='validate-button' onClick={validateAnswers}>
            Validate Answers
          </button>

          <div data-testid='answers-display'>
            {Object.entries(answers).map(([questionId, value]) => (
              <div key={questionId} data-testid={`answer-${questionId}`}>
                {questionId}: {value}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

describe('PersonalityQuestion and InstructionModal Integration', () => {
  beforeEach(() => {
    // Reset any global state if needed
  });

  describe('Modal and Questions Flow', () => {
    test('shows instruction modal initially and hides questions', () => {
      render(<PersonalityTestIntegration />);

      // Modal should be visible
      expect(
        screen.getByText('Instruksi Pengerjaan Tes Kepribadian')
      ).toBeInTheDocument();

      // Questions should not be visible
      expect(
        screen.queryByTestId('questions-container')
      ).not.toBeInTheDocument();
    });

    test('closes modal and shows questions when button is clicked', () => {
      render(<PersonalityTestIntegration />);

      // Click the modal button
      const modalButton = screen.getByText('Mulai Sekarang');
      fireEvent.click(modalButton);

      // Modal should be hidden
      expect(
        screen.queryByText('Instruksi Pengerjaan Tes Kepribadian')
      ).not.toBeInTheDocument();

      // Questions should be visible
      expect(screen.getByTestId('questions-container')).toBeInTheDocument();
      expect(
        screen.getByText('Do you enjoy working in teams?')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Are you comfortable with leadership roles?')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Do you prefer detailed planning over spontaneous decisions?'
        )
      ).toBeInTheDocument();
    });

    test('allows answering questions after modal is closed', () => {
      render(<PersonalityTestIntegration />);

      // Close modal
      fireEvent.click(screen.getByText('Mulai Sekarang'));

      // Answer first question
      const questionDivs = screen.getAllByTestId('motion-div');
      fireEvent.click(questionDivs[2]); // Click third option (value 3) for first question

      // Check that answer is recorded
      expect(screen.getByTestId('answer-q1')).toHaveTextContent('q1: 3');
    });

    test('validates answers and shows errors for unanswered questions', () => {
      render(<PersonalityTestIntegration />);

      // Close modal
      fireEvent.click(screen.getByText('Mulai Sekarang'));

      // Answer only first question
      const questionDivs = screen.getAllByTestId('motion-div');
      fireEvent.click(questionDivs[2]); // Answer q1

      // Try to validate
      fireEvent.click(screen.getByTestId('validate-button'));

      // Check that errors are shown for unanswered questions
      expect(screen.getAllByTestId('warning-icon')).toHaveLength(2); // q2 and q3 should have errors
    });

    test('clears errors when questions are answered', () => {
      render(<PersonalityTestIntegration />);

      // Close modal
      fireEvent.click(screen.getByText('Mulai Sekarang'));

      // Validate to show errors
      fireEvent.click(screen.getByTestId('validate-button'));

      // Should have errors
      expect(screen.getAllByTestId('warning-icon')).toHaveLength(3);

      // Answer first question
      const questionDivs = screen.getAllByTestId('motion-div');
      fireEvent.click(questionDivs[2]); // Answer q1

      // Error for q1 should be cleared
      expect(screen.getAllByTestId('warning-icon')).toHaveLength(2);
    });

    test('maintains answer state across interactions', () => {
      render(<PersonalityTestIntegration />);

      // Close modal
      fireEvent.click(screen.getByText('Mulai Sekarang'));

      // Answer questions
      const questionDivs = screen.getAllByTestId('motion-div');
      fireEvent.click(questionDivs[2]); // q1 = 3
      fireEvent.click(questionDivs[6]); // q2 = 2 (second question, second option)
      fireEvent.click(questionDivs[12]); // q3 = 3 (third question, third option)

      // Check all answers are recorded
      expect(screen.getByTestId('answer-q1')).toHaveTextContent('q1: 3');
      expect(screen.getByTestId('answer-q2')).toHaveTextContent('q2: 2');
      expect(screen.getByTestId('answer-q3')).toHaveTextContent('q3: 3');

      // Validate should pass
      fireEvent.click(screen.getByTestId('validate-button'));

      // No errors should be shown
      expect(screen.queryByTestId('warning-icon')).not.toBeInTheDocument();
    });

    test('allows changing answers', () => {
      render(<PersonalityTestIntegration />);

      // Close modal
      fireEvent.click(screen.getByText('Mulai Sekarang'));

      // Answer first question
      const questionDivs = screen.getAllByTestId('motion-div');
      fireEvent.click(questionDivs[2]); // q1 = 3

      expect(screen.getByTestId('answer-q1')).toHaveTextContent('q1: 3');

      // Change answer
      fireEvent.click(questionDivs[4]); // q1 = 5

      expect(screen.getByTestId('answer-q1')).toHaveTextContent('q1: 5');
    });
  });

  describe('Error State Management', () => {
    test('shows error styling correctly', () => {
      render(<PersonalityTestIntegration />);

      // Close modal
      fireEvent.click(screen.getByText('Mulai Sekarang'));

      // Validate to show errors
      fireEvent.click(screen.getByTestId('validate-button'));

      // Check that question containers have error styling
      const questionContainers = screen.getAllByRole('group');
      questionContainers.forEach(container => {
        const questionDiv = container.firstChild as HTMLElement;
        expect(questionDiv).toHaveClass('border-red-700');
      });
    });

    test('removes error styling when questions are answered', () => {
      render(<PersonalityTestIntegration />);

      // Close modal
      fireEvent.click(screen.getByText('Mulai Sekarang'));

      // Validate to show errors
      fireEvent.click(screen.getByTestId('validate-button'));

      // Answer first question
      const questionDivs = screen.getAllByTestId('motion-div');
      fireEvent.click(questionDivs[2]);

      // First question should no longer have error styling
      const firstQuestionContainer = screen.getAllByRole('group')[0];
      const firstQuestionDiv = firstQuestionContainer.firstChild as HTMLElement;
      expect(firstQuestionDiv).not.toHaveClass('border-red-700');
    });
  });

  describe('Performance and Accessibility', () => {
    test('components render without performance issues', () => {
      const startTime = performance.now();

      render(<PersonalityTestIntegration />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render quickly (less than 100ms)
      expect(renderTime).toBeLessThan(100);
    });

    test('maintains accessibility attributes', () => {
      render(<PersonalityTestIntegration />);

      // Close modal
      fireEvent.click(screen.getByText('Mulai Sekarang'));

      // Check that all images have alt text
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).toBeTruthy();
      });
    });

    test('supports keyboard navigation', () => {
      render(<PersonalityTestIntegration />);

      // Modal button should be focusable
      const modalButton = screen.getByText('Mulai Sekarang');
      expect(modalButton.tagName).toBe('BUTTON');

      // Close modal
      fireEvent.click(modalButton);

      // Validate button should be focusable
      const validateButton = screen.getByTestId('validate-button');
      expect(validateButton.tagName).toBe('BUTTON');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('handles rapid interactions gracefully', () => {
      render(<PersonalityTestIntegration />);

      // Close modal
      fireEvent.click(screen.getByText('Mulai Sekarang'));

      // Rapid clicks on the same question
      const questionDivs = screen.getAllByTestId('motion-div');
      fireEvent.click(questionDivs[2]);
      fireEvent.click(questionDivs[3]);
      fireEvent.click(questionDivs[4]);

      // Should handle gracefully and record the last click
      expect(screen.getByTestId('answer-q1')).toHaveTextContent('q1: 5');
    });

    test('handles component unmounting gracefully', () => {
      const { unmount } = render(<PersonalityTestIntegration />);

      // Close modal
      fireEvent.click(screen.getByText('Mulai Sekarang'));

      // Answer a question
      const questionDivs = screen.getAllByTestId('motion-div');
      fireEvent.click(questionDivs[2]);

      // Should unmount without errors
      expect(() => unmount()).not.toThrow();
    });

    test('maintains state consistency during re-renders', () => {
      const { rerender } = render(<PersonalityTestIntegration />);

      // Close modal
      fireEvent.click(screen.getByText('Mulai Sekarang'));

      // Answer questions
      const questionDivs = screen.getAllByTestId('motion-div');
      fireEvent.click(questionDivs[2]);

      // Re-render
      rerender(<PersonalityTestIntegration />);

      // Should maintain modal closed state
      expect(
        screen.queryByText('Instruksi Pengerjaan Tes Kepribadian')
      ).not.toBeInTheDocument();
    });
  });

  describe('User Experience Flow', () => {
    test('complete user journey from modal to answered questions', () => {
      render(<PersonalityTestIntegration />);

      // Step 1: User sees instruction modal
      expect(
        screen.getByText('Instruksi Pengerjaan Tes Kepribadian')
      ).toBeInTheDocument();
      expect(screen.getByText('Mulai Sekarang')).toBeInTheDocument();

      // Step 2: User reads instructions and clicks start
      fireEvent.click(screen.getByText('Mulai Sekarang'));

      // Step 3: User sees questions
      expect(screen.getByTestId('questions-container')).toBeInTheDocument();
      expect(
        screen.getByText('Do you enjoy working in teams?')
      ).toBeInTheDocument();

      // Step 4: User answers all questions
      const questionDivs = screen.getAllByTestId('motion-div');
      fireEvent.click(questionDivs[2]); // q1 = 3
      fireEvent.click(questionDivs[6]); // q2 = 2
      fireEvent.click(questionDivs[12]); // q3 = 3

      // Step 5: User validates answers
      fireEvent.click(screen.getByTestId('validate-button'));

      // Step 6: No errors shown (successful completion)
      expect(screen.queryByTestId('warning-icon')).not.toBeInTheDocument();

      // Step 7: All answers are recorded
      expect(screen.getByTestId('answer-q1')).toHaveTextContent('q1: 3');
      expect(screen.getByTestId('answer-q2')).toHaveTextContent('q2: 2');
      expect(screen.getByTestId('answer-q3')).toHaveTextContent('q3: 3');
    });
  });
});
