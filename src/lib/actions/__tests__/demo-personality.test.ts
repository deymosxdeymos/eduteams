import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { createApiUtilsModule } from "@/test-utils/api-utils-module";

const actualNextCache = await import("next/cache");
const actualRouting = await import("@/i18n/routing");
const actualPrisma = await import("@/lib/prisma");

const getCurrentUserMock = mock(async () => null);
const redirectMock = mock((_args: unknown) => {
  throw new Error("NEXT_REDIRECT");
});
const revalidatePathMock = mock(() => {});

const prismaMock = {
  personalityProfile: {
    upsert: mock(async () => ({})),
  },
  user: {
    update: mock(async () => ({})),
  },
};

function applyModuleMocks() {
  mock.module("next/cache", () => ({
    ...actualNextCache,
    revalidatePath: revalidatePathMock,
  }));

  mock.module("@/i18n/routing", () => ({
    ...actualRouting,
    redirect: redirectMock,
  }));

  mock.module("@/lib/api-utils", () =>
    createApiUtilsModule({
      getCurrentUser: getCurrentUserMock,
    }),
  );

  mock.module("@/lib/prisma", () => ({
    default: prismaMock,
  }));
}

function restoreModuleMocks() {
  mock.module("next/cache", () => actualNextCache);
  mock.module("@/i18n/routing", () => actualRouting);
  mock.module("@/lib/api-utils", () => createApiUtilsModule());
  mock.module("@/lib/prisma", () => ({ default: actualPrisma.default }));
}

describe("submitDemoPersonality", () => {
  beforeEach(() => {
    process.env.DEMO_MODE = "1";

    getCurrentUserMock.mockReset();
    redirectMock.mockReset();
    revalidatePathMock.mockReset();
    prismaMock.personalityProfile.upsert.mockReset();
    prismaMock.user.update.mockReset();

    redirectMock.mockImplementation((_args: unknown) => {
      throw new Error("NEXT_REDIRECT");
    });
    prismaMock.personalityProfile.upsert.mockResolvedValue({});
    prismaMock.user.update.mockResolvedValue({});

    applyModuleMocks();
  });

  afterEach(() => {
    mock.restore();
    restoreModuleMocks();
  });

  it("redirects roleless users back to the role step", async () => {
    getCurrentUserMock.mockResolvedValue({
      id: "user-1",
      email: "demo.student.visitor1234@eduteams.local",
      role: null,
      nim: null,
      name: "Demo User",
      gender: null,
      isOnboarded: false,
    });

    const { submitDemoPersonality } = await import("../demo-personality");

    await expect(submitDemoPersonality("INFJ", "id")).rejects.toThrow("NEXT_REDIRECT");

    expect(redirectMock).toHaveBeenCalledWith({
      href: "/onboarding/role",
      locale: "id",
    });
    expect(prismaMock.personalityProfile.upsert).not.toHaveBeenCalled();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("redirects incomplete students back to data diri before onboarding completion", async () => {
    getCurrentUserMock.mockResolvedValue({
      id: "user-1",
      email: "demo.student.visitor1234@eduteams.local",
      role: "STUDENT",
      nim: null,
      name: "Demo Student",
      gender: "MALE",
      isOnboarded: false,
    });

    const { submitDemoPersonality } = await import("../demo-personality");

    await expect(submitDemoPersonality("INFJ", "id")).rejects.toThrow("NEXT_REDIRECT");

    expect(redirectMock).toHaveBeenCalledWith({
      href: "/onboarding/data-diri/mahasiswa",
      locale: "id",
    });
    expect(prismaMock.personalityProfile.upsert).not.toHaveBeenCalled();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("rejects non-demo authenticated users even when demo mode is enabled", async () => {
    getCurrentUserMock.mockResolvedValue({
      id: "user-1",
      email: "student@example.com",
      role: "STUDENT",
      nim: "20260001",
      name: "Student User",
      gender: "MALE",
      isOnboarded: false,
    });

    const { submitDemoPersonality } = await import("../demo-personality");

    await expect(submitDemoPersonality("INFJ", "id")).rejects.toThrow("Demo account required");

    expect(prismaMock.personalityProfile.upsert).not.toHaveBeenCalled();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("only marks eligible students as onboarded and clears the onboarding step", async () => {
    getCurrentUserMock.mockResolvedValue({
      id: "user-1",
      email: "demo.student.visitor1234@eduteams.local",
      role: "STUDENT",
      nim: "20260001",
      name: "Demo Student",
      gender: "MALE",
      isOnboarded: false,
    });

    const { submitDemoPersonality } = await import("../demo-personality");

    await expect(submitDemoPersonality("INFJ", "en")).rejects.toThrow("NEXT_REDIRECT");

    expect(prismaMock.personalityProfile.upsert).toHaveBeenCalled();
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        isOnboarded: true,
        onboardingStep: null,
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePathMock).toHaveBeenCalledWith("/en/dashboard");
    expect(redirectMock).toHaveBeenCalledWith({
      href: "/dashboard?firstVisit=true",
      locale: "en",
    });
  });
});
