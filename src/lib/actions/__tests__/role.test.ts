import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

const actualNextCache = await import("next/cache");
const actualNextNavigation = await import("next/navigation");
const actualPrisma = await import("@/lib/prisma");

const redirectMock = mock((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
const revalidatePathMock = mock(() => {});
const prismaMock = {
  user: {
    update: mock(async () => ({})),
  },
};

function applyModuleMocks() {
  mock.module("next/cache", () => ({
    ...actualNextCache,
    revalidatePath: revalidatePathMock,
  }));

  mock.module("next/navigation", () => ({
    ...actualNextNavigation,
    redirect: redirectMock,
  }));

  mock.module("@/lib/prisma", () => ({
    default: prismaMock,
  }));
}

function restoreModuleMocks() {
  mock.module("next/cache", () => actualNextCache);
  mock.module("next/navigation", () => actualNextNavigation);
  mock.module("@/lib/prisma", () => ({ default: actualPrisma.default }));
}

describe("role actions", () => {
  const originalDemoMode = process.env.DEMO_MODE;
  const originalDisableInstitutionalEmail = process.env.NEXT_PUBLIC_DISABLE_INSTITUTIONAL_EMAIL;

  beforeEach(() => {
    delete process.env.DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DISABLE_INSTITUTIONAL_EMAIL;
    redirectMock.mockReset();
    revalidatePathMock.mockReset();
    prismaMock.user.update.mockReset();

    redirectMock.mockImplementation((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    });
    prismaMock.user.update.mockResolvedValue({});

    applyModuleMocks();
  });

  afterEach(() => {
    mock.restore();
    restoreModuleMocks();

    if (originalDemoMode === undefined) {
      delete process.env.DEMO_MODE;
    } else {
      process.env.DEMO_MODE = originalDemoMode;
    }

    if (originalDisableInstitutionalEmail === undefined) {
      delete process.env.NEXT_PUBLIC_DISABLE_INSTITUTIONAL_EMAIL;
      return;
    }

    process.env.NEXT_PUBLIC_DISABLE_INSTITUTIONAL_EMAIL = originalDisableInstitutionalEmail;
  });

  it("rejects non-institutional teacher selections in demo mode", async () => {
    process.env.DEMO_MODE = "1";
    const { submitRole } = await import("../role");
    const formData = new FormData();
    formData.set("role", "dosen");

    await expect(
      submitRole(formData, async () => ({
        id: "user-1",
        email: "user@example.com",
      })),
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding/role?err=dosen_email");

    expect(prismaMock.user.update).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("rejects student-scoped demo accounts from persisting the teacher role", async () => {
    process.env.DEMO_MODE = "1";
    const { submitRole } = await import("../role");
    const formData = new FormData();
    formData.set("role", "dosen");

    await expect(
      submitRole(formData, async () => ({
        id: "user-1",
        email: "demo.student.visitor1234@eduteams.local",
      })),
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding/role?err=dosen_email");

    expect(prismaMock.user.update).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("allows real demo accounts to continue as teachers in demo mode", async () => {
    process.env.DEMO_MODE = "1";
    const { submitRole } = await import("../role");
    const formData = new FormData();
    formData.set("role", "dosen");

    await expect(
      submitRole(formData, async () => ({
        id: "user-1",
        email: "demo.teacher.visitor1234@eduteams.local",
      })),
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding/data-diri/dosen");

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        role: "TEACHER",
        onboardingStep: "role",
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePathMock).toHaveBeenCalledWith("/onboarding");
  });

  it("rejects teacher-scoped demo accounts from persisting the student role", async () => {
    process.env.DEMO_MODE = "1";
    const { submitRole } = await import("../role");
    const formData = new FormData();
    formData.set("role", "mahasiswa");

    await expect(
      submitRole(formData, async () => ({
        id: "user-1",
        email: "demo.teacher.visitor1234@eduteams.local",
      })),
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding/role");

    expect(prismaMock.user.update).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("allows institutional teachers in demo mode", async () => {
    process.env.DEMO_MODE = "1";
    const { submitRole } = await import("../role");
    const formData = new FormData();
    formData.set("role", "dosen");

    await expect(
      submitRole(formData, async () => ({
        id: "user-1",
        email: "lecturer@if.itera.ac.id",
      })),
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding/data-diri/dosen");

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        role: "TEACHER",
        onboardingStep: "role",
      },
    });
  });

  it("allows institutional teachers outside demo mode", async () => {
    const { submitRole } = await import("../role");
    const formData = new FormData();
    formData.set("role", "dosen");

    await expect(
      submitRole(formData, async () => ({
        id: "user-1",
        email: "lecturer@if.itera.ac.id",
      })),
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding/data-diri/dosen");

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        role: "TEACHER",
        onboardingStep: "role",
      },
    });
  });

  it("forces non-institutional users to choose explicitly before auto-assignment in demo mode", async () => {
    process.env.DEMO_MODE = "1";
    const { autoAssignRole } = await import("../role");

    await expect(
      autoAssignRole(async () => ({
        id: "user-1",
        email: "user@example.com",
      })),
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding/role");

    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("auto-assigns institutional teachers in demo mode", async () => {
    process.env.DEMO_MODE = "1";
    const { autoAssignRole } = await import("../role");

    await expect(
      autoAssignRole(async () => ({
        id: "user-1",
        email: "lecturer@if.itera.ac.id",
      })),
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding/data-diri/dosen");

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        role: "TEACHER",
        onboardingStep: "role",
      },
    });
  });
});
