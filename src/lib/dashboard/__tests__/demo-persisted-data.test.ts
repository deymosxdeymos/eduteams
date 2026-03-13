import { afterAll, afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { DEMO_ASSIGNMENT_ID, DEMO_COURSE_ID, getDemoStudentsForCourse } from "@/lib/demo/sandbox";

const actualApiUtils = await import("@/lib/api-utils");
const actualNextCache = await import("next/cache");
const originalDemoMode = process.env.DEMO_MODE;

const unstableCacheMock = mock(
  (fn: (...args: any[]) => Promise<unknown> | unknown) =>
    (...args: any[]) =>
      fn(...args),
);
const getCurrentUserMock = mock(async () => null);
const getRemovedDemoStudentIdsFromCookieStoreMock = mock(async () => []);

const prismaMock: any = {
  course: {
    findMany: mock(async () => []),
  },
  courseEnrollment: {
    findMany: mock(async () => []),
  },
  assignment: {
    count: mock(async () => 0),
    findMany: mock(async () => []),
  },
  team: {
    count: mock(async () => 0),
    aggregate: mock(async () => ({
      _avg: { quality: null },
      _min: { quality: null },
      _max: { quality: null },
      _count: { _all: 0 },
    })),
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
mock.module("@/lib/demo/sandbox-roster", () => ({
  getRemovedDemoStudentIdsFromCookieStore: getRemovedDemoStudentIdsFromCookieStoreMock,
}));

afterAll(() => {
  mock.restore();
});

describe("demo sandbox data loaders", () => {
  beforeEach(() => {
    process.env.DEMO_MODE = "1";
    unstableCacheMock.mockClear();
    getCurrentUserMock.mockReset();
    getRemovedDemoStudentIdsFromCookieStoreMock.mockReset();
    prismaMock.course.findMany.mockReset();
    prismaMock.courseEnrollment.findMany.mockReset();
    prismaMock.assignment.count.mockReset();
    prismaMock.assignment.findMany.mockReset();
    prismaMock.team.count.mockReset();
    prismaMock.team.aggregate.mockReset();

    getCurrentUserMock.mockResolvedValue(null);
    getRemovedDemoStudentIdsFromCookieStoreMock.mockResolvedValue([]);
    prismaMock.course.findMany.mockResolvedValue([]);
    prismaMock.courseEnrollment.findMany.mockResolvedValue([]);
    prismaMock.assignment.count.mockResolvedValue(0);
    prismaMock.assignment.findMany.mockResolvedValue([]);
    prismaMock.team.count.mockResolvedValue(0);
    prismaMock.team.aggregate.mockResolvedValue({
      _avg: { quality: null },
      _min: { quality: null },
      _max: { quality: null },
      _count: { _all: 0 },
    });
  });

  afterEach(() => {
    if (originalDemoMode === undefined) {
      delete process.env.DEMO_MODE;
      return;
    }

    process.env.DEMO_MODE = originalDemoMode;
  });

  it("merges persisted courses with the synthetic sandbox course for demo-account teachers", async () => {
    prismaMock.course.findMany.mockResolvedValue([
      {
        id: "persisted-course",
        namaMataKuliah: "Persisted Course",
        kelas: "K99",
        tahunAwalPeriode: 2025,
        tahunAkhirPeriode: 2026,
        periode: "genap",
        dosenId: "demo-teacher-user",
        shareToken: null,
        createdAt: new Date("2026-03-10T00:00:00Z"),
        updatedAt: new Date("2026-03-11T00:00:00Z"),
        dosen: {
          id: "demo-teacher-user",
          name: "Demo Teacher",
          email: "demo.teacher.visitor1234@eduteams.local",
        },
        _count: { enrollments: 4 },
      },
    ]);

    const { getCoursesForDosen } = await import("../courses");
    const courses = await getCoursesForDosen({
      id: "demo-teacher-user",
      email: "demo.teacher.visitor1234@eduteams.local",
    });

    expect(prismaMock.course.findMany).toHaveBeenCalledTimes(1);
    expect(courses).toHaveLength(2);
    expect(courses.map((course) => course.id)).toEqual(["persisted-course", DEMO_COURSE_ID]);
  });

  it("merges persisted manage courses with the synthetic sandbox course for demo-account teachers", async () => {
    prismaMock.course.findMany.mockResolvedValue([
      {
        id: "persisted-manage-course",
        namaMataKuliah: "Persisted Course",
        kelas: "K99",
        tahunAwalPeriode: 2025,
        tahunAkhirPeriode: 2026,
        periode: "genap",
        archivedAt: null,
        createdAt: new Date("2026-03-10T00:00:00Z"),
        updatedAt: new Date("2026-03-11T00:00:00Z"),
        _count: { assignments: 2, enrollments: 4 },
      },
    ]);

    const { getManageCoursesForDosen } = await import("../../data/manage-dashboard");
    const courses = await getManageCoursesForDosen({
      id: "demo-teacher-user",
      email: "demo.teacher.visitor1234@eduteams.local",
    });

    expect(prismaMock.course.findMany).toHaveBeenCalledTimes(1);
    expect(courses).toHaveLength(2);
    expect(courses.map((course) => course.id)).toEqual(["persisted-manage-course", DEMO_COURSE_ID]);
  });

  it("merges persisted classes with the synthetic sandbox class for demo-account students", async () => {
    getCurrentUserMock.mockResolvedValue({
      id: "demo-student-user",
      email: "demo.student.visitor1234@eduteams.local",
      role: "STUDENT",
      isOnboarded: true,
    });
    prismaMock.courseEnrollment.findMany.mockResolvedValue([
      {
        enrolledAt: new Date("2026-03-10T00:00:00Z"),
        course: {
          id: "persisted-course",
          namaMataKuliah: "Persisted Course",
          kelas: "K99",
          tahunAwalPeriode: 2025,
          tahunAkhirPeriode: 2026,
          periode: "genap",
          dosen: { name: "Demo Teacher" },
          _count: { enrollments: 4 },
        },
      },
    ]);

    const { getStudentClasses } = await import("../student-classes");
    const classes = await getStudentClasses();

    expect(prismaMock.courseEnrollment.findMany).toHaveBeenCalledTimes(1);
    expect(classes).toHaveLength(2);
    expect(classes.map((course) => course.id)).toEqual(["persisted-course", DEMO_COURSE_ID]);
    expect(classes[0]?.canLeave).toBe(true);
    expect(classes[1]?.canLeave).toBe(false);
  });

  it("uses the filtered demo roster for sandbox course card counts", async () => {
    const expectedStudentCount = getDemoStudentsForCourse({
      excludedStudentIds: ["demo-sandbox-student-2"],
    }).length;
    getRemovedDemoStudentIdsFromCookieStoreMock.mockResolvedValue(["demo-sandbox-student-2"]);

    const { getCoursesForDosen } = await import("../courses");
    const courses = await getCoursesForDosen({
      id: "demo-teacher-user",
      email: "demo.teacher.visitor1234@eduteams.local",
    });

    expect(courses.find((course) => course.id === DEMO_COURSE_ID)?.studentCount).toBe(
      expectedStudentCount,
    );
  });

  it("uses the filtered demo roster for sandbox manage-course counts", async () => {
    const expectedStudentCount = getDemoStudentsForCourse({
      excludedStudentIds: ["demo-sandbox-student-2"],
    }).length;
    getRemovedDemoStudentIdsFromCookieStoreMock.mockResolvedValue(["demo-sandbox-student-2"]);

    const { getManageCoursesForDosen } = await import("../../data/manage-dashboard");
    const courses = await getManageCoursesForDosen({
      id: "demo-teacher-user",
      email: "demo.teacher.visitor1234@eduteams.local",
    });

    expect(courses.find((course) => course.id === DEMO_COURSE_ID)?.studentsCount).toBe(
      expectedStudentCount,
    );
  });

  it("uses the filtered demo roster for sandbox student class counts", async () => {
    const expectedStudentCount = getDemoStudentsForCourse({
      excludedStudentIds: ["demo-sandbox-student-2"],
    }).length;
    getRemovedDemoStudentIdsFromCookieStoreMock.mockResolvedValue(["demo-sandbox-student-2"]);
    getCurrentUserMock.mockResolvedValue({
      id: "demo-student-user",
      email: "demo.student.visitor1234@eduteams.local",
      role: "STUDENT",
      isOnboarded: true,
    });

    const { getStudentClasses } = await import("../student-classes");
    const classes = await getStudentClasses();

    expect(classes.find((course) => course.id === DEMO_COURSE_ID)?.studentCount).toBe(
      expectedStudentCount,
    );
  });

  it("uses synthetic dashboard statistics for authenticated demo-account teachers", async () => {
    prismaMock.assignment.count.mockResolvedValue(3);
    prismaMock.team.count.mockResolvedValue(2);
    prismaMock.team.aggregate.mockResolvedValue({
      _avg: { quality: 0.75 },
      _min: { quality: 0.5 },
      _max: { quality: 1 },
      _count: { _all: 2 },
    });

    const { getDashboardStatisticsForUser } = await import("../statistics");
    const stats = await getDashboardStatisticsForUser({
      id: "demo-teacher-user",
      email: "demo.teacher.visitor1234@eduteams.local",
    });

    expect(prismaMock.assignment.count).not.toHaveBeenCalled();
    expect(prismaMock.team.count).not.toHaveBeenCalled();
    expect(prismaMock.team.aggregate).not.toHaveBeenCalled();
    expect(stats).toEqual({
      totalAssignments: 1,
      totalTeams: 0,
      avgTeamQuality: 0,
      qualitySummary: {
        min: null,
        max: null,
        mean: null,
        n: 0,
      },
    });
  });

  it("keeps the synthetic statistics for the standalone sandbox teacher principal", async () => {
    prismaMock.assignment.count.mockResolvedValue(9);
    prismaMock.team.count.mockResolvedValue(4);
    prismaMock.team.aggregate.mockResolvedValue({
      _avg: { quality: 0.91 },
      _min: { quality: 0.8 },
      _max: { quality: 0.98 },
      _count: { _all: 4 },
    });

    const { getDashboardStatisticsForUser } = await import("../statistics");
    const stats = await getDashboardStatisticsForUser({
      id: "demo-sandbox-teacher",
      email: "demo.teacher.visitor1234@eduteams.local",
    });

    expect(prismaMock.assignment.count).not.toHaveBeenCalled();
    expect(prismaMock.team.count).not.toHaveBeenCalled();
    expect(prismaMock.team.aggregate).not.toHaveBeenCalled();
    expect(stats.totalAssignments).toBe(1);
    expect(stats.totalTeams).toBe(0);
    expect(stats.qualitySummary.n).toBe(0);
  });

  it("maps authenticated demo-account teachers to sandbox manage assignments for the demo course", async () => {
    prismaMock.assignment.findMany.mockResolvedValue([
      {
        id: "assignment-1",
        title: "Persisted Assignment",
        description: "desc",
        status: "DRAFT",
        startAt: new Date("2025-01-03T00:00:00Z"),
        createdAt: new Date("2025-01-02T00:00:00Z"),
        archivedAt: null,
        _count: { submissions: 1 },
      },
    ]);

    const { getManageAssignmentsForCourse } = await import("../../data/manage-assignments");
    const assignments = await getManageAssignmentsForCourse(
      DEMO_COURSE_ID,
      {
        id: "demo-teacher-user",
        email: "demo.teacher.visitor1234@eduteams.local",
      },
      4,
    );

    expect(prismaMock.assignment.findMany).not.toHaveBeenCalled();
    expect(assignments).toHaveLength(1);
    expect(assignments[0]?.id).toBe(DEMO_ASSIGNMENT_ID);
  });
});
