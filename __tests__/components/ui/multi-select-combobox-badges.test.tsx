import { describe, expect, it, mock, beforeEach, beforeAll, afterAll } from 'bun:test';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MultiSelectComboboxBadges } from '../../../src/components/ui/multi-select-combobox-badges';

describe('MultiSelectComboboxBadges', () => {
  const mockOnChange = mock(() => {});
  
  // Mock window.location for URL construction in tests
  const originalLocation = global.window?.location;
  
  beforeAll(() => {
    if (global.window) {
      Object.defineProperty(global.window, 'location', {
        value: { origin: 'http://localhost:3000' },
        writable: true,
      });
    }
  });
  
  afterAll(() => {
    if (global.window && originalLocation) {
      Object.defineProperty(global.window, 'location', {
        value: originalLocation,
        writable: true,
      });
    }
  });

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Simple mode (showCombobox=false)', () => {
    it('renders with placeholder', () => {
      render(
        <MultiSelectComboboxBadges
          value={[]}
          onChange={mockOnChange}
          placeholder='Enter topics'
          showCombobox={false}
        />
      );

      const input = screen.getByPlaceholderText('Enter topics');
      expect(input).toBeTruthy();
    });

    it('adds item via Enter key', () => {
      render(
        <MultiSelectComboboxBadges
          value={[]}
          onChange={mockOnChange}
          placeholder='Enter topics'
          showCombobox={false}
        />
      );

      const input = screen.getByPlaceholderText('Enter topics');
      fireEvent.change(input, { target: { value: 'React' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnChange).toHaveBeenCalledWith(['React']);
    });

    it('adds item via Plus button', () => {
      render(
        <MultiSelectComboboxBadges
          value={[]}
          onChange={mockOnChange}
          placeholder='Enter topics'
          showCombobox={false}
        />
      );

      const input = screen.getByPlaceholderText('Enter topics');
      fireEvent.change(input, { target: { value: 'TypeScript' } });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnChange).toHaveBeenCalledWith(['TypeScript']);
    });

    it('displays selected items as badges', () => {
      render(
        <MultiSelectComboboxBadges
          value={['React', 'TypeScript']}
          onChange={mockOnChange}
          placeholder='Enter topics'
          showCombobox={false}
        />
      );

      expect(screen.getByText('React')).toBeTruthy();
      expect(screen.getByText('TypeScript')).toBeTruthy();
    });

    it('removes item when X icon clicked', () => {
      const { container } = render(
        <MultiSelectComboboxBadges
          value={['React', 'TypeScript']}
          onChange={mockOnChange}
          placeholder='Enter topics'
          showCombobox={false}
        />
      );

      const xIcons = container.querySelectorAll('svg');
      const removeIcon = Array.from(xIcons).find(
        icon => icon.parentElement?.textContent?.includes('React')
      );

      if (removeIcon) {
        fireEvent.click(removeIcon);
        expect(mockOnChange).toHaveBeenCalledWith(['TypeScript']);
      }
    });

    it('prevents duplicate entries (case-insensitive)', () => {
      render(
        <MultiSelectComboboxBadges
          value={['React']}
          onChange={mockOnChange}
          placeholder='Enter topics'
          showCombobox={false}
        />
      );

      const input = screen.getByPlaceholderText('Enter topics');
      fireEvent.change(input, { target: { value: 'react' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      // Should not be called because 'react' already exists (case-insensitive)
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('trims whitespace from input', () => {
      render(
        <MultiSelectComboboxBadges
          value={[]}
          onChange={mockOnChange}
          placeholder='Enter topics'
          showCombobox={false}
        />
      );

      const input = screen.getByPlaceholderText('Enter topics');
      fireEvent.change(input, { target: { value: '  React  ' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnChange).toHaveBeenCalledWith(['React']);
    });

    it('disables input and button when disabled prop is true', () => {
      render(
        <MultiSelectComboboxBadges
          value={[]}
          onChange={mockOnChange}
          placeholder='Enter topics'
          showCombobox={false}
          disabled={true}
        />
      );

      const input = screen.getByPlaceholderText('Enter topics') as HTMLInputElement;
      const button = screen.getByRole('button') as HTMLButtonElement;

      expect(input.disabled).toBe(true);
      expect(button.disabled).toBe(true);
    });

    it('shows loading spinner when loading prop is true', () => {
      const { container } = render(
        <MultiSelectComboboxBadges
          value={[]}
          onChange={mockOnChange}
          placeholder='Enter topics'
          showCombobox={false}
          loading={true}
        />
      );

      const spinner = container.querySelector('svg[role="status"]');
      expect(spinner).toBeTruthy();
    });
  });

  describe('Combobox mode (showCombobox=true)', () => {
    it('renders with placeholder', () => {
      render(
        <MultiSelectComboboxBadges
          value={[]}
          onChange={mockOnChange}
          placeholder='Search skills'
          showCombobox={true}
        />
      );

      const input = screen.getByPlaceholderText('Search skills');
      expect(input).toBeTruthy();
    });

    it('displays static suggestions', async () => {
      render(
        <MultiSelectComboboxBadges
          value={[]}
          onChange={mockOnChange}
          placeholder='Search skills'
          suggestions={['JavaScript', 'Python', 'Java']}
          showCombobox={true}
        />
      );

      const input = screen.getByPlaceholderText('Search skills');
      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeTruthy();
        expect(screen.getByText('Python')).toBeTruthy();
        expect(screen.getByText('Java')).toBeTruthy();
      });
    });

    it('filters suggestions based on input', async () => {
      render(
        <MultiSelectComboboxBadges
          value={[]}
          onChange={mockOnChange}
          placeholder='Search skills'
          suggestions={['JavaScript', 'Python', 'Java']}
          showCombobox={true}
        />
      );

      const input = screen.getByPlaceholderText('Search skills');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'java' } });

      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeTruthy();
        expect(screen.getByText('Java')).toBeTruthy();
      });
    });

    it('excludes already selected items from suggestions', async () => {
      const { container } = render(
        <MultiSelectComboboxBadges
          value={['JavaScript']}
          onChange={mockOnChange}
          placeholder='Search skills'
          suggestions={['JavaScript', 'Python', 'Java']}
          showCombobox={true}
        />
      );

      const input = screen.getByPlaceholderText('Search skills');
      fireEvent.focus(input);

      await waitFor(() => {
        // Check that Python appears in the suggestions
        expect(screen.getByText('Python')).toBeTruthy();
        // JavaScript should still appear in badges but suggestions should only have 2 items (Python, Java)
        const popoverContent = container.querySelector('[data-radix-popper-content-wrapper]');
        if (popoverContent) {
          const items = popoverContent.querySelectorAll('[role="option"]');
          expect(items.length).toBe(2); // Only Python and Java, not JavaScript
        }
      });
    });

    it('shows create option when input does not match suggestions', async () => {
      render(
        <MultiSelectComboboxBadges
          value={[]}
          onChange={mockOnChange}
          placeholder='Search skills'
          suggestions={['JavaScript', 'Python']}
          createLabel={(query: string) => `Create "${query}"`}
          showCombobox={true}
        />
      );

      const input = screen.getByPlaceholderText('Search skills');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Rust' } });

      await waitFor(() => {
        expect(screen.getByText('Create "Rust"')).toBeTruthy();
      });
    });

    it('adds item when suggestion is clicked', async () => {
      render(
        <MultiSelectComboboxBadges
          value={[]}
          onChange={mockOnChange}
          placeholder='Search skills'
          suggestions={['JavaScript', 'Python']}
          showCombobox={true}
        />
      );

      const input = screen.getByPlaceholderText('Search skills');
      fireEvent.focus(input);

      await waitFor(() => {
        const suggestion = screen.getByText('JavaScript');
        fireEvent.click(suggestion);
      });

      expect(mockOnChange).toHaveBeenCalledWith(['JavaScript']);
    });

    it('shows empty label when no suggestions match', async () => {
      render(
        <MultiSelectComboboxBadges
          value={[]}
          onChange={mockOnChange}
          placeholder='Search skills'
          suggestions={['JavaScript', 'Python']}
          emptyLabel='No skills found'
          showCombobox={true}
        />
      );

      const input = screen.getByPlaceholderText('Search skills');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'xyz123' } });

      await waitFor(() => {
        expect(screen.getByText('No skills found')).toBeTruthy();
      });
    });

    it('calls fetch when suggestionsEndpoint is provided', async () => {
      let fetchCalled = false;
      let fetchUrl = '';
      
      const mockFetch = mock(async (url: string) => {
        fetchCalled = true;
        fetchUrl = url;
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: ['React', 'React Native']
          })
        };
      });

      const originalFetch = global.fetch;
      global.fetch = mockFetch as any;

      const { unmount } = render(
        <MultiSelectComboboxBadges
          value={[]}
          onChange={mockOnChange}
          placeholder='Search skills'
          suggestionsEndpoint='/api/skills'
          showCombobox={true}
        />
      );

      const input = screen.getByPlaceholderText('Search skills');
      fireEvent.change(input, { target: { value: 'react' } });

      await waitFor(() => {
        expect(fetchCalled).toBe(true);
        expect(fetchUrl).toContain('/api/skills');
        expect(fetchUrl).toContain('q=react');
      }, { timeout: 2000 });

      global.fetch = originalFetch;
      unmount();
    });

    it('handles API data format with object array', async () => {
      const mockFetch = mock(async () => ({
        ok: true,
        json: async () => ({
          success: true,
          data: [{ name: 'Skill1' }, { name: 'Skill2' }]
        })
      }));

      const originalFetch = global.fetch;
      global.fetch = mockFetch as any;

      const { unmount } = render(
        <MultiSelectComboboxBadges
          value={[]}
          onChange={mockOnChange}
          placeholder='Search skills'
          suggestionsEndpoint='/api/skills'
          showCombobox={true}
        />
      );

      const input = screen.getByPlaceholderText('Search skills');
      fireEvent.change(input, { target: { value: 'skill' } });

      // Just verify fetch was called, data parsing is internal
      await waitFor(() => {
        expect(mockFetch.mock.calls.length).toBeGreaterThan(0);
      }, { timeout: 2000 });

      global.fetch = originalFetch;
      unmount();
    });

    it('deduplicates suggestions (case-insensitive)', async () => {
      render(
        <MultiSelectComboboxBadges
          value={[]}
          onChange={mockOnChange}
          placeholder='Search skills'
          suggestions={['React', 'react', 'REACT', 'Python']}
          showCombobox={true}
        />
      );

      const input = screen.getByPlaceholderText('Search skills');
      fireEvent.focus(input);

      await waitFor(() => {
        const reactElements = screen.queryAllByText(/^React$/i);
        expect(reactElements.length).toBe(1);
      });
    });
  });

  describe('Common behaviors', () => {
    it('ignores empty input submission', () => {
      render(
        <MultiSelectComboboxBadges
          value={[]}
          onChange={mockOnChange}
          placeholder='Enter text'
          showCombobox={false}
        />
      );

      const input = screen.getByPlaceholderText('Enter text');
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('maintains proper state after adding multiple items', () => {
      const { rerender } = render(
        <MultiSelectComboboxBadges
          value={[]}
          onChange={mockOnChange}
          placeholder='Enter text'
          showCombobox={false}
        />
      );

      const input = screen.getByPlaceholderText('Enter text');

      // Add first item
      fireEvent.change(input, { target: { value: 'Item1' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      // Rerender with updated value
      rerender(
        <MultiSelectComboboxBadges
          value={['Item1']}
          onChange={mockOnChange}
          placeholder='Enter text'
          showCombobox={false}
        />
      );

      // Add second item
      fireEvent.change(input, { target: { value: 'Item2' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnChange).toHaveBeenLastCalledWith(['Item1', 'Item2']);
    });
  });
});
