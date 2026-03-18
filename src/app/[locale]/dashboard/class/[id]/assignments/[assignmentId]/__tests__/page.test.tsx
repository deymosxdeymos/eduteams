import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import { getDemoStudentsForCourse } from "@/lib/demo/sandbox";

const actualServerAuth = await import("@/lib/server-auth");
const actualAuthorization = await import("@/lib/authorization");

const protectDashboardMock = mock(async () => ({
  id: "db-user-1",
  email: "demo.student.visitor-alpha@eduteams.local",
  role: "STUDENT",
}));
const canAccessDosenFeaturesMock = mock(() => false);
const canAccessMahasiswaFeaturesMock = mock(() => true);
const notFoundMock = mock(() => {
  throw new Error("NEXT_NOT_FOUND");
});
const getRemovedDemoStudentIdsFromCookieStoreMock = mock(async () => []);
const getDemoSubmittedAssignmentIdsFromCookieStoreMock = mock(async () => []);

function applyModuleMocks() {
  mock.module("next/navigation", () => ({
    notFound: notFoundMock,
  }));

  mock.module("@/lib/server-auth", () => ({
    ...actualServerAuth,
    protectDashboard: protectDashboardMock,
  }));

  mock.module("@/lib/authorization", () => ({
    ...actualAuthorization,
    canAccessDosenFeatures: canAccessDosenFeaturesMock,
    canAccessMahasiswaFeatures: canAccessMahasiswaFeaturesMock,
  }));

  mock.module("@/components/dashboard/dashboard-client", () => ({
    DashboardClient: ({ children }: any) => <div>{children}</div>,
  }));

  mock.module("@/components/dashboard/assignment-layout", () => ({
    AssignmentLayout: ({ children, canManage, students, submittedStudentIds }: any) => (
      <div
        data-testid="assignment-layout"
        data-can-manage={String(canManage)}
        data-student-ids={students.map((student: any) => student.id).join(",")}
        data-submitted-student-ids={submittedStudentIds.join(",")}
      >
        {children}
      </div>
    ),
  }));

  mock.module("@/components/demo/demo-local-assignment-body", () => ({
    DemoLocalAssignmentBody: ({ currentUserId, canManage, enrolledStudents }: any) => (
      <div
        data-testid="demo-local-assignment-body"
        data-current-user-id={currentUserId}
        data-can-manage={String(canManage)}
        data-enrolled-student-ids={enrolledStudents.map((student: any) => student.id).join(",")}
      />
    ),
  }));

  mock.module("@/components/dashboard/async/assignment-detail-async", () => ({
    AssignmentDetailAsync: () => null,
  }));

  mock.module("@/components/ui/skeletons/assignment-skeleton", () => ({
    AssignmentSkeleton: () => null,
  }));

  mock.module("@/lib/demo/sandbox-roster", () => ({
    getRemovedDemoStudentIdsFromCookieStore: getRemovedDemoStudentIdsFromCookieStoreMock,
  }));

  mock.module("@/lib/demo/sandbox-submissions", () => ({
    getDemoSubmittedAssignmentIdsFromCookieStore: getDemoSubmittedAssignmentIdsFromCookieStoreMock,
    getDemoSubmittedAssignmentIdsFromRequest: () => [],
  }));
}

