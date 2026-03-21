import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { getInstitutionalEmailRequiredRolePath } from "@/lib/onboarding/role-errors";

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
  beforeEach(() => {
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
  });

  it("allows institutional accounts to choose teacher", async () => {
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

  it("allows institutional students to switch back to teacher during onboarding", async () => {
    const { submitRole } = await import("../role");
    const formData = new FormData();
    formData.set("role", "dosen");

    await expect(
      submitRole(formData, async () => ({
        id: "user-1",
        email: "student@if.itera.ac.id",
        role: "STUDENT",
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

  it("redirects non-institutional teacher submissions back to role selection", async () => {
    const { submitRole } = await import("../role");
    const formData = new FormData();
    formData.set("role", "dosen");

    await expect(
      submitRole(formData, async () => ({
        id: "user-1",
        email: "person@gmail.com",
      })),
    ).rejects.toThrow(`NEXT_REDIRECT:${getInstitutionalEmailRequiredRolePath()}`);

    expect(prismaMock.user.update).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("redirects tampered role submissions back to role selection", async () => {
    const { submitRole } = await import("../role");
    const formData = new FormData();
    formData.set("role", "admin");

    await expect(
      submitRole(formData, async () => ({
        id: "user-1",
        email: "person@gmail.com",
      })),
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding/role");

    expect(prismaMock.user.update).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("still allows choosing student", async () => {
    const { submitRole } = await import("../role");
    const formData = new FormData();
    formData.set("role", "mahasiswa");

    await expect(
      submitRole(formData, async () => ({
        id: "user-1",
        email: "person@gmail.com",
      })),
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding/data-diri/mahasiswa");

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        role: "STUDENT",
        onboardingStep: "role",
      },
    });
  });
});
