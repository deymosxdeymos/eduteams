import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";

const actualRouting = await import("@/i18n/routing");
const originalDemoMode = process.env.DEMO_MODE;

const protectOnboardingPageMock = mock(async () => ({
  id: "demo-user",
  email: "demo.student.visitor1234@eduteams.local",
  role: "STUDENT",
  nim: "20260001",
  name: "Demo Student",
  gender: "MALE",
  isOnboarded: false,
}));
const redirectMock = mock((_args: unknown) => {
  throw new Error("NEXT_REDIRECT");
});
const ensurePersonalitySessionMock = mock(async () => ({
  sessionId: "session-1",
  bankVersion: 1,
  questions: [],
}));

mock.module("@/lib/server-auth", () => ({
  protectOnboardingPage: protectOnboardingPageMock,
}));

mock.module("@/i18n/routing", () => ({
  ...actualRouting,
  redirect: redirectMock,
}));

mock.module("@/lib/actions/personality", () => ({
  ensurePersonalitySession: ensurePersonalitySessionMock,
}));

mock.module("@/lib/authorization", () => ({
  needsDataDiri: (user: any) => {
    if (user.role === "STUDENT") {
      return !user.nim;
    }

    if (user.role === "TEACHER") {
      return !user.name || !user.gender;
    }

    return false;
  },
}));

mock.module("@/components/onboarding/kepribadian/demo-personality-picker", () => ({
  DemoPersonalityPicker: () => <div data-testid="demo-personality-picker" />,
}));

mock.module("@/components/onboarding/kepribadian/personality-test-client", () => ({
  default: () => <div data-testid="personality-test-client" />,
}));

describe("KepribadianPage", () => {
  beforeEach(() => {
    process.env.DEMO_MODE = "1";
    protectOnboardingPageMock.mockReset();
    redirectMock.mockReset();
    ensurePersonalitySessionMock.mockReset();

    protectOnboardingPageMock.mockResolvedValue({
      id: "demo-user",
      email: "demo.student.visitor1234@eduteams.local",
      role: "STUDENT",
      nim: "20260001",
      name: "Demo Student",
      gender: "MALE",
      isOnboarded: false,
    });
    redirectMock.mockImplementation((_args: unknown) => {
      throw new Error("NEXT_REDIRECT");
    });
    ensurePersonalitySessionMock.mockResolvedValue({
      sessionId: "session-1",
      bankVersion: 1,
      questions: [],
    });
  });

  afterEach(() => {
    if (originalDemoMode === undefined) {
      delete process.env.DEMO_MODE;
      return;
    }

    process.env.DEMO_MODE = originalDemoMode;
  });

  it("redirects roleless demo users back to the role step", async () => {
    protectOnboardingPageMock.mockResolvedValue({
      id: "demo-user",
      email: "demo.student.visitor1234@eduteams.local",
      role: null,
      nim: null,
      name: "Demo User",
      gender: null,
      isOnboarded: false,
    });

    const { default: KepribadianPage } = await import("../page");

    await expect(KepribadianPage({ params: Promise.resolve({ locale: "id" }) })).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(redirectMock).toHaveBeenCalledWith({
      href: "/onboarding/role",
      locale: "id",
    });
  });

  it("redirects demo students with incomplete data diri back to the data diri step", async () => {
    protectOnboardingPageMock.mockResolvedValue({
      id: "demo-user",
      email: "demo.student.visitor1234@eduteams.local",
      role: "STUDENT",
      nim: null,
      name: "Demo Student",
      gender: "MALE",
      isOnboarded: false,
    });

    const { default: KepribadianPage } = await import("../page");

    await expect(KepribadianPage({ params: Promise.resolve({ locale: "id" }) })).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(redirectMock).toHaveBeenCalledWith({
      href: "/onboarding/data-diri/mahasiswa",
      locale: "id",
    });
  });

  it("renders the real personality test for non-demo users even when demo mode is enabled", async () => {
    protectOnboardingPageMock.mockResolvedValue({
      id: "real-user",
      email: "student@example.com",
      role: "STUDENT",
      nim: "20260001",
      name: "Real Student",
      gender: "MALE",
      isOnboarded: false,
    });

    const { default: KepribadianPage } = await import("../page");

    render(await KepribadianPage({ params: Promise.resolve({ locale: "id" }) }));

    expect(screen.getByTestId("personality-test-client")).toBeTruthy();
    expect(screen.queryByTestId("demo-personality-picker")).toBeNull();
    expect(ensurePersonalitySessionMock).toHaveBeenCalledWith("id");
  });

  it("renders the demo personality picker only for eligible demo students", async () => {
    const { default: KepribadianPage } = await import("../page");

    render(await KepribadianPage({ params: Promise.resolve({ locale: "id" }) }));

    expect(screen.getByTestId("demo-personality-picker")).toBeTruthy();
    expect(ensurePersonalitySessionMock).not.toHaveBeenCalled();
  });
});
