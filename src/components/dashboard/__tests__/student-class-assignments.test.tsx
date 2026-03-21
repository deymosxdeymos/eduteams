import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import type { AssignmentClient } from "@/lib/validation/assignments";

const pushMock = mock(() => undefined);

mock.module("next-intl", () => ({
  useTranslations:
    () =>
    (
      key: string,
      values?: { defaultValue?: string; query?: string; filled?: number; total?: number },
    ) =>
      values?.defaultValue ?? values?.query ?? `${key}`,
}));

mock.module("swr", () => ({
  default: () => ({ data: undefined, mutate: mock(async () => undefined) }),
}));

mock.module("@/i18n/routing", () => ({
  Link: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({
    push: pushMock,
    refresh: mock(() => undefined),
    replace: mock(() => undefined),
  }),
}));

mock.module("@/lib/hooks/use-fuzzy-search", () => ({
  useFuzzySearch: <T,>({ data }: { data: T[] }) => data,
}));

mock.module("@/components/dashboard/search-input", () => ({
  SearchInput: ({ searchValue, onSearchChange, placeholder }: any) => (
    <input
      aria-label={placeholder}
      value={searchValue}
      onChange={(event) => onSearchChange(event.target.value)}
    />
  ),
}));

afterAll(() => {
  mock.restore();
});

describe("StudentClassAssignments", () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  it("routes unsubmitted students without teams to the quiz page", async () => {
    const { StudentClassAssignments } = await import("../student-class-assignments");

    const assignments: AssignmentClient[] = [
      {
        id: "assignment-1",
        courseId: "course-1",
        title: "Assignment 1",
        description: null,
        startAt: new Date("2026-03-01T10:00:00.000Z"),
        createdAt: new Date("2026-03-01T10:00:00.000Z"),
        status: "BELUM_ISI",
        skills: [],
        topics: [],
        submissionsCount: 0,
        submittedByMe: false,
      },
    ];

    render(
      <StudentClassAssignments
        classId="course-1"
        initialAssignments={assignments}
        studentCount={10}
      />,
    );

    const assignmentCard = screen.getByText("Assignment 1").closest('div[role="button"]');
    expect(assignmentCard).not.toBeNull();

    fireEvent.click(assignmentCard!);

    expect(pushMock).toHaveBeenCalledWith(
      "/dashboard/class/course-1/assignments/assignment-1/quiz",
    );
  });

  it("keeps submitted assignments on the detail page", async () => {
    const { StudentClassAssignments } = await import("../student-class-assignments");

    const assignments: AssignmentClient[] = [
      {
        id: "assignment-2",
        courseId: "course-1",
        title: "Assignment 2",
        description: null,
        startAt: new Date("2026-03-01T10:00:00.000Z"),
        createdAt: new Date("2026-03-01T10:00:00.000Z"),
        status: "MENUNGGU",
        skills: [],
        topics: [],
        submissionsCount: 3,
        submittedByMe: true,
      },
    ];

    render(
      <StudentClassAssignments
        classId="course-1"
        initialAssignments={assignments}
        studentCount={10}
      />,
    );

    const assignmentCard = screen.getByText("Assignment 2").closest('div[role="button"]');
    expect(assignmentCard).not.toBeNull();

    fireEvent.click(assignmentCard!);

    expect(pushMock).toHaveBeenCalledWith("/dashboard/class/course-1/assignments/assignment-2");
  });
});
