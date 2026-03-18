import { afterAll, afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";

const actualRouting = await import("@/i18n/routing");
const actualServerAuth = await import("@/lib/server-auth");
const originalDemoMode = process.env.DEMO_MODE;

const getTranslationsMock = mock(async () => (key: string) => key);
const protectOnboardingPageMock = mock(async () => ({
  id: "demo-user",
  email: "demo.student.visitor1234@eduteams.local",
  role: "STUDENT",
  nim: "20250001",
}));
const getDataDiriMock = mock(async () => ({
  namaLengkap: "Saved Demo User",
  nim: "20250001",
  jenisKelamin: "laki-laki",
  role: "STUDENT",
}));
const isInstitutionalEmailMock = mock(() => true);
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

mock.module("@/lib/email", () => ({
  isInstitutionalEmail: isInstitutionalEmailMock,
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
    process.env.DEMO_MODE = "1";
    getTranslationsMock.mockReset();
    protectOnboardingPageMock.mockReset();
    getDataDiriMock.mockReset();
    isInstitutionalEmailMock.mockReset();
    redirectMock.mockReset();
    getUserPersonalitySessionStatusMock.mockReset();

    getTranslationsMock.mockResolvedValue((key: string) => key);
    protectOnboardingPageMock.mockResolvedValue({
      id: "demo-user",
      email: "demo.student.visitor1234@eduteams.local",
      role: "STUDENT",
      nim: "20250001",
    });
    getDataDiriMock.mockResolvedValue({
      namaLengkap: "Saved Demo User",
      nim: "20250001",
      jenisKelamin: "laki-laki",
      role: "STUDENT",
    });
    isInstitutionalEmailMock.mockReturnValue(true);
    redirectMock.mockImplementation(() => {
      throw new Error("unexpected redirect");
    });
    getUserPersonalitySessionStatusMock.mockResolvedValue(null);
  });

  afterEach(() => {
    if (originalDemoMode === undefined) {
      delete process.env.DEMO_MODE;
      return;
    }

    process.env.DEMO_MODE = originalDemoMode;
  });

  it("still enforces teacher email validation for non-demo users when demo mode is enabled", async () => {
    protectOnboardingPageMock.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      role: null,
      nim: null,
    });
    isInstitutionalEmailMock.mockReturnValue(false);
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    const { default: DataDiriPage } = await import("../page");

    await expect(
      DataDiriPage({
        params: Promise.resolve({ locale: "id", role: "dosen" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(isInstitutionalEmailMock).toHaveBeenCalledWith("user@example.com");
    expect(redirectMock).toHaveBeenCalledWith({
      href: "/onboarding/role?err=dosen_email",
      locale: "id",
    });
    expect(getDataDiriMock).not.toHaveBeenCalled();
  });

  it("redirects student-scoped demo accounts away from the teacher form", async () => {
    protectOnboardingPageMock.mockResolvedValue({
      id: "demo-user",
      email: "demo.student.visitor1234@eduteams.local",
      role: null,
      nim: null,
    });
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    const { default: DataDiriPage } = await import("../page");

    await expect(
      DataDiriPage({
        params: Promise.resolve({ locale: "id", role: "dosen" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirectMock).toHaveBeenCalledWith({
      href: "/onboarding/data-diri/mahasiswa",
      locale: "id",
    });
    expect(getDataDiriMock).not.toHaveBeenCalled();
  });

  it("prefills demo revisit/edit flow with persisted saved data", async () => {
    const { default: DataDiriPage } = await import("../page");

    render(
      await DataDiriPage({
        params: Promise.resolve({ locale: "id", role: "mahasiswa" }),
        searchParams: Promise.resolve({ edit: "true" }),
      }),
    );

    const initialData = JSON.parse(
      screen.getByTestId("data-diri-form").getAttribute("data-initial") ?? "{}",
    );

    expect(getDataDiriMock).toHaveBeenCalled();
    expect(initialData).toEqual({
      namaLengkap: "Saved Demo User",
      nim: "20250001",
      jenisKelamin: "laki-laki",
      role: "STUDENT",
    });
  });

  it("fills missing demo fields from defaults when the saved profile is partial", async () => {
    getDataDiriMock.mockResolvedValue({
      namaLengkap: "",
      nim: "",
      jenisKelamin: "",
      role: "",
    });

    const { default: DataDiriPage } = await import("../page");

    render(
      await DataDiriPage({
        params: Promise.resolve({ locale: "id", role: "mahasiswa" }),
        searchParams: Promise.resolve({ edit: "true" }),
      }),
    );

    const initialData = JSON.parse(
      screen.getByTestId("data-diri-form").getAttribute("data-initial") ?? "{}",
    );

    expect(initialData).toEqual({
      namaLengkap: "Bagas Pratama",
      nim: "20260001",
      jenisKelamin: "laki-laki",
      role: "mahasiswa",
    });
  });

  it("falls back to demo defaults when the saved profile cannot be loaded", async () => {
    getDataDiriMock.mockRejectedValue(new Error("missing profile"));

    const { default: DataDiriPage } = await import("../page");

    render(
      await DataDiriPage({
        params: Promise.resolve({ locale: "id", role: "mahasiswa" }),
        searchParams: Promise.resolve({ edit: "true" }),
      }),
    );

    const initialData = JSON.parse(
      screen.getByTestId("data-diri-form").getAttribute("data-initial") ?? "{}",
    );

    expect(getDataDiriMock).toHaveBeenCalled();
    expect(initialData).toEqual({
      namaLengkap: "Bagas Pratama",
      nim: "20260001",
      jenisKelamin: "laki-laki",
      role: "mahasiswa",
    });
  });
});
