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
    findUnique: mock(async () => null),
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

function createMahasiswaFormData() {
  const formData = new FormData();
  formData.set("namaLengkap", "Bagas Pratama");
  formData.set("nim", "20260001");
  formData.set("jenisKelamin", "laki-laki");
  formData.set("role", "mahasiswa");
  return formData;
}

function createDosenFormData() {
  const formData = new FormData();
  formData.set("namaLengkap", "Dr. Rina Wijaya");
  formData.set("jenisKelamin", "perempuan");
  formData.set("role", "dosen");
  return formData;
}

describe("data diri actions", () => {
  const originalDemoMode = process.env.DEMO_MODE;

  beforeEach(() => {
    process.env.DEMO_MODE = "1";
    redirectMock.mockReset();
    revalidatePathMock.mockReset();
    prismaMock.user.update.mockReset();
    prismaMock.user.findUnique.mockReset();

    redirectMock.mockImplementation((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    });
    prismaMock.user.update.mockResolvedValue({});
    prismaMock.user.findUnique.mockResolvedValue(null);

    applyModuleMocks();
  });

  afterEach(() => {
    mock.restore();
    restoreModuleMocks();

    if (originalDemoMode === undefined) {
      delete process.env.DEMO_MODE;
      return;
    }

    process.env.DEMO_MODE = originalDemoMode;
  });

  it("rejects student-scoped demo accounts from submitting teacher data diri", async () => {
    const { submitDataDiri } = await import("../data-diri");

    await expect(
      submitDataDiri(createDosenFormData(), async () => ({
        id: "demo-student",
        email: "demo.student.visitor1234@eduteams.local",
      })),
    ).rejects.toMatchObject({
      status: 403,
      code: "AUTHORIZATION_ERROR",
    });

    expect(prismaMock.user.update).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("allows teacher-scoped demo accounts to complete the teacher data diri flow", async () => {
    const { submitDataDiri } = await import("../data-diri");

    await expect(
      submitDataDiri(createDosenFormData(), async () => ({
        id: "demo-teacher",
        email: "demo.teacher.visitor1234@eduteams.local",
      })),
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard?firstVisit=true");

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "demo-teacher" },
      data: {
        name: "Dr. Rina Wijaya",
        nim: null,
        role: "TEACHER",
        gender: "FEMALE",
        isOnboarded: true,
        onboardingStep: null,
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePathMock).toHaveBeenCalledWith("/onboarding");
  });

  it("still allows student-scoped demo accounts to submit student data diri", async () => {
    const { submitDataDiri } = await import("../data-diri");

    await expect(
      submitDataDiri(createMahasiswaFormData(), async () => ({
        id: "demo-student",
        email: "demo.student.visitor1234@eduteams.local",
      })),
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding/kepribadian");

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "demo-student" },
      data: {
        name: "Bagas Pratama",
        nim: "20260001",
        role: "STUDENT",
        gender: "MALE",
        isOnboarded: false,
        onboardingStep: "kepribadian",
      },
    });
  });
});
