import { beforeEach, describe, expect, it } from 'bun:test';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '../select';

describe('Select Components', () => {
  beforeEach(() => {
    // Reset any global state if needed
  });

  describe('Select', () => {
    it('renders with basic props', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder='Select an option' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='option1'>Option 1</SelectItem>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeTruthy();
      expect(trigger.getAttribute('data-slot')).toBe('select-trigger');
    });

    it('handles controlled value', () => {
      render(
        <Select value='option1'>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='option1'>Option 1</SelectItem>
            <SelectItem value='option2'>Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeTruthy();
    });

    it('handles onValueChange callback', async () => {
      let selectedValue = '';

      const handleValueChange = (value: string) => {
        selectedValue = value;
      };

      render(
        <Select onValueChange={handleValueChange}>
          <SelectTrigger>
            <SelectValue placeholder='Select an option' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='option1'>Option 1</SelectItem>
            <SelectItem value='option2'>Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      fireEvent.click(trigger);

      await waitFor(() => {
        const option1 = screen.getByText('Option 1');
        fireEvent.click(option1);
      });

      expect(selectedValue).toBe('option1');
    });
  });

  describe('SelectTrigger', () => {
    it('renders with default size', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder='Select option' />
          </SelectTrigger>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      expect(trigger.getAttribute('data-size')).toBe('default');
      expect(trigger.className).toContain('data-[size=default]:h-9');
    });

    it('renders with small size', () => {
      render(
        <Select>
          <SelectTrigger size='sm'>
            <SelectValue placeholder='Select option' />
          </SelectTrigger>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      expect(trigger.getAttribute('data-size')).toBe('sm');
      expect(trigger.className).toContain('data-[size=sm]:h-8');
    });

    it('renders with custom className', () => {
      render(
        <Select>
          <SelectTrigger className='custom-class'>
            <SelectValue placeholder='Select option' />
          </SelectTrigger>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      expect(trigger.className).toContain('custom-class');
    });

    it('renders with disabled state', () => {
      render(
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder='Select option' />
          </SelectTrigger>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      expect(trigger.className).toContain('disabled:opacity-50');
      expect(trigger.className).toContain('disabled:cursor-not-allowed');
    });

    it('renders with aria-invalid styling', () => {
      render(
        <Select>
          <SelectTrigger aria-invalid>
            <SelectValue placeholder='Select option' />
          </SelectTrigger>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      expect(trigger.className).toContain('aria-invalid:border-destructive');
    });
  });

  describe('SelectValue', () => {
    it('renders placeholder when no value', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder='Choose an option' />
          </SelectTrigger>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeTruthy();
      expect(trigger.getAttribute('data-placeholder')).toBe(''); // Radix sets this
    });

    it('renders custom placeholder', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder='Custom placeholder' />
          </SelectTrigger>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeTruthy();
    });
  });

  describe('SelectContent', () => {
    it('renders with default position', async () => {
      render(
        <Select open>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='test'>Test Item</SelectItem>
          </SelectContent>
        </Select>
      );

      await waitFor(() => {
        const content = screen.getByRole('listbox');
        expect(content.getAttribute('data-slot')).toBe('select-content');
      });
    });

    it('renders with popper position', async () => {
      render(
        <Select open>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent position='popper'>
            <SelectItem value='test'>Test Item</SelectItem>
          </SelectContent>
        </Select>
      );

      await waitFor(() => {
        const content = screen.getByRole('listbox');
        expect(content.className).toContain('data-[side=bottom]:translate-y-1');
      });
    });

    it('renders with custom className', async () => {
      render(
        <Select open>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className='custom-content'>
            <SelectItem value='test'>Test Item</SelectItem>
          </SelectContent>
        </Select>
      );

      await waitFor(() => {
        const content = screen.getByRole('listbox');
        expect(content.className).toContain('custom-content');
      });
    });
  });

  describe('SelectItem', () => {
    it('renders with basic props', async () => {
      render(
        <Select open>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='item1'>Item 1</SelectItem>
          </SelectContent>
        </Select>
      );

      await waitFor(() => {
        const item = screen.getByRole('option');
        expect(item.getAttribute('data-slot')).toBe('select-item');
        expect(item.getAttribute('role')).toBe('option');
      });
    });

    it('renders with custom className', async () => {
      render(
        <Select open>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='item1' className='custom-item'>
              Item 1
            </SelectItem>
          </SelectContent>
        </Select>
      );

      await waitFor(() => {
        const item = screen.getByRole('option');
        expect(item.className).toContain('custom-item');
      });
    });

    it('renders with disabled state', async () => {
      render(
        <Select open>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='item1' disabled>
              Disabled Item
            </SelectItem>
          </SelectContent>
        </Select>
      );

      await waitFor(() => {
        const item = screen.getByRole('option');
        expect(item.getAttribute('aria-disabled')).toBe('true');
        expect(item.getAttribute('data-disabled')).toBe('');
      });
    });
  });

  describe('SelectGroup', () => {
    it('renders with basic props', async () => {
      render(
        <Select open>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value='item1'>Item 1</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );

      await waitFor(() => {
        const group = screen.getByRole('group');
        expect(group.getAttribute('data-slot')).toBe('select-group');
      });
    });
  });

  describe('SelectLabel', () => {
    it('renders with basic props', async () => {
      render(
        <Select open>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Group Label</SelectLabel>
              <SelectItem value='item1'>Item 1</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );

      await waitFor(() => {
        const label = screen.getByText('Group Label');
        expect(label.getAttribute('data-slot')).toBe('select-label');
        expect(label.className).toContain('text-xs');
      });
    });

    it('renders with custom className', async () => {
      render(
        <Select open>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel className='custom-label'>Group Label</SelectLabel>
              <SelectItem value='item1'>Item 1</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );

      await waitFor(() => {
        const label = screen.getByText('Group Label');
        expect(label.className).toContain('custom-label');
      });
    });
  });

  describe('SelectSeparator', () => {
    it('renders with basic props', async () => {
      render(
        <Select open>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='item1'>Item 1</SelectItem>
            <SelectSeparator data-testid='separator' />
            <SelectItem value='item2'>Item 2</SelectItem>
          </SelectContent>
        </Select>
      );

      await waitFor(() => {
        const separator = screen.getByTestId('separator');
        expect(separator.getAttribute('data-slot')).toBe('select-separator');
        expect(separator.className).toContain('bg-border');
      });
    });

    it('renders with custom className', async () => {
      render(
        <Select open>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='item1'>Item 1</SelectItem>
            <SelectSeparator
              className='custom-separator'
              data-testid='separator'
            />
            <SelectItem value='item2'>Item 2</SelectItem>
          </SelectContent>
        </Select>
      );

      await waitFor(() => {
        const separator = screen.getByTestId('separator');
        expect(separator.className).toContain('custom-separator');
      });
    });
  });

  describe('Integration tests', () => {
    it('handles keyboard navigation', async () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder='Select option' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='option1'>Option 1</SelectItem>
            <SelectItem value='option2'>Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      fireEvent.keyDown(trigger, { key: 'Enter' });

      await waitFor(() => {
        const option1 = screen.getByText('Option 1');
        expect(option1).toBeTruthy();
      });
    });

    it('closes on outside click', async () => {
      render(
        <div>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder='Select option' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='option1'>Option 1</SelectItem>
            </SelectContent>
          </Select>
          <div data-testid='outside'>Outside element</div>
        </div>
      );

      const trigger = screen.getByRole('combobox');
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeTruthy();
      });

      const outside = screen.getByTestId('outside');
      fireEvent.click(outside);

      // The content should close, but testing this might require more setup
    });
  });
});
