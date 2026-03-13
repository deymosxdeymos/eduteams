import { afterAll, afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { DEMO_STUDENT_ID } from "@/lib/demo/sandbox";

const actualApiUtils = await import("@/lib/api-utils");
const actualNextCache = await import("next/cache");
const originalDemoMode = process.env.DEMO_MODE;

const unstableCacheMock = mock(
  (fn: (...args: any[]) => Promise<unknown> | unknown) =>
    (...args: any[]) =>
      fn(...args),
);
const getCurrentUserMock = mock(async () => null);

const prismaMock: any = {
  courseEnrollment: {
    findMany: mock(async () => []),
  },
  assignment: {
    findMany: mock(async () => []),
  },
  assignmentSubmission: {
    findMany: mock(async () => []),
  },
  teamFormationRequest: {
    findMany: mock(async () => []),
  },
};

mock.module("next/cache", () => ({
  ...actualNextCache,
  unstable_cache: unstableCacheMock,
}));
mock.module("@/lib/prisma", () => ({
  default: prismaMock,
}));
mock.module("@/lib/api-utils", () => ({
  ...actualApiUtils,
  getCurrentUser: getCurrentUserMock,
}));

afterAll(() => {
  mock.restore();
});

describe("getSidebarDataForUser", () => {
  beforeEach(() => {
    process.env.DEMO_MODE = "1";
    unstableCacheMock.mockClear();
    getCurrentUserMock.mockReset();
    prismaMock.courseEnrollment.findMany.mockReset();
    prismaMock.assignment.findMany.mockReset();
    prismaMock.assignmentSubmission.findMany.mockReset();
    prismaMock.teamFormationRequest.findMany.mockReset();

    getCurrentUserMock.mockResolvedValue(null);
    prismaMock.courseEnrollment.findMany.mockResolvedValue([]);
    prismaMock.assignment.findMany.mockResolvedValue([]);
    prismaMock.assignmentSubmission.findMany.mockResolvedValue([]);
    prismaMock.teamFormationRequest.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    if (originalDemoMode === undefined) {
      delete process.env.DEMO_MODE;
      return;
    }

    process.env.DEMO_MODE = originalDemoMode;
  });

  it("keeps persisted pending-work counts for demo-account students", async () => {
    prismaMock.courseEnrollment.findMany.mockResolvedValue([{ courseId: "persisted-course" }]);
    prismaMock.assignment.findMany.mockResolvedValue([
      {
        id: "assignment-1",
        status: "MENUNGGU",
        createdById: "teacher-1",
        startAt: new Date("2026-03-10T00:00:00Z"),
        teamFormationRequests: [{ teams: [] }],
      },
      {
        id: "assignment-2",
        status: "MENUNGGU",
        createdById: "teacher-1",
        startAt: new Date("2026-03-10T00:00:00Z"),
        teamFormationRequests: [{ teams: [] }],
      },
    ]);
    prismaMock.assignmentSubmission.findMany.mockResolvedValue([{ assignmentId: "assignment-2" }]);

    const { getSidebarDataForUser } = await import("../sidebar-data");
    const sidebar = await getSidebarDataForUser({
      id: "demo-student-user",
      name: "Demo Student",
      email: "demo.student.visitor1234@eduteams.local",
      role: "STUDENT",
    });

    expect(sidebar.notStartedCount).toBe(1);
    expect(prismaMock.courseEnrollment.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.assignment.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.assignmentSubmission.findMany).toHaveBeenCalledTimes(1);
  });

  it("keeps synthetic sidebar counts for the standalone sandbox student principal", async () => {
    const { getSidebarDataForUser } = await import("../sidebar-data");
    const sidebar = await getSidebarDataForUser({
      id: DEMO_STUDENT_ID,
      name: "Sandbox Student",
      email: "demo.student.visitor1234@eduteams.local",
      role: "STUDENT",
    });

    expect(sidebar.notStartedCount).toBe(0);
    expect(prismaMock.courseEnrollment.findMany).not.toHaveBeenCalled();
    expect(prismaMock.assignment.findMany).not.toHaveBeenCalled();
    expect(prismaMock.assignmentSubmission.findMany).not.toHaveBeenCalled();
  });
});
