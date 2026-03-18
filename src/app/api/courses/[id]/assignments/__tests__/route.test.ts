import { beforeEach, describe, expect, it, mock } from "bun:test";

const actualApiUtils = await import("@/lib/api-utils");
const getCurrentUserMock = mock(async () => ({
  id: "u1",
  email: "teacher@example.com",
  role: "TEACHER",
  isOnboarded: true,
}));
const getDemoSubmittedAssignmentIdsFromRequestMock = mock(() => [] as string[]);

const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({
      id: "u1",
      email: "teacher@example.com",
      role: "TEACHER",
      isOnboarded: true,
    })),
  },
  course: {
    findFirst: mock(async (args: any) =>
      args?.where?.dosenId === "u1" && args?.where?.id === "c1"
        ? { id: "c1", dosenId: "u1" }
        : null,
    ),
  },
  courseEnrollment: {
    findUnique: mock(async (args: any) =>
      args?.where?.courseId_studentId?.courseId === "c1" &&
      args?.where?.courseId_studentId?.studentId === "s1"
        ? { courseId: "c1", studentId: "s1" }
        : null,
    ),
    findMany: mock(async () => []),
  },
  assignment: {
    findMany: mock(async (args: any) => {
      const isSelectingSubmissions = args?.select?.submissions && args.select.submissions !== false;
      return [
        {
          id: "a1",
          courseId: "c1",
          title: "Tugas 1",
          description: null,
          startAt: new Date("2025-01-01T00:00:00Z"),
          createdAt: new Date("2025-01-02T00:00:00Z"),
          status: "BELUM_ISI",
          _count: { submissions: 2 },
          ...(isSelectingSubmissions ? { submissions: [{ id: "sub1" }] } : {}),
        },
      ];
    }),
    create: mock(async (args: any) => ({
      id: "a2",
      ...args.data,
      createdAt: new Date("2025-01-03T00:00:00Z"),
      status: "BELUM_ISI",
      structureVersion: 1,
    })),
  },
  assignmentSubmission: {
    createMany: mock(async () => ({ count: 0 })),
  },
  personSkill: {
    createMany: mock(async () => ({ count: 0 })),
  },
  assignmentTopicPreference: {
    createMany: mock(async () => ({ count: 0 })),
  },
  skill: {
    findMany: mock(async () => []),
    createMany: mock(async () => ({ count: 0 })),
  },
  courseSkill: {
    findMany: mock(async () => []),
    createMany: mock(async () => ({ count: 0 })),
  },
  assignmentTopic: {
    findMany: mock(async () => []),
    createMany: mock(async () => ({ count: 0 })),
  },
  $transaction: mock(async (callback: any) => {
    // Execute callback with prismaMock as transaction context
    return await callback(prismaMock);
  }),
};

mock.module("@/lib/prisma", () => ({ default: prismaMock }));
mock.module("@/lib/api-utils", () => ({
  ...actualApiUtils,
  getCurrentUser: getCurrentUserMock,
}));
mock.module("@/lib/demo/sandbox-submissions", () => ({
  getDemoSubmittedAssignmentIdsFromRequest: getDemoSubmittedAssignmentIdsFromRequestMock,
  getDemoSubmittedAssignmentIdsFromCookieStore: async () => [],
}));
mock.module("@/lib/demo/sandbox-roster", () => ({
  getRemovedDemoStudentIdsFromRequest: () => [],
  getRemovedDemoStudentIdsFromCookieStore: async () => [],
}));

