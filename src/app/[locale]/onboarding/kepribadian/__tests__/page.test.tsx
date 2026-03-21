import { afterAll, afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";

const actualRouting = await import("@/i18n/routing");
const actualServerAuth = await import("@/lib/server-auth");
const actualAuthorization = await import("@/lib/authorization");

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
  ...actualServerAuth,
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
  ...actualAuthorization,
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

mock.module("@/components/onboarding/kepribadian/personality-test-client", () => ({
  default: () => <div data-testid="personality-test-client" />,
}));

afterAll(() => {
  mock.restore();
});

describe("KepribadianPage", () => {
  beforeEach(() => {
    protectOnboardingPageMock.mockReset();
    redirectMock.mockReset();
    ensurePersonalitySessionMock.mockReset();

    protectOnboardingPageMock.mockResolvedValue({
      id: "user-1",
      email: "student@example.com",
      role: "STUDENT",
      nim: "20260001",
      name: "Test Student",
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
    mock.restore();
  });

  it("renders the personality test for users", async () => {
    const { default: KepribadianPage } = await import("../page");

    render(await KepribadianPage({ params: Promise.resolve({ locale: "id" }) }));

    expect(screen.getByTestId("personality-test-client")).toBeTruthy();
    expect(ensurePersonalitySessionMock).toHaveBeenCalledWith("id");
  });
});
