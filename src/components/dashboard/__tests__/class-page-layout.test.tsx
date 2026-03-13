import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";

const getSidebarDataForUserMock = mock(async (user: any) => ({
  user,
  notStartedCount: 0,
}));

mock.module("@/lib/dashboard/sidebar-data", () => ({
  getSidebarDataForUser: getSidebarDataForUserMock,
}));

mock.module("../nav", () => ({
  default: () => <div data-testid="nav" />,
}));

mock.module("../sidebar", () => ({
  default: () => <div data-testid="sidebar" />,
}));

mock.module("../class-assignments", () => ({
  ClassAssignments: () => <div data-testid="class-assignments" />,
}));

mock.module("../student-list", () => ({
  StudentList: ({ canManage, currentUserId }: any) => (
    <div
      data-testid="student-list"
      data-can-manage={String(canManage)}
      data-current-user-id={currentUserId}
    />
  ),
}));

describe("ClassPageLayout", () => {
  const originalDemoMode = process.env.DEMO_MODE;

  beforeEach(() => {
    process.env.DEMO_MODE = "1";
    getSidebarDataForUserMock.mockReset();
    getSidebarDataForUserMock.mockResolvedValue({
      user: {
        id: "teacher-db-id",
        email: "demo.teacher.visitor1234@eduteams.local",
      },
      notStartedCount: 0,
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

  it("treats authenticated demo teachers as managers for the synthetic sandbox course", async () => {
    const { ClassPageLayout } = await import("../class-page-layout");

    render(
      await ClassPageLayout({
        classId: "demo-sandbox-course",
        user: {
          id: "teacher-db-id",
          email: "demo.teacher.visitor1234@eduteams.local",
          role: "TEACHER",
        } as any,
        course: {
          id: "demo-sandbox-course",
          namaMataKuliah: "Machine Learning",
          kelas: "K01",
          dosenId: "demo-sandbox-teacher",
        } as any,
        studentsData: [],
      }),
    );

    expect(screen.getByTestId("student-list").getAttribute("data-can-manage")).toBe("true");
    expect(screen.getByTestId("student-list").getAttribute("data-current-user-id")).toBe(
      "demo-sandbox-teacher",
    );
  });
});
