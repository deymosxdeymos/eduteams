import { beforeEach, describe, expect, it, mock } from "bun:test";
import {
  createAssignmentSnapshot,
  getLatestSnapshotVersion,
  invalidateAssignmentSubmissions,
  markSubmissionsNeedUpdate,
} from "../assignment-snapshot";

const mockPrisma = {
  assignmentSnapshot: {
    create: mock(() => Promise.resolve()),
    findFirst: mock(() => Promise.resolve(null)),
  },
  assignmentSubmission: {
    findMany: mock(() => Promise.resolve([])),
    deleteMany: mock(() => Promise.resolve({ count: 0 })),
    updateMany: mock(() => Promise.resolve({ count: 0 })),
  },
  assignmentTopicPreference: {
    deleteMany: mock(() => Promise.resolve({ count: 0 })),
  },
  assignmentTopic: {
    deleteMany: mock(() => Promise.resolve({ count: 0 })),
  },
  $transaction: mock((fn: (tx: unknown) => Promise<unknown>) => fn(mockPrisma)),
};

mock.module("@/lib/prisma", () => ({
  default: mockPrisma,
}));

describe("createAssignmentSnapshot", () => {
  beforeEach(() => {
    mockPrisma.assignmentSnapshot.create.mockClear();
  });

  it("creates snapshot with all required fields", async () => {
    await createAssignmentSnapshot({
      assignmentId: "assignment-123",
      version: 1,
      title: "Test Assignment",
      description: JSON.stringify({ skills: ["JS"], topics: ["React"] }),
    });

    expect(mockPrisma.assignmentSnapshot.create).toHaveBeenCalledWith({
      data: {
        assignmentId: "assignment-123",
        version: 1,
        title: "Test Assignment",
        description: JSON.stringify({ skills: ["JS"], topics: ["React"] }),
        snapshotReason: "structural_edit",
      },
    });
  });

  it("uses custom reason when provided", async () => {
    await createAssignmentSnapshot({
      assignmentId: "assignment-123",
      version: 2,
      title: "Test",
      description: null,
      reason: "tier_3_destructive",
    });

    expect(mockPrisma.assignmentSnapshot.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        snapshotReason: "tier_3_destructive",
      }),
    });
  });

  it("handles null description", async () => {
    await createAssignmentSnapshot({
      assignmentId: "assignment-123",
      version: 1,
      title: "Test",
      description: null,
    });

    expect(mockPrisma.assignmentSnapshot.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        description: null,
      }),
    });
  });

  it("propagates database errors", async () => {
    mockPrisma.assignmentSnapshot.create.mockRejectedValueOnce(
      new Error("Database connection failed"),
    );

    await expect(
      createAssignmentSnapshot({
        assignmentId: "assignment-123",
        version: 1,
        title: "Test",
        description: null,
      }),
    ).rejects.toThrow("Database connection failed");
  });
});

describe("getLatestSnapshotVersion", () => {
  beforeEach(() => {
    mockPrisma.assignmentSnapshot.findFirst.mockClear();
  });

  it("returns 0 when no snapshots exist", async () => {
    mockPrisma.assignmentSnapshot.findFirst.mockResolvedValueOnce(null);

    const result = await getLatestSnapshotVersion("assignment-123");

    expect(result).toBe(0);
    expect(mockPrisma.assignmentSnapshot.findFirst).toHaveBeenCalledWith({
      where: { assignmentId: "assignment-123" },
      select: { version: true },
      orderBy: { version: "desc" },
    });
  });

  it("returns the latest version number", async () => {
    mockPrisma.assignmentSnapshot.findFirst.mockResolvedValueOnce({
      version: 5,
    });

    const result = await getLatestSnapshotVersion("assignment-123");

    expect(result).toBe(5);
  });

  it("returns version 1 when only one snapshot exists", async () => {
    mockPrisma.assignmentSnapshot.findFirst.mockResolvedValueOnce({
      version: 1,
    });

    const result = await getLatestSnapshotVersion("assignment-123");

    expect(result).toBe(1);
  });

  it("handles large version numbers", async () => {
    mockPrisma.assignmentSnapshot.findFirst.mockResolvedValueOnce({
      version: 9999,
    });

    const result = await getLatestSnapshotVersion("assignment-123");

    expect(result).toBe(9999);
  });
});