describe("courses/[id]/assignments API", () => {
  beforeEach(() => {
    getCurrentUserMock.mockReset();
    getDemoSubmittedAssignmentIdsFromRequestMock.mockReset();
    getCurrentUserMock.mockResolvedValue({
      id: "u1",
      email: "teacher@example.com",
      role: "TEACHER",
      isOnboarded: true,
    });
    getDemoSubmittedAssignmentIdsFromRequestMock.mockReturnValue([]);
  });
  it("GET returns assignments for dosen owner without submittedByMe", async () => {
    const { GET } = await import("../route");
    const res = await GET(
      new Request("http://localhost/api/courses/c1/assignments") as any,
      { params: Promise.resolve({ id: "c1" }) } as any,
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data[0].id).toBe("a1");
    expect(json.data[0].submittedByMe).toBeUndefined();
  });

  it("GET returns assignments for mahasiswa with submittedByMe", async () => {
    getCurrentUserMock.mockResolvedValue({
      id: "s1",
      email: "student@example.com",
      role: "STUDENT",
      isOnboarded: true,
    });

    const { GET } = await import("../route");
    const res = await GET(
      new Request("http://localhost/api/courses/c1/assignments") as any,
      { params: Promise.resolve({ id: "c1" }) } as any,
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data[0].submittedByMe).toBe(true);
  });

  it("GET reflects persisted sandbox submissions for demo students", async () => {
    const originalDemoMode = process.env.DEMO_MODE;
    process.env.DEMO_MODE = "1";
    getCurrentUserMock.mockResolvedValue({
      id: "s1",
      email: "demo.student.visitor1234@eduteams.local",
      role: "STUDENT",
      isOnboarded: true,
    });

    try {
      const { GET } = await import("../route");
      const { DEMO_ASSIGNMENT_ID, getDemoStudentsForCourse } = await import("@/lib/demo/sandbox");
      getDemoSubmittedAssignmentIdsFromRequestMock.mockReturnValue([DEMO_ASSIGNMENT_ID]);
      const res = await GET(
        new Request("http://localhost/api/courses/demo-sandbox-course/assignments") as any,
        { params: Promise.resolve({ id: "demo-sandbox-course" }) } as any,
      );

      expect(res.status).toBe(200);
      const json = (await res.json()) as any;
      expect(json.data[0]).toEqual(
        expect.objectContaining({
          id: DEMO_ASSIGNMENT_ID,
          submittedByMe: true,
          submissionsCount: getDemoStudentsForCourse().length,
        }),
      );
    } finally {
      if (originalDemoMode === undefined) {
        delete process.env.DEMO_MODE;
      } else {
        process.env.DEMO_MODE = originalDemoMode;
      }
    }
  });

  it("GET keeps demo teacher assignment counts aligned with persisted sandbox submissions", async () => {
    const originalDemoMode = process.env.DEMO_MODE;
    process.env.DEMO_MODE = "1";
    getCurrentUserMock.mockResolvedValue({
      id: "u1",
      email: "demo.teacher.visitor1234@eduteams.local",
      role: "TEACHER",
      isOnboarded: true,
    });

    try {
      const { GET } = await import("../route");
      const { DEMO_ASSIGNMENT_ID, getDemoStudentsForCourse } = await import("@/lib/demo/sandbox");
      const totalStudents = getDemoStudentsForCourse().length;
      getDemoSubmittedAssignmentIdsFromRequestMock.mockReturnValue([]);
      const pendingRes = await GET(
        new Request("http://localhost/api/courses/demo-sandbox-course/assignments") as any,
        { params: Promise.resolve({ id: "demo-sandbox-course" }) } as any,
      );
      getDemoSubmittedAssignmentIdsFromRequestMock.mockReturnValue([DEMO_ASSIGNMENT_ID]);
      const submittedRes = await GET(
        new Request("http://localhost/api/courses/demo-sandbox-course/assignments") as any,
        { params: Promise.resolve({ id: "demo-sandbox-course" }) } as any,
      );

      expect(pendingRes.status).toBe(200);
      expect(submittedRes.status).toBe(200);
      expect(((await pendingRes.json()) as any).data[0]).toEqual(
        expect.objectContaining({
          id: DEMO_ASSIGNMENT_ID,
          submittedByMe: false,
          submissionsCount: totalStudents - 1,
        }),
      );
      expect(((await submittedRes.json()) as any).data[0]).toEqual(
        expect.objectContaining({
          id: DEMO_ASSIGNMENT_ID,
          submittedByMe: false,
          submissionsCount: totalStudents,
        }),
      );
    } finally {
      if (originalDemoMode === undefined) {
        delete process.env.DEMO_MODE;
      } else {
        process.env.DEMO_MODE = originalDemoMode;
      }
    }
  });

  it("GET returns 404 for dosen non-owner", async () => {
    const { GET } = await import("../route");
    const res = await GET(
      new Request("http://localhost/api/courses/wrong/assignments") as any,
      { params: Promise.resolve({ id: "wrong" }) } as any,
    );
    expect(res.status).toBe(404);
  });

  it("POST creates assignment for dosen owner with 201", async () => {
    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/courses/c1/assignments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "T2",
        description: "  desc  ",
        skills: ["Frontend"],
        topics: ["Topic1", " Topic2 "],
      }),
    });
    const res = await POST(req as any, { params: Promise.resolve({ id: "c1" }) } as any);
    expect(res.status).toBe(201);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(json.data.skills).toEqual(["Frontend"]);
    expect(json.data.topics).toEqual(["Topic1", "Topic2"]);
  });

  it("POST preserves the chosen start date for local demo assignments", async () => {
    const originalDemoMode = process.env.DEMO_MODE;
    process.env.DEMO_MODE = "1";
    getCurrentUserMock.mockResolvedValue({
      id: "u1",
      email: "demo.teacher.visitor1234@eduteams.local",
      role: "TEACHER",
      isOnboarded: true,
    });

    try {
      const { POST } = await import("../route");
      const scheduledStartAt = "2026-04-15T09:30:00.000Z";
      const req = new Request("http://localhost/api/courses/demo-sandbox-course/assignments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "Scheduled Demo Assignment",
          skills: ["Frontend"],
          topics: ["Topic1"],
          startAt: scheduledStartAt,
        }),
      });
      const res = await POST(
        req as any,
        { params: Promise.resolve({ id: "demo-sandbox-course" }) } as any,
      );

      expect(res.status).toBe(201);
      const json = (await res.json()) as any;
      expect(new Date(json.data.startAt).toISOString()).toBe(scheduledStartAt);
    } finally {
      if (originalDemoMode === undefined) {
        delete process.env.DEMO_MODE;
      } else {
        process.env.DEMO_MODE = originalDemoMode;
      }
    }
  });

  it("POST seeds demo classmates as submitted participants for demo teachers", async () => {
    const originalDemoMode = process.env.DEMO_MODE;
    process.env.DEMO_MODE = "1";
    const { getDemoStudentCourseEmailPrefix } = await import("@/lib/demo/seed-students");
    const emailPrefix = getDemoStudentCourseEmailPrefix("visitor1234", "c1");

    prismaMock.assignmentSubmission.createMany.mockClear();
    prismaMock.personSkill.createMany.mockClear();
    prismaMock.assignmentTopicPreference.createMany.mockClear();
    prismaMock.courseEnrollment.findMany.mockImplementationOnce(async () => [
      {
        studentId: "seed-20",
        student: {
          email: `${emailPrefix}10@eduteams.local`,
        },
      },
      {
        studentId: "seed-03",
        student: {
          email: `${emailPrefix}2@eduteams.local`,
        },
      },
    ]);
    prismaMock.courseSkill.findMany.mockImplementationOnce(async () => [
      { skillId: "skill-1" },
      { skillId: "skill-2" },
    ]);
    prismaMock.assignmentTopic.findMany.mockImplementationOnce(async () => [
      { id: "topic-1" },
      { id: "topic-2" },
    ]);
    prismaMock.assignmentSubmission.createMany.mockResolvedValueOnce({
      count: 2,
    });
    getCurrentUserMock.mockResolvedValue({
      id: "u1",
      email: "demo.teacher.visitor1234@eduteams.local",
      role: "TEACHER",
      isOnboarded: true,
    });

    try {
      const { POST } = await import("../route");
      const req = new Request("http://localhost/api/courses/c1/assignments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "Demo Assignment",
          skills: ["Frontend"],
          topics: ["Topic1"],
        }),
      });
      const res = await POST(req as any, { params: Promise.resolve({ id: "c1" }) } as any);

      expect(res.status).toBe(201);
      expect(prismaMock.courseEnrollment.findMany).toHaveBeenCalledWith({
        where: {
          courseId: "c1",
          student: {
            email: {
              startsWith: expect.stringContaining("dcs."),
            },
          },
        },
        select: {
          studentId: true,
          student: {
            select: {
              email: true,
            },
          },
        },
      });
      expect(prismaMock.courseSkill.findMany).toHaveBeenCalledWith({
        where: { courseId: "c1" },
        orderBy: { skillId: "asc" },
        select: { skillId: true },
      });
      expect(prismaMock.assignmentTopic.findMany).toHaveBeenCalledWith({
        where: { assignmentId: "a2" },
        orderBy: { name: "asc" },
        select: { id: true },
      });
      expect(prismaMock.assignmentSubmission.createMany).toHaveBeenCalledWith({
        data: [
          {
            assignmentId: "a2",
            studentId: "seed-03",
            structureVersion: 1,
          },
          {
            assignmentId: "a2",
            studentId: "seed-20",
            structureVersion: 1,
          },
        ],
        skipDuplicates: true,
      });
      expect(prismaMock.personSkill.createMany).toHaveBeenCalledWith({
        data: [
          {
            personId: "seed-03",
            skillId: "skill-1",
            level: expect.any(Number),
          },
          {
            personId: "seed-03",
            skillId: "skill-2",
            level: expect.any(Number),
          },
          {
            personId: "seed-20",
            skillId: "skill-1",
            level: expect.any(Number),
          },
          {
            personId: "seed-20",
            skillId: "skill-2",
            level: expect.any(Number),
          },
        ],
        skipDuplicates: true,
      });
      expect(prismaMock.assignmentTopicPreference.createMany).toHaveBeenCalledWith({
        data: [
          {
            assignmentTopicId: "topic-1",
            personId: "seed-03",
            preference: expect.any(Number),
          },
          {
            assignmentTopicId: "topic-2",
            personId: "seed-03",
            preference: expect.any(Number),
          },
          {
            assignmentTopicId: "topic-1",
            personId: "seed-20",
            preference: expect.any(Number),
          },
          {
            assignmentTopicId: "topic-2",
            personId: "seed-20",
            preference: expect.any(Number),
          },
        ],
        skipDuplicates: true,
      });
      const json = (await res.json()) as any;
      expect(json.data.submissionsCount).toBe(2);
    } finally {
      if (originalDemoMode === undefined) {
        delete process.env.DEMO_MODE;
      } else {
        process.env.DEMO_MODE = originalDemoMode;
      }
    }
  });

  it("POST rolls back demo assignment creation when demo seeding fails", async () => {
    const originalDemoMode = process.env.DEMO_MODE;
    process.env.DEMO_MODE = "1";

    const committedAssignments: Array<{ id: string; title: string }> = [];
    let shouldFailSeeding = true;
    let assignmentSequence = 2;

    prismaMock.courseEnrollment.findMany.mockImplementation(async () => [{ studentId: "seed-1" }]);
    prismaMock.courseSkill.findMany.mockImplementation(async () => [{ skillId: "skill-1" }]);
    prismaMock.assignmentTopic.findMany.mockImplementation(async () => [{ id: "topic-1" }]);
    prismaMock.user.findUnique.mockImplementation(async () => ({
      id: "u1",
      email: "demo.teacher.visitor1234@eduteams.local",
      role: "TEACHER",
      isOnboarded: true,
    }));
    prismaMock.$transaction.mockImplementation(async (callback: any) => {
      const pendingAssignments: Array<{ id: string; title: string }> = [];
      const tx = {
        ...prismaMock,
        assignment: {
          ...prismaMock.assignment,
          create: async (args: any) => {
            assignmentSequence += 1;
            const created = {
              id: `a${assignmentSequence}`,
              ...args.data,
              createdAt: new Date("2025-01-03T00:00:00Z"),
              status: "BELUM_ISI",
              structureVersion: 1,
            };
            pendingAssignments.push({ id: created.id, title: created.title });
            return created;
          },
        },
        assignmentSubmission: {
          ...prismaMock.assignmentSubmission,
          createMany: async () => {
            if (shouldFailSeeding) {
              throw new Error("seed failed");
            }
            return { count: 1 };
          },
        },
      };

      const result = await callback(tx);
      committedAssignments.push(...pendingAssignments);
      return result;
    });

    getCurrentUserMock.mockResolvedValue({
      id: "u1",
      email: "demo.teacher.visitor1234@eduteams.local",
      role: "TEACHER",
      isOnboarded: true,
    });

    try {
      const { POST } = await import("../route");
      const req = new Request("http://localhost/api/courses/c1/assignments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "Atomic Demo Assignment",
          skills: ["Frontend"],
          topics: ["Topic1"],
        }),
      });

      const failedRes = await POST(
        req.clone() as any,
        { params: Promise.resolve({ id: "c1" }) } as any,
      );
      expect(failedRes.status).toBe(500);
      expect(committedAssignments).toHaveLength(0);

      shouldFailSeeding = false;

      const successRes = await POST(req as any, { params: Promise.resolve({ id: "c1" }) } as any);
      expect(successRes.status).toBe(201);
      expect(committedAssignments).toHaveLength(1);
      expect(committedAssignments[0]).toEqual({
        id: "a4",
        title: "Atomic Demo Assignment",
      });
    } finally {
      if (originalDemoMode === undefined) {
        delete process.env.DEMO_MODE;
      } else {
        process.env.DEMO_MODE = originalDemoMode;
      }
    }
  });

  it("POST denies mahasiswa", async () => {
    getCurrentUserMock.mockResolvedValue({
      id: "s1",
      email: "student@example.com",
      role: "STUDENT",
      isOnboarded: true,
    });

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/courses/c1/assignments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "T", skills: [], topics: [] }),
    });
    const res = await POST(req as any, { params: Promise.resolve({ id: "c1" }) } as any);
    expect(res.status).toBe(403);
  });
});
