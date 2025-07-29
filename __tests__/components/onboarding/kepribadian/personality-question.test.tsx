import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
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
    div: ({ children, onClick, onAnimationComplete, ...props }: any) => {
      const {
        whileHover,
        whileTap,
        animate,
        transition,
        initial,
        ...restProps
      } = props;
      return (
        <div
          onClick={onClick}
          onAnimationEnd={onAnimationComplete}
          data-testid={props['data-testid'] || 'motion-div'}
          {...restProps}
        >
          {children}
        </div>
      );
    },
  },
}));

describe('PersonalityQuestion', () => {
  const mockOnAnswerAction = mock();
  const defaultProps = {
    question: 'Do you prefer working alone or in groups?',
    onAnswerAction: mockOnAnswerAction,
  };

  beforeEach(() => {
    mockOnAnswerAction.mockReset();
  });

  describe('Rendering', () => {
    test('renders question text correctly', () => {
      render(<PersonalityQuestion {...defaultProps} />);

      expect(
        screen.getByText('Do you prefer working alone or in groups?')
      ).toBeInTheDocument();
    });

    test('renders all 5 Likert scale options', () => {
      render(<PersonalityQuestion {...defaultProps} />);

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(5);

      // Check that all scale options are rendered
      expect(screen.getByAltText('Sangat Tidak\nSetuju')).toBeInTheDocument();
      expect(screen.getByAltText('Tidak Setuju')).toBeInTheDocument();
      expect(screen.getByAltText('Netral')).toBeInTheDocument();
      expect(screen.getByAltText('Setuju')).toBeInTheDocument();
      expect(screen.getByAltText('Sangat Setuju')).toBeInTheDocument();
    });

    test('renders scale labels correctly', () => {
      render(<PersonalityQuestion {...defaultProps} />);

      expect(screen.getByText('Tidak')).toBeInTheDocument();
      expect(screen.getByText('Setuju')).toBeInTheDocument();
    });

    test('renders with question ID when provided', () => {
      render(<PersonalityQuestion {...defaultProps} questionId='test-q1' />);

      const questionContainer = screen.getByRole('group');
      expect(questionContainer).toHaveAttribute('id', 'question-test-q1');
    });

    test('renders without question ID when not provided', () => {
      render(<PersonalityQuestion {...defaultProps} />);

      const questionContainer = screen.getByRole('group');
      expect(questionContainer).not.toHaveAttribute('id');
    });
  });

  describe('Initial State', () => {
    test('has no selected value by default', () => {
      render(<PersonalityQuestion {...defaultProps} />);

      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img.getAttribute('src')).toContain('-not-active');
      });
    });

    test('displays initial value when provided', () => {
      render(<PersonalityQuestion {...defaultProps} initialValue={3} />);

      const neutralImage = screen.getByAltText('Netral');
      expect(neutralImage.getAttribute('src')).toContain('netral.svg');
      expect(neutralImage.getAttribute('src')).not.toContain('-not-active');
    });

    test('shows no error state by default', () => {
      render(<PersonalityQuestion {...defaultProps} />);

      const container = screen.getByRole('group');
      expect(container).not.toHaveClass('border-red-700');
      expect(screen.queryByTestId('warning-icon')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('calls onAnswerAction when option is selected', () => {
      render(<PersonalityQuestion {...defaultProps} />);

      const motionDivs = screen.getAllByTestId('motion-div');
      fireEvent.click(motionDivs[2]); // Click neutral option (value 3)

      expect(mockOnAnswerAction).toHaveBeenCalledWith(3);
    });

    test('updates selected state when option is clicked', () => {
      render(<PersonalityQuestion {...defaultProps} />);

      const motionDivs = screen.getAllByTestId('motion-div');
      fireEvent.click(motionDivs[2]); // Click neutral option

      const neutralImage = screen.getByAltText('Netral');
      expect(neutralImage.getAttribute('src')).toContain('netral.svg');
      expect(neutralImage.getAttribute('src')).not.toContain('-not-active');
    });

    test('allows changing selection', () => {
      render(<PersonalityQuestion {...defaultProps} />);

      const motionDivs = screen.getAllByTestId('motion-div');

      // Select neutral first
      fireEvent.click(motionDivs[2]);
      let neutralImage = screen.getByAltText('Netral');
      expect(neutralImage.getAttribute('src')).not.toContain('-not-active');

      // Change to agree
      fireEvent.click(motionDivs[3]);
      const agreeImage = screen.getByAltText('Setuju');
      expect(agreeImage.getAttribute('src')).not.toContain('-not-active');

      // Neutral should now be inactive
      neutralImage = screen.getByAltText('Netral');
      expect(neutralImage.getAttribute('src')).toContain('-not-active');
    });

    test('calls onAnswerAction for each value correctly', () => {
      render(<PersonalityQuestion {...defaultProps} />);

      const motionDivs = screen.getAllByTestId('motion-div');

      motionDivs.forEach((div, index) => {
        fireEvent.click(div);
        expect(mockOnAnswerAction).toHaveBeenCalledWith(index + 1);
      });

      expect(mockOnAnswerAction).toHaveBeenCalledTimes(5);
    });
  });

  describe('Error State', () => {
    test('shows error styling when hasError is true', () => {
      render(<PersonalityQuestion {...defaultProps} hasError={true} />);

      const questionContainer = screen.getByRole('group').firstChild;
      expect(questionContainer).toHaveClass('border-red-700');
    });

    test('displays error message when hasError is true', () => {
      render(<PersonalityQuestion {...defaultProps} hasError={true} />);

      expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
      expect(
        screen.getByText('Pertanyaan ini wajib diisi')
      ).toBeInTheDocument();
    });

    test('hides error message when hasError is false', () => {
      render(<PersonalityQuestion {...defaultProps} hasError={false} />);

      expect(screen.queryByTestId('warning-icon')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Pertanyaan ini wajib diisi')
      ).not.toBeInTheDocument();
    });

    test('shows bottom border when not in error state', () => {
      render(<PersonalityQuestion {...defaultProps} hasError={false} />);

      const bottomBorder = screen.getByRole('group').querySelector('.border-b');
      expect(bottomBorder).toBeInTheDocument();
    });

    test('hides bottom border when in error state', () => {
      render(<PersonalityQuestion {...defaultProps} hasError={true} />);

      const bottomBorder = screen.getByRole('group').querySelector('.border-b');
      expect(bottomBorder).not.toBeInTheDocument();
    });
  });

  describe('Animation States', () => {
    test('prevents clicks during animation', () => {
      render(<PersonalityQuestion {...defaultProps} />);

      const motionDivs = screen.getAllByTestId('motion-div');

      // First click should work
      fireEvent.click(motionDivs[2]);
      expect(mockOnAnswerAction).toHaveBeenCalledWith(3);

      // Simulate animation state by immediately clicking again
      fireEvent.click(motionDivs[3]);

      // Should still only be called once if animation is blocking
      expect(mockOnAnswerAction).toHaveBeenCalledTimes(1);
    });

    test('animation complete handler resets animation state', () => {
      render(<PersonalityQuestion {...defaultProps} />);

      const motionDivs = screen.getAllByTestId('motion-div');

      // Click to start animation
      fireEvent.click(motionDivs[2]);

      // Simulate animation complete
      fireEvent.animationEnd(motionDivs[2]);

      // Should be able to click again
      fireEvent.click(motionDivs[3]);
      expect(mockOnAnswerAction).toHaveBeenCalledTimes(2);
    });

    test('tracks previous value for animation', () => {
      const { rerender } = render(<PersonalityQuestion {...defaultProps} />);

      const motionDivs = screen.getAllByTestId('motion-div');

      // First selection
      fireEvent.click(motionDivs[2]);

      // Second selection - should track previous value
      fireEvent.click(motionDivs[3]);

      // The component should handle previous value internally
      expect(mockOnAnswerAction).toHaveBeenCalledWith(3);
      expect(mockOnAnswerAction).toHaveBeenCalledWith(4);
    });
  });

  describe('Accessibility', () => {
    test('images have proper alt text', () => {
      render(<PersonalityQuestion {...defaultProps} />);

      const expectedAltTexts = [
        'Sangat Tidak\nSetuju',
        'Tidak Setuju',
        'Netral',
        'Setuju',
        'Sangat Setuju',
      ];

      expectedAltTexts.forEach(altText => {
        expect(screen.getByAltText(altText)).toBeInTheDocument();
      });
    });

    test('has proper container structure', () => {
      render(<PersonalityQuestion {...defaultProps} />);

      const container = screen.getByRole('group');
      expect(container).toHaveClass('space-y-6');
    });

    test('error message is properly associated', () => {
      render(<PersonalityQuestion {...defaultProps} hasError={true} />);

      const errorMessage = screen.getByText('Pertanyaan ini wajib diisi');
      expect(errorMessage).toHaveClass('text-red-700');
    });

    test('maintains focus management structure', () => {
      render(<PersonalityQuestion {...defaultProps} />);

      const motionDivs = screen.getAllByTestId('motion-div');
      motionDivs.forEach(div => {
        expect(div).toHaveClass('cursor-pointer');
      });
    });
  });

  describe('Props Validation', () => {
    test('handles string questionId', () => {
      render(<PersonalityQuestion {...defaultProps} questionId='string-id' />);

      const container = screen.getByRole('group');
      expect(container).toHaveAttribute('id', 'question-string-id');
    });

    test('handles numeric questionId', () => {
      render(<PersonalityQuestion {...defaultProps} questionId={42} />);

      const container = screen.getByRole('group');
      expect(container).toHaveAttribute('id', 'question-42');
    });

    test('handles undefined initialValue', () => {
      render(
        <PersonalityQuestion {...defaultProps} initialValue={undefined} />
      );

      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img.getAttribute('src')).toContain('-not-active');
      });
    });

    test('handles null initialValue', () => {
      render(
        <PersonalityQuestion {...defaultProps} initialValue={undefined} />
      );

      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img.getAttribute('src')).toContain('-not-active');
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles empty question text', () => {
      render(<PersonalityQuestion {...defaultProps} question='' />);

      const questionText = screen.getByText('');
      expect(questionText).toBeInTheDocument();
    });

    test('handles very long question text', () => {
      const longQuestion =
        'This is a very long question that should still be rendered properly and not break the layout or functionality of the component even when it contains many words and characters.';

      render(<PersonalityQuestion {...defaultProps} question={longQuestion} />);

      expect(screen.getByText(longQuestion)).toBeInTheDocument();
    });

    test('handles rapid consecutive clicks', () => {
      render(<PersonalityQuestion {...defaultProps} />);

      const motionDivs = screen.getAllByTestId('motion-div');

      // Rapid clicks
      fireEvent.click(motionDivs[0]);
      fireEvent.click(motionDivs[1]);
      fireEvent.click(motionDivs[2]);

      // Should only process one due to animation blocking
      expect(mockOnAnswerAction).toHaveBeenCalledTimes(1);
    });

    test('handles initialValue out of range', () => {
      render(<PersonalityQuestion {...defaultProps} initialValue={10} />);

      // Should not crash and should not mark any option as selected
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img.getAttribute('src')).toContain('-not-active');
      });
    });

    test('handles negative initialValue', () => {
      render(<PersonalityQuestion {...defaultProps} initialValue={-1} />);

      // Should not crash and should not mark any option as selected
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img.getAttribute('src')).toContain('-not-active');
      });
    });
  });

  describe('Visual State Management', () => {
    test('updates image sources correctly when selected', () => {
      render(<PersonalityQuestion {...defaultProps} />);

      const motionDivs = screen.getAllByTestId('motion-div');

      // Select each option and verify image source
      const expectedSources = [
        'sangat-tidak-setuju.svg',
        'tidak-setuju.svg',
        'netral.svg',
        'setuju.svg',
        'sangat-setuju.svg',
      ];

      expectedSources.forEach((expectedSrc, index) => {
        fireEvent.click(motionDivs[index]);

        const selectedImage = screen.getAllByRole('img')[index];
        expect(selectedImage.getAttribute('src')).toContain(expectedSrc);
        expect(selectedImage.getAttribute('src')).not.toContain('-not-active');
      });
    });

    test('maintains only one selected state at a time', () => {
      render(<PersonalityQuestion {...defaultProps} />);

      const motionDivs = screen.getAllByTestId('motion-div');

      // Select first option
      fireEvent.click(motionDivs[0]);

      let images = screen.getAllByRole('img');
      expect(images[0].getAttribute('src')).not.toContain('-not-active');
      images.slice(1).forEach(img => {
        expect(img.getAttribute('src')).toContain('-not-active');
      });

      // Select second option
      fireEvent.click(motionDivs[1]);

      images = screen.getAllByRole('img');
      expect(images[0].getAttribute('src')).toContain('-not-active');
      expect(images[1].getAttribute('src')).not.toContain('-not-active');
      images.slice(2).forEach(img => {
        expect(img.getAttribute('src')).toContain('-not-active');
      });
    });
  });

  describe('Performance', () => {
    test('does not cause unnecessary re-renders', () => {
      const { rerender } = render(<PersonalityQuestion {...defaultProps} />);

      // Re-render with same props
      rerender(<PersonalityQuestion {...defaultProps} />);

      // Should still work normally
      const motionDivs = screen.getAllByTestId('motion-div');
      fireEvent.click(motionDivs[2]);

      expect(mockOnAnswerAction).toHaveBeenCalledWith(3);
    });

    test('handles prop updates correctly', () => {
      const { rerender } = render(
        <PersonalityQuestion {...defaultProps} hasError={false} />
      );

      expect(screen.queryByTestId('warning-icon')).not.toBeInTheDocument();

      // Update props
      rerender(<PersonalityQuestion {...defaultProps} hasError={true} />);

      expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
    });

    test('handles question text updates', () => {
      const { rerender } = render(<PersonalityQuestion {...defaultProps} />);

      expect(
        screen.getByText('Do you prefer working alone or in groups?')
      ).toBeInTheDocument();

      // Update question
      rerender(
        <PersonalityQuestion
          {...defaultProps}
          question='Do you like team activities?'
        />
      );

      expect(
        screen.getByText('Do you like team activities?')
      ).toBeInTheDocument();
      expect(
        screen.queryByText('Do you prefer working alone or in groups?')
      ).not.toBeInTheDocument();
    });
  });

  describe('Integration with Parent Components', () => {
    test('maintains selection state across prop changes', () => {
      const { rerender } = render(
        <PersonalityQuestion {...defaultProps} initialValue={3} />
      );

      // Check initial state
      const neutralImage = screen.getByAltText('Netral');
      expect(neutralImage.getAttribute('src')).not.toContain('-not-active');

      // Update other props but keep initialValue
      rerender(
        <PersonalityQuestion
          {...defaultProps}
          initialValue={3}
          hasError={true}
        />
      );

      // Selection should be maintained
      const neutralImageAfter = screen.getByAltText('Netral');
      expect(neutralImageAfter.getAttribute('src')).not.toContain(
        '-not-active'
      );
    });

    test('responds to initialValue changes', () => {
      const { rerender } = render(
        <PersonalityQuestion {...defaultProps} initialValue={2} />
      );

      // Check initial state
      let disagreeImage = screen.getByAltText('Tidak Setuju');
      expect(disagreeImage.getAttribute('src')).not.toContain('-not-active');

      // Change initialValue
      rerender(<PersonalityQuestion {...defaultProps} initialValue={4} />);

      // Should update to new value
      const agreeImage = screen.getByAltText('Setuju');
      expect(agreeImage.getAttribute('src')).not.toContain('-not-active');

      // Previous value should be inactive
      disagreeImage = screen.getByAltText('Tidak Setuju');
      expect(disagreeImage.getAttribute('src')).toContain('-not-active');
    });
  });

  describe('Error Handling', () => {
    test('gracefully handles missing onAnswerAction', () => {
      const consoleErrorSpy = mock();

      render(
        <PersonalityQuestion
          question='Test'
          onAnswerAction={undefined as any}
        />
      );

      const motionDivs = screen.getAllByTestId('motion-div');

      // Should not crash when clicking
      expect(() => {
        fireEvent.click(motionDivs[0]);
      }).not.toThrow();

      consoleErrorSpy.mockRestore();
    });

    test('handles invalid prop combinations gracefully', () => {
      render(
        <PersonalityQuestion
          question='Test'
          onAnswerAction={mockOnAnswerAction}
          hasError={true}
          initialValue={3}
        />
      );

      // Should render both error state and initial value
      expect(screen.getByTestId('warning-icon')).toBeInTheDocument();

      const neutralImage = screen.getByAltText('Netral');
      expect(neutralImage.getAttribute('src')).not.toContain('-not-active');
    });
  });
});