describe("invalidateAssignmentSubmissions", () => {
  beforeEach(() => {
    mockPrisma.assignmentSubmission.findMany.mockClear();
    mockPrisma.assignmentSubmission.deleteMany.mockClear();
    mockPrisma.assignmentTopicPreference.deleteMany.mockClear();
    mockPrisma.assignmentTopic.deleteMany.mockClear();
    mockPrisma.$transaction.mockClear();
    mockPrisma.$transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) =>
      fn(mockPrisma),
    );
  });

  it("returns 0 when no submissions exist", async () => {
    mockPrisma.assignmentSubmission.findMany.mockResolvedValueOnce([]);

    const result = await invalidateAssignmentSubmissions("assignment-123");

    expect(result).toBe(0);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("deletes all related data in transaction", async () => {
    mockPrisma.assignmentSubmission.findMany.mockResolvedValueOnce([
      { studentId: "student-1" },
      { studentId: "student-2" },
      { studentId: "student-3" },
    ]);

    const result = await invalidateAssignmentSubmissions("assignment-123");

    expect(result).toBe(3);
    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(mockPrisma.assignmentTopicPreference.deleteMany).toHaveBeenCalledWith({
      where: {
        topic: {
          assignmentId: "assignment-123",
        },
      },
    });
    expect(mockPrisma.assignmentTopic.deleteMany).toHaveBeenCalledWith({
      where: { assignmentId: "assignment-123" },
    });
    expect(mockPrisma.assignmentSubmission.deleteMany).toHaveBeenCalledWith({
      where: { assignmentId: "assignment-123" },
    });
  });

  it("returns correct count for single submission", async () => {
    mockPrisma.assignmentSubmission.findMany.mockResolvedValueOnce([{ studentId: "student-1" }]);

    const result = await invalidateAssignmentSubmissions("assignment-123");

    expect(result).toBe(1);
  });

  it("counts all submissions including duplicates", async () => {
    mockPrisma.assignmentSubmission.findMany.mockResolvedValueOnce([
      { studentId: "student-1" },
      { studentId: "student-1" },
      { studentId: "student-2" },
    ]);

    const result = await invalidateAssignmentSubmissions("assignment-123");

    expect(result).toBe(3);
  });
});

describe("markSubmissionsNeedUpdate", () => {
  beforeEach(() => {
    mockPrisma.assignmentSubmission.updateMany.mockClear();
  });

  it("marks submissions with version less than current+1", async () => {
    mockPrisma.assignmentSubmission.updateMany.mockResolvedValueOnce({
      count: 10,
    });

    const result = await markSubmissionsNeedUpdate("assignment-123", 5);

    expect(result).toBe(10);
    expect(mockPrisma.assignmentSubmission.updateMany).toHaveBeenCalledWith({
      where: {
        assignmentId: "assignment-123",
        structureVersion: {
          lt: 6,
        },
      },
      data: {
        needsUpdate: true,
      },
    });
  });

  it("returns 0 when no submissions need update", async () => {
    mockPrisma.assignmentSubmission.updateMany.mockResolvedValueOnce({
      count: 0,
    });

    const result = await markSubmissionsNeedUpdate("assignment-123", 1);

    expect(result).toBe(0);
  });

  it("handles version 0 correctly", async () => {
    mockPrisma.assignmentSubmission.updateMany.mockResolvedValueOnce({
      count: 5,
    });

    const result = await markSubmissionsNeedUpdate("assignment-123", 0);

    expect(result).toBe(5);
    expect(mockPrisma.assignmentSubmission.updateMany).toHaveBeenCalledWith({
      where: {
        assignmentId: "assignment-123",
        structureVersion: {
          lt: 1,
        },
      },
      data: {
        needsUpdate: true,
      },
    });
  });

  it("marks all submissions with version less than or equal to current", async () => {
    mockPrisma.assignmentSubmission.updateMany.mockResolvedValueOnce({
      count: 3,
    });

    await markSubmissionsNeedUpdate("assignment-123", 5);

    expect(mockPrisma.assignmentSubmission.updateMany).toHaveBeenCalledWith({
      where: {
        assignmentId: "assignment-123",
        structureVersion: {
          lt: 6,
        },
      },
      data: {
        needsUpdate: true,
      },
    });
  });
});

describe("integration scenarios", () => {
  beforeEach(() => {
    mockPrisma.assignmentSnapshot.create.mockClear();
    mockPrisma.assignmentSnapshot.findFirst.mockClear();
    mockPrisma.assignmentSubmission.findMany.mockClear();
    mockPrisma.assignmentSubmission.updateMany.mockClear();
    mockPrisma.$transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) =>
      fn(mockPrisma),
    );
  });

  it("workflow: create snapshot then invalidate submissions", async () => {
    mockPrisma.assignmentSnapshot.findFirst.mockResolvedValueOnce({
      version: 2,
    });

    const currentVersion = await getLatestSnapshotVersion("assignment-123");
    expect(currentVersion).toBe(2);

    await createAssignmentSnapshot({
      assignmentId: "assignment-123",
      version: currentVersion + 1,
      title: "Updated Assignment",
      description: JSON.stringify({ skills: ["New"], topics: [] }),
      reason: "tier_3_destructive",
    });

    expect(mockPrisma.assignmentSnapshot.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        version: 3,
      }),
    });

    mockPrisma.assignmentSubmission.findMany.mockResolvedValueOnce([
      { studentId: "s1" },
      { studentId: "s2" },
    ]);

    const invalidated = await invalidateAssignmentSubmissions("assignment-123");
    expect(invalidated).toBe(2);
  });

  it("workflow: create snapshot then mark submissions for update", async () => {
    mockPrisma.assignmentSnapshot.findFirst.mockResolvedValueOnce({
      version: 1,
    });

    const currentVersion = await getLatestSnapshotVersion("assignment-123");

    await createAssignmentSnapshot({
      assignmentId: "assignment-123",
      version: currentVersion + 1,
      title: "Assignment with New Items",
      description: JSON.stringify({ skills: ["Old", "New"], topics: [] }),
      reason: "tier_2_additive",
    });

    mockPrisma.assignmentSubmission.updateMany.mockResolvedValueOnce({
      count: 15,
    });

    const markedCount = await markSubmissionsNeedUpdate("assignment-123", currentVersion);
    expect(markedCount).toBe(15);
  });
});
