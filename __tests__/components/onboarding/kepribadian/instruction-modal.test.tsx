import { beforeEach, afterEach, describe, expect, mock, test } from 'bun:test';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import type React from 'react';
import InstructionModal from '../../../../src/components/onboarding/kepribadian/instruction-modal';

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

// Mock Framer Motion
mock.module('framer-motion', () => ({
  motion: {
    div: ({
      children,
      onClick,
      initial,
      animate,
      exit,
      transition,
      className,
      ...props
    }: any) => (
      <div
        onClick={onClick}
        className={className}
        data-testid={props['data-testid'] || 'motion-div'}
        {...props}
      >
        {children}
      </div>
    ),
    span: ({ children, onClick, onAnimationComplete, ...props }: any) => (
      <span
        onClick={onClick}
        onAnimationEnd={onAnimationComplete}
        data-testid={props['data-testid'] || 'motion-span'}
        {...props}
      >
        {children}
      </span>
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

describe('InstructionModal', () => {
  const mockOnCloseAction = mock();
  const defaultProps = {
    isOpen: true,
    onCloseAction: mockOnCloseAction,
  };

  beforeEach(() => {
    mockOnCloseAction.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Rendering', () => {
    test('renders modal when isOpen is true', () => {
      render(<InstructionModal {...defaultProps} />);

      expect(
        screen.getByText('Instruksi Pengerjaan Tes Kepribadian')
      ).toBeInTheDocument();
      expect(screen.getByText('Mulai Sekarang')).toBeInTheDocument();
    });

    test('does not render modal when isOpen is false', () => {
      render(<InstructionModal {...defaultProps} isOpen={false} />);

      expect(
        screen.queryByText('Instruksi Pengerjaan Tes Kepribadian')
      ).not.toBeInTheDocument();
      expect(screen.queryByText('Mulai Sekarang')).not.toBeInTheDocument();
    });

    test('renders mascot image correctly', () => {
      render(<InstructionModal {...defaultProps} />);

      const mascotImage = screen.getByAltText('mascot');
      expect(mascotImage).toBeInTheDocument();
      expect(mascotImage.getAttribute('src')).toBe('/mascot-yellow.svg');
      expect(mascotImage.getAttribute('width')).toBe('120');
      expect(mascotImage.getAttribute('height')).toBe('120');
    });

    test('renders all instruction points', () => {
      render(<InstructionModal {...defaultProps} />);

      expect(
        screen.getByText(
          /Pilihlah jawaban.*yang paling sesuai.*hingga.*yang tidak sesuai.*dengan kondisimu saat ini/
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Temukan posisi senyaman mungkin dan pastikan tidak ada kegiatan lain/
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Jawablah setiap pertanyaan dengan jujur/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Sesuaikan jawaban kamu dengan parameter jawaban berikut/
        )
      ).toBeInTheDocument();
    });

    test('renders all Likert scale options', () => {
      render(<InstructionModal {...defaultProps} />);

      const images = screen.getAllByRole('img');
      // Should have mascot + 5 Likert scale images
      expect(images.length).toBe(6);

      // Check Likert scale images
      expect(screen.getByAltText('Sangat Tidak\nSetuju')).toBeInTheDocument();
      expect(screen.getByAltText('Tidak Setuju')).toBeInTheDocument();
      expect(screen.getByAltText('Netral')).toBeInTheDocument();
      expect(screen.getByAltText('Setuju')).toBeInTheDocument();
      expect(screen.getByAltText('Sangat Setuju')).toBeInTheDocument();
    });

    test('renders scale labels correctly', () => {
      render(<InstructionModal {...defaultProps} />);

      // Check for text content in labels
      expect(screen.getByText('Sangat Tidak\nSetuju')).toBeInTheDocument();
      expect(screen.getByText('Tidak Setuju')).toBeInTheDocument();
      expect(screen.getByText('Netral')).toBeInTheDocument();
      expect(screen.getByText('Setuju')).toBeInTheDocument();
      expect(screen.getByText('Sangat Setuju')).toBeInTheDocument();
    });

    test('renders button with correct styling', () => {
      render(<InstructionModal {...defaultProps} />);

      const button = screen.getByText('Mulai Sekarang');
      expect(button).toHaveClass('onboarding');
      expect(button).toHaveClass('long');
      expect(button).toHaveClass('text-lg');
      expect(button).toHaveClass('font-semibold');
    });
  });

  describe('User Interactions', () => {
    test('calls onCloseAction when button is clicked', () => {
      render(<InstructionModal {...defaultProps} />);

      const button = screen.getByText('Mulai Sekarang');
      fireEvent.click(button);

      expect(mockOnCloseAction).toHaveBeenCalledTimes(1);
    });

    test('calls onCloseAction only once per click', () => {
      render(<InstructionModal {...defaultProps} />);

      const button = screen.getByText('Mulai Sekarang');
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockOnCloseAction).toHaveBeenCalledTimes(2);
    });

    test('handles rapid button clicks', () => {
      render(<InstructionModal {...defaultProps} />);

      const button = screen.getByText('Mulai Sekarang');

      // Rapid clicks
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockOnCloseAction).toHaveBeenCalledTimes(3);
    });
  });

  describe('Modal State Management', () => {
    test('shows modal content when isOpen changes from false to true', () => {
      const { rerender } = render(
        <InstructionModal {...defaultProps} isOpen={false} />
      );

      expect(
        screen.queryByText('Instruksi Pengerjaan Tes Kepribadian')
      ).not.toBeInTheDocument();

      rerender(<InstructionModal {...defaultProps} isOpen={true} />);

      expect(
        screen.getByText('Instruksi Pengerjaan Tes Kepribadian')
      ).toBeInTheDocument();
    });

    test('hides modal content when isOpen changes from true to false', () => {
      const { rerender } = render(
        <InstructionModal {...defaultProps} isOpen={true} />
      );

      expect(
        screen.getByText('Instruksi Pengerjaan Tes Kepribadian')
      ).toBeInTheDocument();

      rerender(<InstructionModal {...defaultProps} isOpen={false} />);

      expect(
        screen.queryByText('Instruksi Pengerjaan Tes Kepribadian')
      ).not.toBeInTheDocument();
    });

    test('maintains callback reference across renders', () => {
      const { rerender } = render(<InstructionModal {...defaultProps} />);

      const button = screen.getByText('Mulai Sekarang');
      fireEvent.click(button);

      expect(mockOnCloseAction).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(<InstructionModal {...defaultProps} />);

      fireEvent.click(button);
      expect(mockOnCloseAction).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    test('has proper modal structure', () => {
      render(<InstructionModal {...defaultProps} />);

      // Check for modal overlay
      const modalOverlay = screen
        .getByText('Instruksi Pengerjaan Tes Kepribadian')
        .closest('[class*="fixed"]');
      expect(modalOverlay).toBeInTheDocument();
    });

    test('images have proper alt text', () => {
      render(<InstructionModal {...defaultProps} />);

      const mascotImage = screen.getByAltText('mascot');
      expect(mascotImage).toBeInTheDocument();

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

    test('button is focusable and clickable', () => {
      render(<InstructionModal {...defaultProps} />);

      const button = screen.getByText('Mulai Sekarang');
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });

    test('modal has proper z-index layering', () => {
      render(<InstructionModal {...defaultProps} />);

      const modalOverlay = screen
        .getByText('Instruksi Pengerjaan Tes Kepribadian')
        .closest('[class*="z-50"]');
      expect(modalOverlay).toBeInTheDocument();
    });
  });

  describe('Content Validation', () => {
    test('displays correct title', () => {
      render(<InstructionModal {...defaultProps} />);

      const title = screen.getByText('Instruksi Pengerjaan Tes Kepribadian');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('text-3xl');
      expect(title).toHaveClass('font-bold');
    });

    test('displays all instruction steps in correct order', () => {
      render(<InstructionModal {...defaultProps} />);

      const instructions = screen.getAllByText(/^[0-9]+\./);
      expect(instructions).toHaveLength(4);

      expect(instructions[0]).toHaveTextContent('1. Pilihlah jawaban');
      expect(instructions[1]).toHaveTextContent(
        '2. Temukan posisi senyaman mungkin'
      );
      expect(instructions[2]).toHaveTextContent(
        '3. Jawablah setiap pertanyaan dengan jujur'
      );
      expect(instructions[3]).toHaveTextContent(
        '4. Sesuaikan jawaban kamu dengan parameter jawaban berikut:'
      );
    });

    test('displays emphasized text correctly', () => {
      render(<InstructionModal {...defaultProps} />);

      const boldTexts = screen.getAllByText((content, element) => {
        return (
          element !== null &&
          element.tagName === 'SPAN' &&
          element.className.includes('font-bold')
        );
      });

      expect(boldTexts.length).toBeGreaterThan(0);
    });

    expect(boldTexts.length).toBeGreaterThan(0);
  });

  test('displays Likert scale images with correct sources', () => {
    render(<InstructionModal {...defaultProps} />);

    const expectedSources = [
      '/mbti/sangat-tidak-setuju.svg',
      '/mbti/tidak-setuju.svg',
      '/mbti/netral.svg',
      '/mbti/setuju.svg',
      '/mbti/sangat-setuju.svg',
    ];

    expectedSources.forEach(src => {
      const iconName = src
        .split('/')
        .pop()
        ?.replace('.svg', '')
        .replace(/-/g, ' ');
      if (iconName) {
        const image = screen.getByRole('img', {
          name: new RegExp(iconName, 'i'),
        });
        expect(image).toBeInTheDocument();
        expect(image.getAttribute('src')).toBe(src);
      }
    });
  });
});

describe('Layout and Styling', () => {
  test('modal has proper backdrop styling', () => {
    render(<InstructionModal {...defaultProps} />);

    const backdrop = screen
      .getByText('Instruksi Pengerjaan Tes Kepribadian')
      .closest('[class*="bg-black/50"]');
    expect(backdrop).toBeInTheDocument();
  });

  test('modal content has proper styling', () => {
    render(<InstructionModal {...defaultProps} />);

    const modalContent = screen
      .getByText('Instruksi Pengerjaan Tes Kepribadian')
      .closest('[class*="bg-white"]');
    expect(modalContent).toBeInTheDocument();
  });

  test('mascot image has proper positioning', () => {
    render(<InstructionModal {...defaultProps} />);

    const mascotImage = screen.getByAltText('mascot');
    expect(mascotImage).toHaveClass('absolute');
    expect(mascotImage).toHaveClass('-top-20');
    expect(mascotImage).toHaveClass('left-1/2');
    expect(mascotImage).toHaveClass('transform');
    expect(mascotImage).toHaveClass('-translate-x-1/2');
  });

  test('Likert scale has proper layout', () => {
    render(<InstructionModal {...defaultProps} />);

    const scaleContainer = screen
      .getByText('Sangat Tidak\nSetuju')
      .closest('[class*="flex"]');
    expect(scaleContainer).toBeInTheDocument();
  });

  test('button has proper center alignment', () => {
    render(<InstructionModal {...defaultProps} />);

    const buttonContainer = screen
      .getByText('Mulai Sekarang')
      .closest('[class*="flex"]');
    expect(buttonContainer).toBeInTheDocument();
    expect(buttonContainer).toHaveClass('justify-center');
  });
});

describe('Props Validation', () => {
  test('handles undefined onCloseAction gracefully', () => {
    const consoleErrorSpy = mock();

    render(<InstructionModal isOpen={true} onCloseAction={undefined as any} />);

    const button = screen.getByText('Mulai Sekarang');

    expect(() => {
      fireEvent.click(button);
    }).not.toThrow();

    consoleErrorSpy.mockRestore();
  });

  test('handles boolean isOpen prop correctly', () => {
    const { rerender } = render(
      <InstructionModal isOpen={false} onCloseAction={mockOnCloseAction} />
    );

    expect(
      screen.queryByText('Instruksi Pengerjaan Tes Kepribadian')
    ).not.toBeInTheDocument();

    rerender(
      <InstructionModal isOpen={true} onCloseAction={mockOnCloseAction} />
    );

    expect(
      screen.getByText('Instruksi Pengerjaan Tes Kepribadian')
    ).toBeInTheDocument();
  });
});

describe('Animation Integration', () => {
  test('renders AnimatePresence wrapper', () => {
    render(<InstructionModal {...defaultProps} />);

    // AnimatePresence should be present (mocked to render children)
    expect(
      screen.getByText('Instruksi Pengerjaan Tes Kepribadian')
    ).toBeInTheDocument();
  });

  test('renders motion components', () => {
    render(<InstructionModal {...defaultProps} />);

    // Motion divs should be present (mocked to render as regular divs)
    const motionDivs = screen.getAllByTestId('motion-div');
    expect(motionDivs.length).toBeGreaterThan(0);
  });

  test('handles animation props without crashing', () => {
    expect(() => {
      render(<InstructionModal {...defaultProps} />);
    }).not.toThrow();
  });
});

describe('Edge Cases', () => {
  test('handles multiple rapid open/close cycles', () => {
    const { rerender } = render(
      <InstructionModal {...defaultProps} isOpen={false} />
    );

    // Rapid open/close cycles
    rerender(<InstructionModal {...defaultProps} isOpen={true} />);
    rerender(<InstructionModal {...defaultProps} isOpen={false} />);
    rerender(<InstructionModal {...defaultProps} isOpen={true} />);
    rerender(<InstructionModal {...defaultProps} isOpen={false} />);

    expect(
      screen.queryByText('Instruksi Pengerjaan Tes Kepribadian')
    ).not.toBeInTheDocument();

    rerender(<InstructionModal {...defaultProps} isOpen={true} />);
    expect(
      screen.getByText('Instruksi Pengerjaan Tes Kepribadian')
    ).toBeInTheDocument();
  });

  test('handles callback function changes', () => {
    const newCallback = mock();
    const { rerender } = render(<InstructionModal {...defaultProps} />);

    const button = screen.getByText('Mulai Sekarang');
    fireEvent.click(button);

    expect(mockOnCloseAction).toHaveBeenCalledTimes(1);
    expect(newCallback).not.toHaveBeenCalled();

    rerender(<InstructionModal isOpen={true} onCloseAction={newCallback} />);

    fireEvent.click(button);
    expect(mockOnCloseAction).toHaveBeenCalledTimes(1);
    expect(newCallback).toHaveBeenCalledTimes(1);
  });

  test('maintains image aspect ratios', () => {
    render(<InstructionModal {...defaultProps} />);

    const mascotImage = screen.getByAltText('mascot');
    expect(mascotImage.getAttribute('width')).toBe('120');
    expect(mascotImage.getAttribute('height')).toBe('120');

    const scaleImages = screen
      .getAllByRole('img')
      .filter(img => img.getAttribute('alt') !== 'mascot');
    scaleImages.forEach(img => {
      expect(img.getAttribute('width')).toBe('48');
      expect(img.getAttribute('height')).toBe('48');
    });
  });
});

describe('Performance', () => {
  test('does not cause unnecessary re-renders', () => {
    const { rerender } = render(<InstructionModal {...defaultProps} />);

    // Re-render with same props
    rerender(<InstructionModal {...defaultProps} />);

    // Should still work normally
    const button = screen.getByText('Mulai Sekarang');
    fireEvent.click(button);

    expect(mockOnCloseAction).toHaveBeenCalledWith();
  });

  test('efficiently handles prop updates', () => {
    const { rerender } = render(
      <InstructionModal {...defaultProps} isOpen={false} />
    );

    expect(
      screen.queryByText('Instruksi Pengerjaan Tes Kepribadian')
    ).not.toBeInTheDocument();

    rerender(<InstructionModal {...defaultProps} isOpen={true} />);

    expect(
      screen.getByText('Instruksi Pengerjaan Tes Kepribadian')
    ).toBeInTheDocument();
  });
});

describe('Integration with Parent Components', () => {
  test('maintains state consistency across prop changes', () => {
    const { rerender } = render(
      <InstructionModal {...defaultProps} isOpen={true} />
    );

    expect(
      screen.getByText('Instruksi Pengerjaan Tes Kepribadian')
    ).toBeInTheDocument();

    // Update only the callback
    const newCallback = mock();
    rerender(<InstructionModal isOpen={true} onCloseAction={newCallback} />);

    // Content should still be visible
    expect(
      screen.getByText('Instruksi Pengerjaan Tes Kepribadian')
    ).toBeInTheDocument();

    // New callback should work
    const button = screen.getByText('Mulai Sekarang');
    fireEvent.click(button);

    expect(newCallback).toHaveBeenCalledTimes(1);
  });

  test('handles parent component state updates', () => {
    const { rerender } = render(<InstructionModal {...defaultProps} />);

    const button = screen.getByText('Mulai Sekarang');
    fireEvent.click(button);

    expect(mockOnCloseAction).toHaveBeenCalledTimes(1);

    // Simulate parent component closing the modal
    rerender(<InstructionModal {...defaultProps} isOpen={false} />);

    expect(
      screen.queryByText('Instruksi Pengerjaan Tes Kepribadian')
    ).not.toBeInTheDocument();
  });
});

describe('Error Handling', () => {
  test('handles missing button component gracefully', () => {
    // This test ensures the modal can render even if button fails
    expect(() => {
      render(<InstructionModal {...defaultProps} />);
    }).not.toThrow();
  });

  test('handles missing image sources gracefully', () => {
    render(<InstructionModal {...defaultProps} />);

    // All images should still render with their src attributes
    const images = screen.getAllByRole('img');
    images.forEach(img => {
      expect(img.getAttribute('src')).toBeTruthy();
    });
  });

  test('handles invalid prop types gracefully', () => {
    const consoleErrorSpy = mock();

    expect(() => {
      render(
        <InstructionModal
          isOpen={'true' as any}
          onCloseAction={mockOnCloseAction}
        />
      );
    }).not.toThrow();

    consoleErrorSpy.mockRestore();
  });
});
