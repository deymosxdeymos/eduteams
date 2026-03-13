import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";

const protectDashboardMock = mock(async () => ({
  id: "db-user-1",
  email: "demo.student.visitor-alpha@eduteams.local",
  role: "STUDENT",
  mbtiType: "ENTP",
}));
const canAccessMahasiswaFeaturesMock = mock(() => true);
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
    protectDashboard: protectDashboardMock,
  }));

  mock.module("@/lib/authorization", () => ({
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
}

describe("AssignmentQuizPage demo assignments", () => {
  const originalDemoMode = process.env.DEMO_MODE;

  beforeEach(() => {
    process.env.DEMO_MODE = "1";
    protectDashboardMock.mockClear();
    canAccessMahasiswaFeaturesMock.mockClear();
    notFoundMock.mockClear();
    canAccessMahasiswaFeaturesMock.mockReturnValue(true);
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

  it("renders demo local assignments on the quiz answers route without Prisma-backed data", async () => {
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

  it("keeps the localized back link for English demo quiz answers", async () => {
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

    expect(screen.getByRole("link", { name: /kembali/i }).getAttribute("href")).toBe(
      "/en/dashboard/class/demo-sandbox-course/assignments/demo-local-1?demoTitle=Custom+Demo+Assignment&demoSkill=Data+Analysis&demoTopic=Recommendation",
    );
  });
});
