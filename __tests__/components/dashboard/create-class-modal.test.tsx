import { describe, expect, it, beforeEach, mock } from 'bun:test';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateClassModal from '@/components/dashboard/create-class-modal';
import type { Course } from '@/lib/types';

describe('CreateClassModal', () => {
  beforeEach(() => {
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              id: '1',
              namaMataKuliah: 'Test Course',
              kelas: 'RA',
              periode: 'ganjil',
            },
          }),
      })
    ) as any;
  });

  describe('Initial rendering', () => {
    it('should render trigger button', () => {
      render(<CreateClassModal />);
      const button = screen.getByRole('button', {
        name: /dashboard\.modals\.createClass\.button/i,
      });
      expect(button).toBeInTheDocument();
    });

    it('should not show dialog content initially', () => {
      render(<CreateClassModal />);
      const title = screen.queryByText(
        'dashboard.modals.createClass.title'
      );
      expect(title).not.toBeInTheDocument();
    });
  });

  describe('Dialog interaction', () => {
    it('should open dialog when trigger button is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateClassModal />);

      const triggerButton = screen.getByRole('button', {
        name: /dashboard\.modals\.createClass\.button/i,
      });
      await user.click(triggerButton);

      const title = screen.getByText('dashboard.modals.createClass.title');
      expect(title).toBeInTheDocument();
    });

    it('should show all form fields when opened', async () => {
      const user = userEvent.setup();
      render(<CreateClassModal />);

      const triggerButton = screen.getByRole('button', {
        name: /dashboard\.modals\.createClass\.button/i,
      });
      await user.click(triggerButton);

      expect(
        screen.getByText('dashboard.modals.createClass.fields.courseName')
      ).toBeInTheDocument();
      expect(
        screen.getByText('dashboard.modals.createClass.fields.class')
      ).toBeInTheDocument();
      expect(
        screen.getByText('dashboard.modals.createClass.fields.period')
      ).toBeInTheDocument();
    });

    it('should show description when opened', async () => {
      const user = userEvent.setup();
      render(<CreateClassModal />);

      const triggerButton = screen.getByRole('button', {
        name: /dashboard\.modals\.createClass\.button/i,
      });
      await user.click(triggerButton);

      const description = screen.getByText(
        'dashboard.modals.createClass.description'
      );
      expect(description).toBeInTheDocument();
    });
  });

  describe('Form validation', () => {
    it('should show course name input', async () => {
      const user = userEvent.setup();
      render(<CreateClassModal />);

      const triggerButton = screen.getByRole('button', {
        name: /dashboard\.modals\.createClass\.button/i,
      });
      await user.click(triggerButton);

      const input = screen.getByPlaceholderText(
        'dashboard.modals.createClass.fields.courseNamePlaceholder'
      );
      expect(input).toBeInTheDocument();
    });

    it('should allow typing in course name input', async () => {
      const user = userEvent.setup();
      render(<CreateClassModal />);

      const triggerButton = screen.getByRole('button', {
        name: /dashboard\.modals\.createClass\.button/i,
      });
      await user.click(triggerButton);

      const input = screen.getByPlaceholderText(
        'dashboard.modals.createClass.fields.courseNamePlaceholder'
      );
      await user.type(input, 'Test Course Name');
      expect(input).toHaveValue('Test Course Name');
    });

    it('should show class select placeholder', async () => {
      const user = userEvent.setup();
      render(<CreateClassModal />);

      const triggerButton = screen.getByRole('button', {
        name: /dashboard\.modals\.createClass\.button/i,
      });
      await user.click(triggerButton);

      const placeholder = screen.getByText(
        'dashboard.modals.createClass.fields.classPlaceholder'
      );
      expect(placeholder).toBeInTheDocument();
    });

    it('should show period select placeholder', async () => {
      const user = userEvent.setup();
      render(<CreateClassModal />);

      const triggerButton = screen.getByRole('button', {
        name: /dashboard\.modals\.createClass\.button/i,
      });
      await user.click(triggerButton);

      const placeholder = screen.getByText(
        'dashboard.modals.createClass.fields.periodPlaceholder'
      );
      expect(placeholder).toBeInTheDocument();
    });

    it('should show period auto-detected message', async () => {
      const user = userEvent.setup();
      render(<CreateClassModal />);

      const triggerButton = screen.getByRole('button', {
        name: /dashboard\.modals\.createClass\.button/i,
      });
      await user.click(triggerButton);

      const message = screen.getByText(
        'dashboard.modals.createClass.periodAutoDetected'
      );
      expect(message).toBeInTheDocument();
    });
  });

  describe('Form submission', () => {
    it('should show submit button', async () => {
      const user = userEvent.setup();
      render(<CreateClassModal />);

      const triggerButton = screen.getByRole('button', {
        name: /dashboard\.modals\.createClass\.button/i,
      });
      await user.click(triggerButton);

      const submitButton = screen.getByRole('button', {
        name: /dashboard\.modals\.createClass\.create/i,
      });
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should not display error initially', async () => {
      const user = userEvent.setup();
      render(<CreateClassModal />);

      const triggerButton = screen.getByRole('button', {
        name: /dashboard\.modals\.createClass\.button/i,
      });
      await user.click(triggerButton);

      const errorMessage = screen.queryByText(/Failed to create/);
      expect(errorMessage).not.toBeInTheDocument();
    });
  });

  describe('Form reset behavior', () => {
    it('should reset form when dialog is closed', async () => {
      const user = userEvent.setup();
      render(<CreateClassModal />);

      const triggerButton = screen.getByRole('button', {
        name: /dashboard\.modals\.createClass\.button/i,
      });
      await user.click(triggerButton);

      const input = screen.getByPlaceholderText(
        'dashboard.modals.createClass.fields.courseNamePlaceholder'
      );
      await user.type(input, 'Test Course');
      expect(input).toHaveValue('Test Course');

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(
          screen.queryByText('dashboard.modals.createClass.title')
        ).not.toBeInTheDocument();
      });

      await user.click(triggerButton);

      const resetInput = screen.getByPlaceholderText(
        'dashboard.modals.createClass.fields.courseNamePlaceholder'
      );
      expect(resetInput).toHaveValue('');
    });
  });
});
