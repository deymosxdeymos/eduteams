import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";

const actualServerAuth = await import("@/lib/server-auth");
const actualAuthorization = await import("@/lib/authorization");

const protectDashboardMock = mock(async () => ({
  id: "db-user-1",
  email: "demo.student.visitor-alpha@eduteams.local",
  role: "STUDENT",
  mbtiType: "ENTP",
}));
const canAccessMahasiswaFeaturesMock = mock(() => true);
const getRemovedDemoStudentIdsFromCookieStoreMock = mock(async () => []);
const getDemoSubmittedAssignmentIdsFromCookieStoreMock = mock(async () => []);
const notFoundMock = mock(() => {
  throw new Error("NEXT_NOT_FOUND");
});

function applyModuleMocks() {
  mock.module("next/navigation", () => ({
    notFound: notFoundMock,
  }));

  mock.module("next/link", () => ({
    default: ({ children, href }: any) => <a href={href}>{children}</a>,
  }));

  mock.module("@/lib/server-auth", () => ({
    ...actualServerAuth,
    protectDashboard: protectDashboardMock,
  }));

  mock.module("@/lib/authorization", () => ({
    ...actualAuthorization,
    canAccessMahasiswaFeatures: canAccessMahasiswaFeaturesMock,
  }));

  mock.module("@/components/dashboard/dashboard-client", () => ({
    DashboardClient: ({ children }: any) => <div>{children}</div>,
  }));

  mock.module("@/components/dashboard/assignment-layout", () => ({
    AssignmentLayout: ({ children, assignmentTitle }: any) => (
      <div data-testid="assignment-layout" data-assignment-title={assignmentTitle}>
        {children}
      </div>
    ),
  }));

  mock.module("@/components/dashboard/profile-header", () => ({
    ProfileHeader: ({ user }: any) => <div data-testid="profile-header" data-user-id={user.id} />,
  }));

  mock.module("@/components/dashboard/assignment-quiz-client", () => ({
    AssignmentQuizClient: () => <div data-testid="assignment-quiz-client" />,
  }));

  mock.module("@/components/ui/tabs", () => ({
    Tabs: ({ children }: any) => <div>{children}</div>,
    TabsList: ({ children }: any) => <div>{children}</div>,
    TabsTrigger: ({ children }: any) => <button type="button">{children}</button>,
    TabsContent: ({ children }: any) => <div>{children}</div>,
  }));

  mock.module("@/lib/mbti-questions-simple", () => ({
    getMBTIQuestions: async () => [],
  }));

  mock.module("@/i18n/routing", () => ({
    getLocalizedHref: (locale: string, href: string) =>
      locale === "id" ? href : `/${locale}${href}`,
  }));

  mock.module("next-intl/server", () => ({
    getTranslations: async (namespace?: string) => {
      const en = await import("@/../messages/en.json");
      const messages: Record<string, unknown> = en.default;
      const getNestedValue = (obj: unknown, path: string): string => {
        const keys = path.split(".");
        let value = obj;
        for (const key of keys) {
          if (value && typeof value === "object" && key in (value as Record<string, unknown>)) {
            value = (value as Record<string, unknown>)[key];
          } else {
            return path;
          }
        }
        return typeof value === "string" ? value : path;
      };
      const base = namespace
        ? ((namespace
            .split(".")
            .reduce(
              (obj: unknown, key: string) =>
                obj && typeof obj === "object" ? (obj as Record<string, unknown>)[key] : undefined,
              messages,
            ) as Record<string, unknown> | undefined) ?? messages)
        : messages;
      return (key: string) => getNestedValue(base, key);
    },
  }));

  mock.module("@/lib/demo/sandbox-roster", () => ({
    getRemovedDemoStudentIdsFromCookieStore: getRemovedDemoStudentIdsFromCookieStoreMock,
  }));

  mock.module("@/lib/demo/sandbox-submissions", () => ({
    getDemoSubmittedAssignmentIdsFromCookieStore: getDemoSubmittedAssignmentIdsFromCookieStoreMock,
    getDemoSubmittedAssignmentIdsFromRequest: () => [],
  }));
}