describe("AssignmentPage demo identity", () => {
  const originalDemoMode = process.env.DEMO_MODE;

  beforeEach(() => {
    process.env.DEMO_MODE = "1";

    protectDashboardMock.mockClear();
    canAccessDosenFeaturesMock.mockClear();
    canAccessMahasiswaFeaturesMock.mockClear();
    notFoundMock.mockClear();
    getRemovedDemoStudentIdsFromCookieStoreMock.mockReset();
    getDemoSubmittedAssignmentIdsFromCookieStoreMock.mockReset();
    getRemovedDemoStudentIdsFromCookieStoreMock.mockResolvedValue([]);
    getDemoSubmittedAssignmentIdsFromCookieStoreMock.mockResolvedValue([]);
    canAccessDosenFeaturesMock.mockReturnValue(false);
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

  it("passes the sandbox principal id to the demo assignment body for student views", async () => {
    const { default: AssignmentPage } = await import("../page");

    render(
      await AssignmentPage({
        params: Promise.resolve({ id: "demo-sandbox-course", assignmentId: "demo-local-1" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(
      screen.getByTestId("demo-local-assignment-body").getAttribute("data-current-user-id"),
    ).toBe("demo-sandbox-student");
  });

  it("keeps the seeded demo assignment pending for student views before submission", async () => {
    const { default: AssignmentPage } = await import("../page");

    render(
      await AssignmentPage({
        params: Promise.resolve({
          id: "demo-sandbox-course",
          assignmentId: "demo-sandbox-assignment",
        }),
        searchParams: Promise.resolve({}),
      }),
    );

    const submittedStudentIds =
      screen
        .getByTestId("assignment-layout")
        .getAttribute("data-submitted-student-ids")
        ?.split(",")
        .filter(Boolean) ?? [];

    expect(submittedStudentIds).not.toContain("demo-sandbox-student");
    expect(
      screen.getByTestId("demo-local-assignment-body").getAttribute("data-current-user-id"),
    ).toBe("demo-sandbox-student");
  });

  it("keeps the demo assignment sidebar in teacher mode for demo teachers", async () => {
    protectDashboardMock.mockResolvedValue({
      id: "db-user-2",
      email: "demo.teacher.visitor-alpha@eduteams.local",
      role: "TEACHER",
    });
    canAccessDosenFeaturesMock.mockReturnValue(true);
    canAccessMahasiswaFeaturesMock.mockReturnValue(false);

    const { default: AssignmentPage } = await import("../page");

    render(
      await AssignmentPage({
        params: Promise.resolve({
          id: "demo-sandbox-course",
          assignmentId: "demo-sandbox-assignment",
        }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByTestId("assignment-layout").getAttribute("data-can-manage")).toBe("true");
    expect(screen.getByTestId("demo-local-assignment-body").getAttribute("data-can-manage")).toBe(
      "true",
    );
  });

  it("filters removed demo students from the assignment roster and counts", async () => {
    const expectedStudentCount = getDemoStudentsForCourse().length - 1;
    protectDashboardMock.mockResolvedValue({
      id: "db-user-2",
      email: "demo.teacher.visitor-alpha@eduteams.local",
      role: "TEACHER",
    });
    canAccessDosenFeaturesMock.mockReturnValue(true);
    canAccessMahasiswaFeaturesMock.mockReturnValue(false);
    getRemovedDemoStudentIdsFromCookieStoreMock.mockResolvedValue(["demo-sandbox-student-2"]);

    const { default: AssignmentPage } = await import("../page");

    render(
      await AssignmentPage({
        params: Promise.resolve({
          id: "demo-sandbox-course",
          assignmentId: "demo-sandbox-assignment",
        }),
        searchParams: Promise.resolve({}),
      }),
    );

    const studentIds =
      screen
        .getByTestId("assignment-layout")
        .getAttribute("data-student-ids")
        ?.split(",")
        .filter(Boolean) ?? [];
    const submittedStudentIds =
      screen
        .getByTestId("assignment-layout")
        .getAttribute("data-submitted-student-ids")
        ?.split(",")
        .filter(Boolean) ?? [];
    const enrolledStudentIds =
      screen
        .getByTestId("demo-local-assignment-body")
        .getAttribute("data-enrolled-student-ids")
        ?.split(",")
        .filter(Boolean) ?? [];

    expect(studentIds).not.toContain("demo-sandbox-student-2");
    expect(submittedStudentIds).not.toContain("demo-sandbox-student-2");
    expect(submittedStudentIds).not.toContain("demo-sandbox-student");
    expect(enrolledStudentIds).not.toContain("demo-sandbox-student-2");
    expect(studentIds).toHaveLength(expectedStudentCount);
    expect(submittedStudentIds).toHaveLength(expectedStudentCount - 1);
    expect(enrolledStudentIds).toHaveLength(expectedStudentCount);
  });
});
