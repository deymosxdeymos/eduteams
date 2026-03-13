import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";

const originalDemoMode = process.env.DEMO_MODE;

const useDemoSandboxClientStateMock = mock(() => ({
  createdAssignments: [],
  formedTeams: {},
}));

function buildHref(
  basePath: string,
  input: {
    classId: string;
    assignmentId: string;
    title: string;
    skills: readonly string[];
    topics: readonly string[];
  },
) {
  const searchParams = new URLSearchParams();
  searchParams.set("demoTitle", input.title);

  for (const skill of input.skills) {
    searchParams.append("demoSkill", skill);
  }

  for (const topic of input.topics) {
    searchParams.append("demoTopic", topic);
  }

  return `${basePath}?${searchParams.toString()}`;
}

mock.module("@/components/dashboard/student-manage-shell", () => ({
  StudentManageShell: ({ items }: any) => (
    <div data-testid="student-manage-shell">
      {items
        .map(
          (item: any) =>
            `${item.taskTitle}:${item.status}:${item.href ?? ""}:${item.quizHref ?? ""}`,
        )
        .join("|")}
    </div>
  ),
}));

mock.module("next-intl", () => ({
  useLocale: () => "en",
}));

mock.module("@/i18n/routing", () => ({
  getLocalizedHref: (locale: string, href: string) =>
    locale === "id" ? href : `/${locale}${href}`,
}));

mock.module("@/lib/demo/sandbox-client", () => ({
  useDemoSandboxClientState: useDemoSandboxClientStateMock,
}));

mock.module("@/lib/demo/sandbox", () => ({
  buildDemoAssignmentHref: (input: {
    classId: string;
    assignmentId: string;
    title: string;
    skills: readonly string[];
    topics: readonly string[];
  }) => buildHref(`/dashboard/class/${input.classId}/assignments/${input.assignmentId}`, input),
  buildDemoAssignmentQuizHref: (input: {
    classId: string;
    assignmentId: string;
    title: string;
    skills: readonly string[];
    topics: readonly string[];
  }) =>
    buildHref(`/dashboard/class/${input.classId}/assignments/${input.assignmentId}/quiz`, input),
  getDemoSandboxPrincipalId: () => "demo-sandbox-student",
  getDemoStudentManageItems: () => [],
}));

const { DemoStudentManageContent } = await import("../demo-student-manage-content");

describe("DemoStudentManageContent", () => {
  beforeEach(() => {
    process.env.DEMO_MODE = "1";
    useDemoSandboxClientStateMock.mockReset();
    useDemoSandboxClientStateMock.mockReturnValue({
      createdAssignments: [
        {
          id: "demo-local-1",
          courseId: "demo-course",
          title: "Local Demo Assignment",
          description: null,
          startAt: "2026-03-03T08:00:00.000Z",
          createdAt: "2026-03-03T08:00:00.000Z",
          skills: ["Data Analysis"],
          topics: ["Recommendation"],
          submissionsCount: 1,
        },
      ],
      formedTeams: {
        "demo-local-1": {
          assignmentId: "demo-local-1",
          topicNames: { "topic-1": "Recommendation" },
          taskIdByIndex: ["topic-1"],
          teams: [
            {
              id: "team-1",
              quality: 0.9,
              createdAt: "2026-03-03T08:00:00.000Z",
              taskId: "topic-1",
              members: [
                {
                  id: "member-1",
                  user: {
                    id: "demo-sandbox-student",
                    name: "Demo Student",
                    mbtiType: "INTJ",
                  },
                },
              ],
            },
          ],
        },
      },
    });
  });

  afterEach(() => {
    mock.restore();

    if (originalDemoMode === undefined) {
      delete process.env.DEMO_MODE;
      return;
    }

    process.env.DEMO_MODE = originalDemoMode;
  });

  it("keeps local demo assignments in the not-started bucket until teams are formed", () => {
    useDemoSandboxClientStateMock.mockReturnValue({
      createdAssignments: [
        {
          id: "demo-local-1",
          courseId: "demo-course",
          title: "Local Demo Assignment",
          description: null,
          startAt: "2026-03-03T08:00:00.000Z",
          createdAt: "2026-03-03T08:00:00.000Z",
          skills: ["Data Analysis"],
          topics: ["Recommendation"],
          submissionsCount: 1,
        },
      ],
      formedTeams: {},
    });

    render(
      <DemoStudentManageContent
        user={
          {
            id: "db-user-1",
            email: "demo.student.visitor-alpha@eduteams.local",
          } as any
        }
      />,
    );

    expect(screen.getByTestId("student-manage-shell").textContent).toContain(
      "Local Demo Assignment:not-started:/en/dashboard/class/demo-course/assignments/demo-local-1?demoTitle=Local+Demo+Assignment&demoSkill=Data+Analysis&demoTopic=Recommendation:/en/dashboard/class/demo-course/assignments/demo-local-1/quiz?demoTitle=Local+Demo+Assignment&demoSkill=Data+Analysis&demoTopic=Recommendation",
    );
  });

  it("marks local demo assignments as my-group for demo students authenticated with real user ids", () => {
    render(
      <DemoStudentManageContent
        user={
          {
            id: "db-user-1",
            email: "demo.student.visitor-alpha@eduteams.local",
          } as any
        }
      />,
    );

    expect(screen.getByTestId("student-manage-shell").textContent).toContain(
      "/en/dashboard/class/demo-course/assignments/demo-local-1?demoTitle=Local+Demo+Assignment&demoSkill=Data+Analysis&demoTopic=Recommendation",
    );
    expect(screen.getByTestId("student-manage-shell").textContent).toContain(
      "/en/dashboard/class/demo-course/assignments/demo-local-1/quiz?demoTitle=Local+Demo+Assignment&demoSkill=Data+Analysis&demoTopic=Recommendation",
    );
  });

  it("keeps DB-backed student assignments alongside demo sandbox items", () => {
    render(
      <DemoStudentManageContent
        user={
          {
            id: "db-user-1",
            email: "demo.student.visitor-alpha@eduteams.local",
          } as any
        }
        serverItems={[
          {
            id: "db-assignment-1",
            courseId: "db-course-1",
            taskTitle: "Persisted Assignment",
            className: "Persisted Course",
            academicYear: "2025/2026",
            status: "waiting",
          },
        ]}
      />,
    );

    expect(screen.getByTestId("student-manage-shell").textContent).toContain(
      "Persisted Assignment:waiting",
    );
    expect(screen.getByTestId("student-manage-shell").textContent).toContain(
      "Local Demo Assignment:my-group",
    );
    expect(screen.getByTestId("student-manage-shell").textContent).toContain(
      "Persisted Assignment:waiting:/en/dashboard/class/db-course-1/assignments/db-assignment-1:/en/dashboard/class/db-course-1/assignments/db-assignment-1/quiz",
    );
  });
});