describe("AssignmentQuizPage demo assignments", () => {
  const originalDemoMode = process.env.DEMO_MODE;

  beforeEach(() => {
    process.env.DEMO_MODE = "1";
    protectDashboardMock.mockClear();
    canAccessMahasiswaFeaturesMock.mockClear();
    getRemovedDemoStudentIdsFromCookieStoreMock.mockReset();
    getDemoSubmittedAssignmentIdsFromCookieStoreMock.mockReset();
    notFoundMock.mockClear();
    canAccessMahasiswaFeaturesMock.mockReturnValue(true);
    getRemovedDemoStudentIdsFromCookieStoreMock.mockResolvedValue([]);
    getDemoSubmittedAssignmentIdsFromCookieStoreMock.mockResolvedValue([]);
    applyModuleMocks();
  });

  afterEach(() => {
    mock.restore();

    if (originalDemoMode === undefined) {
      delete process.env.DEMO_MODE;
      return;
    }

    process.env.DEMO_MODE = originalDemoMode;
  });

  it("shows the quiz form for the seeded demo assignment before any submission is recorded", async () => {
    const { default: AssignmentQuizPage } = await import("../page");

    render(
      await AssignmentQuizPage({
        params: Promise.resolve({
          locale: "id",
          id: "demo-sandbox-course",
          assignmentId: "demo-sandbox-assignment",
        }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByTestId("assignment-quiz-client")).toBeTruthy();
    expect(screen.queryByTestId("profile-header")).toBeNull();
  });

  it("renders demo local assignments on the quiz answers route without Prisma-backed data", async () => {
    getDemoSubmittedAssignmentIdsFromCookieStoreMock.mockResolvedValue(["demo-local-1"]);
    const { default: AssignmentQuizPage } = await import("../page");

    render(
      await AssignmentQuizPage({
        params: Promise.resolve({
          locale: "id",
          id: "demo-sandbox-course",
          assignmentId: "demo-local-1",
        }),
        searchParams: Promise.resolve({
          demoTitle: "Custom Demo Assignment",
          demoSkill: ["Data Analysis"],
          demoTopic: ["Recommendation"],
        }),
      }),
    );

    expect(screen.getByTestId("assignment-layout").getAttribute("data-assignment-title")).toBe(
      "Custom Demo Assignment",
    );
    expect(screen.getByTestId("profile-header").getAttribute("data-user-id")).toBe(
      "demo-sandbox-student",
    );
  });

  it("blocks removed demo students from the submitted quiz view", async () => {
    getRemovedDemoStudentIdsFromCookieStoreMock.mockResolvedValue(["demo-sandbox-student"]);
    getDemoSubmittedAssignmentIdsFromCookieStoreMock.mockResolvedValue(["demo-local-1"]);
    const { default: AssignmentQuizPage } = await import("../page");

    await expect(
      AssignmentQuizPage({
        params: Promise.resolve({
          locale: "id",
          id: "demo-sandbox-course",
          assignmentId: "demo-local-1",
        }),
        searchParams: Promise.resolve({
          demoTitle: "Custom Demo Assignment",
          demoSkill: ["Data Analysis"],
          demoTopic: ["Recommendation"],
        }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("keeps the localized back link for English demo quiz answers", async () => {
    getDemoSubmittedAssignmentIdsFromCookieStoreMock.mockResolvedValue(["demo-local-1"]);
    const { default: AssignmentQuizPage } = await import("../page");

    render(
      await AssignmentQuizPage({
        params: Promise.resolve({
          locale: "en",
          id: "demo-sandbox-course",
          assignmentId: "demo-local-1",
        }),
        searchParams: Promise.resolve({
          demoTitle: "Custom Demo Assignment",
          demoSkill: ["Data Analysis"],
          demoTopic: ["Recommendation"],
        }),
      }),
    );

    expect(screen.getByRole("link", { name: /back/i }).getAttribute("href")).toBe(
      "/en/dashboard/class/demo-sandbox-course/assignments/demo-local-1?demoTitle=Custom+Demo+Assignment&demoSkill=Data+Analysis&demoTopic=Recommendation",
    );
  });
});
