import { afterAll, afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { getInstitutionalEmailRequiredRolePath } from "@/lib/onboarding/role-errors";

const actualRouting = await import("@/i18n/routing");
const actualServerAuth = await import("@/lib/server-auth");

const getTranslationsMock = mock(async () => (key: string) => key);
const protectOnboardingPageMock = mock(async () => ({
  id: "demo-user",
  email: "demo.student.visitor1234@eduteams.local",
  role: null,
  nim: null,
}));
const getDataDiriMock = mock(async () => ({
  namaLengkap: "Saved Demo User",
  nim: "20250001",
  jenisKelamin: "laki-laki",
  role: "STUDENT",
}));
const redirectMock = mock(() => {
  throw new Error("unexpected redirect");
});
const getUserPersonalitySessionStatusMock = mock(async () => null);

mock.module("next-intl/server", () => ({
  getTranslations: getTranslationsMock,
}));

mock.module("@/lib/server-auth", () => ({
  ...actualServerAuth,
  protectOnboardingPage: protectOnboardingPageMock,
}));

mock.module("@/lib/actions/data-diri", () => ({
  getDataDiri: getDataDiriMock,
}));

mock.module("@/i18n/routing", () => ({
  ...actualRouting,
  redirect: redirectMock,
}));

mock.module("@/lib/personality-session", () => ({
  getUserPersonalitySessionStatus: getUserPersonalitySessionStatusMock,
}));

mock.module("@/components/onboarding/data-diri/data-diri-form-client", () => ({
  default: ({ role, initialData }: any) => (
    <div data-testid="data-diri-form" data-role={role} data-initial={JSON.stringify(initialData)} />
  ),
}));

mock.module("@/components/logo", () => ({
  default: () => <div data-testid="logo" />,
}));

mock.module("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

mock.module("next/image", () => ({
  default: ({ alt }: any) => <div aria-label={alt} />,
}));

mock.module("next/link", () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

afterAll(() => {
  mock.restore();
});

describe("DataDiriPage", () => {
  beforeEach(() => {
    getTranslationsMock.mockReset();
    protectOnboardingPageMock.mockReset();
    getDataDiriMock.mockReset();
    redirectMock.mockReset();
    getUserPersonalitySessionStatusMock.mockReset();

    getTranslationsMock.mockResolvedValue((key: string) => key);
    protectOnboardingPageMock.mockResolvedValue({
      id: "user-1",
      email: "student@example.com",
      role: null,
      nim: null,
    });
    getDataDiriMock.mockResolvedValue({
      namaLengkap: "Test User",
      nim: "20250001",
      jenisKelamin: "laki-laki",
      role: "STUDENT",
    });
    redirectMock.mockImplementation(() => {
      throw new Error("unexpected redirect");
    });
    getUserPersonalitySessionStatusMock.mockResolvedValue(null);
  });

  afterEach(() => {
    mock.restore();
  });

  it("redirects non-institutional users away from direct teacher onboarding", async () => {
    protectOnboardingPageMock.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      role: null,
      nim: null,
    });
    redirectMock.mockImplementation(({ href }: { href: string }) => {
      throw new Error(`NEXT_REDIRECT:${href}`);
    });

    const { default: DataDiriPage } = await import("../page");

    await expect(
      DataDiriPage({
        params: Promise.resolve({ locale: "id", role: "dosen" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow(`NEXT_REDIRECT:${getInstitutionalEmailRequiredRolePath()}`);

    expect(getDataDiriMock).not.toHaveBeenCalled();
  });

  it("allows teacher onboarding for eligible institutional users", async () => {
    protectOnboardingPageMock.mockResolvedValue({
      id: "user-1",
      email: "lecturer@if.itera.ac.id",
      role: null,
      nim: null,
    });

    const { default: DataDiriPage } = await import("../page");

    const element = await DataDiriPage({
      params: Promise.resolve({ locale: "id", role: "dosen" }),
      searchParams: Promise.resolve({}),
    });

    expect(element).toBeTruthy();
    expect(getDataDiriMock).toHaveBeenCalled();
  });
});
