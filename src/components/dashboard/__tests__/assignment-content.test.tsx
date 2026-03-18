import { afterAll, afterEach, describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";

const useTeamFormationStatusMock = mock(() => ({
  status: null,
  errorMessage: null,
  isPolling: false,
  refetch: async () => undefined,
  reset: () => undefined,
}));

mock.module("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

mock.module("@/i18n/routing", () => ({
  routing: {
    locales: ["id", "en"],
    defaultLocale: "id",
    localePrefix: "as-needed",
  },
  Link: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  redirect: (href: string) => {
    throw new Error(`Redirecting to ${href}`);
  },
  getLocalizedHref: (locale: string, href: string) =>
    locale === "id" || !href.startsWith("/") ? href : `/${locale}${href}`,
  usePathname: () => "/dashboard",
  useRouter: () => ({ refresh: mock(() => undefined) }),
}));

mock.module("@/hooks/use-team-formation-status", () => ({
  useTeamFormationStatus: useTeamFormationStatusMock,
}));

mock.module("../assignment-actions", () => ({
  AssignmentActions: () => <div data-testid="assignment-actions" />,
}));

mock.module("../assignment-charts", () => ({
  AssignmentCharts: () => <div data-testid="assignment-charts" />,
}));

mock.module("../assignment-teams-client", () => ({
  AssignmentTeamsClient: () => <div data-testid="assignment-teams-client" />,
}));

mock.module("../charts-toggle", () => ({
  ChartsToggle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

mock.module("../team-formation-loading", () => ({
  TeamFormationLoading: () => <div data-testid="team-formation-loading" />,
}));

mock.module("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

describe("AssignmentContent", () => {
  afterEach(() => {
    useTeamFormationStatusMock.mockClear();
  });

  afterAll(() => {
    mock.restore();
  });

  it("does not poll persisted formation status for demo-only teacher assignments", async () => {
    const { AssignmentContent } = await import("../assignment-content");

    render(
      <AssignmentContent
        assignmentId="demo-sandbox-assignment"
        classId="demo-sandbox-course"
        courseId="demo-sandbox-course"
        assignmentTitleLabel="Capstone Recommendation Sprint"
        courseNameLabel="Machine Learning"
        courseClassLabel="K01"
        canManage={true}
        isStudent={false}
        stats={{
          totalStudents: 8,
          completedQuizCount: 8,
          completedQuizPercentage: 100,
          mbtiDistribution: [],
          averageSkills: [],
          topicPreferences: [],
          genderDistribution: [],
        }}
        hasTeams={true}
        allowPersistedTeamActions={false}
      />,
    );

    expect(useTeamFormationStatusMock).toHaveBeenCalledTimes(1);
    expect(useTeamFormationStatusMock.mock.calls[0]?.[0]).toMatchObject({
      assignmentId: "demo-sandbox-assignment",
      enabled: false,
      shouldPoll: false,
    });
    expect(screen.getByTestId("assignment-teams-client")).toBeTruthy();
  });

  it("keeps status polling enabled for persisted teacher assignments", async () => {
    const { AssignmentContent } = await import("../assignment-content");

    render(
      <AssignmentContent
        assignmentId="assignment-1"
        classId="course-1"
        courseId="course-1"
        assignmentTitleLabel="Persisted Assignment"
        courseNameLabel="Machine Learning"
        courseClassLabel="K01"
        canManage={true}
        isStudent={false}
        stats={{
          totalStudents: 8,
          completedQuizCount: 8,
          completedQuizPercentage: 100,
          mbtiDistribution: [],
          averageSkills: [],
          topicPreferences: [],
          genderDistribution: [],
        }}
        hasTeams={false}
        allowPersistedTeamActions={true}
        isTeamFormationProcessing={true}
      />,
    );

    expect(useTeamFormationStatusMock).toHaveBeenCalledTimes(1);
    expect(useTeamFormationStatusMock.mock.calls[0]?.[0]).toMatchObject({
      assignmentId: "assignment-1",
      enabled: true,
      shouldPoll: true,
    });
  });
});
