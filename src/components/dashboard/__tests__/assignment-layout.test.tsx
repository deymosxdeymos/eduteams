import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import { DEMO_COURSE_ID } from "@/lib/demo/sandbox";

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

mock.module("../student-list", () => ({
  StudentList: ({ currentUserId }: any) => (
    <div data-testid="student-list" data-current-user-id={currentUserId} />
  ),
}));

describe("AssignmentLayout", () => {
  const originalDemoMode = process.env.DEMO_MODE;

  beforeEach(() => {
    process.env.DEMO_MODE = "1";
    getSidebarDataForUserMock.mockReset();
    getSidebarDataForUserMock.mockResolvedValue({
      user: {
        id: "student-db-id",
        email: "demo.student.visitor1234@eduteams.local",
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

  it("maps demo sandbox students to their synthetic roster row on the sandbox course", async () => {
    const { AssignmentLayout } = await import("../assignment-layout");

    render(
      await AssignmentLayout({
        user: {
          id: "student-db-id",
          name: "Demo Student",
          email: "demo.student.visitor1234@eduteams.local",
          role: "STUDENT",
        } as any,
        course: {
          id: DEMO_COURSE_ID,
          namaMataKuliah: "Machine Learning",
          kelas: "K01",
        } as any,
        classId: DEMO_COURSE_ID,
        assignmentId: "demo-local-1",
        students: [],
        canManage: false,
      }),
    );

    expect(screen.getByTestId("student-list").getAttribute("data-current-user-id")).toBe(
      "demo-sandbox-student",
    );
  });

  it("keeps the authenticated database id on persisted courses", async () => {
    const { AssignmentLayout } = await import("../assignment-layout");

    render(
      await AssignmentLayout({
        user: {
          id: "student-db-id",
          name: "Demo Student",
          email: "demo.student.visitor1234@eduteams.local",
          role: "STUDENT",
        } as any,
        course: {
          id: "persisted-course",
          namaMataKuliah: "Persisted Course",
          kelas: "K99",
        } as any,
        classId: "persisted-course",
        assignmentId: "assignment-1",
        students: [],
        canManage: false,
      }),
    );

    expect(screen.getByTestId("student-list").getAttribute("data-current-user-id")).toBe(
      "student-db-id",
    );
  });
});
