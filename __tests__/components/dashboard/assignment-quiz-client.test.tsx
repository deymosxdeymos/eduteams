import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssignmentQuizClient } from '@/components/dashboard/assignment-quiz-client';

const dismissInstructions = async (user: ReturnType<typeof userEvent.setup>) => {
  const buttons = screen.queryAllByRole('button', {
    name: 'dashboard.assignments.quiz.instructions.startNow',
  });
  for (const button of buttons) {
    await user.click(button);
  }
};

describe('AssignmentQuizClient', () => {
  beforeEach(() => {
    const fetchMock = mock(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({}),
      })
    );
    globalThis.fetch = fetchMock as any;
    if (typeof window !== 'undefined') {
      window.scrollTo = () => {};
    }
    if (typeof globalThis.scrollTo === 'undefined') {
      globalThis.scrollTo = () => {};
    }
  });

  it('submits immediately once skills are filled when no topics are provided', async () => {
    const user = userEvent.setup();
    const fetchMock = mock(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({}),
      })
    );
    globalThis.fetch = fetchMock as any;

    render(
      <AssignmentQuizClient
        classId='class-1'
        assignmentId='assignment-1'
        assignment={{
          id: 'assignment-1',
          title: 'Sample',
          skills: ['Design Thinking'],
          topics: [],
          hasTopics: false,
          skillPrefills: [
            {
              name: 'Design Thinking',
              level: null,
              profileId: null,
              profileUpdatedAt: null,
              sourceAssignmentId: null,
            },
          ],
          topicPrefills: [],
        }}
      />
    );

    await dismissInstructions(user);

    const skillOption = screen.getByAltText(
      'dashboard.assignments.quiz.skillLevels.novice'
    );
    await user.click(skillOption);

    const submitButton = screen.getByRole('button', {
      name: 'dashboard.assignments.quiz.finish',
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBe(1);
    });
    const [, requestInit] = fetchMock.mock.calls[0];
    expect(requestInit?.method).toBe('POST');
    const payload = JSON.parse(String(requestInit?.body));
    expect(payload.skills).toEqual([
      { name: 'Design Thinking', level: 0 },
    ]);
    expect(payload.topics).toEqual([]);

    expect(
      screen.queryByText('dashboard.assignments.quiz.topicQuestion')
    ).not.toBeInTheDocument();
  });

  it('clears validation errors after retrying and moving to topics step', async () => {
    const user = userEvent.setup();

    render(
      <AssignmentQuizClient
        classId='class-2'
        assignmentId='assignment-2'
        assignment={{
          id: 'assignment-2',
          title: 'Another Sample',
          skills: ['User Research'],
          topics: ['Wellbeing'],
          hasTopics: true,
          skillPrefills: [
            {
              name: 'User Research',
              level: null,
              profileId: null,
              profileUpdatedAt: null,
              sourceAssignmentId: null,
            },
          ],
          topicPrefills: [
            {
              name: 'Wellbeing',
              preference: null,
              profileId: null,
              profileUpdatedAt: null,
              sourceAssignmentId: null,
            },
          ],
        }}
      />
    );

    await dismissInstructions(user);

    const nextButton = screen.getByRole('button', {
      name: 'dashboard.assignments.quiz.nextToTopics',
    });
    await user.click(nextButton);

    expect(
      screen.getByText('dashboard.assignments.quiz.required')
    ).toBeInTheDocument();

    const skillOption = screen.getByAltText(
      'dashboard.assignments.quiz.skillLevels.novice'
    );
    await user.click(skillOption);

    await user.click(nextButton);

    await waitFor(() => {
      expect(
        screen.getByText('dashboard.assignments.quiz.topicsTitle')
      ).toBeInTheDocument();
    });

    await dismissInstructions(user);

    expect(
      screen.queryByText('dashboard.assignments.quiz.required')
    ).not.toBeInTheDocument();
  });
});
