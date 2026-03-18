import { afterAll, afterEach, describe, expect, it, mock } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const submitRoleMock = mock(async () => undefined);
const clearDemoSandboxClientStateMock = mock(() => undefined);
const originalFetch = globalThis.fetch;

function stripMotionProps(props: Record<string, unknown>) {
  const {
    animate: _animate,
    transition: _transition,
    whileHover: _whileHover,
    whileTap: _whileTap,
    ...rest
  } = props;

  return rest;
}

mock.module("framer-motion", () => ({
  motion: {
    div: (props: any) => <div {...stripMotionProps(props)} />,
    button: (props: any) => <button {...stripMotionProps(props)} />,
  },
}));

mock.module("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) =>
    (
      ({
        continue: "Continue",
        loading: "Loading...",
        institutionalEmailRequired: "Institutional email required",
        demoLoginError: "Failed to start the demo session. Please try again.",
      }) as Record<string, string>
    )[key] ?? key,
}));

mock.module("@/components/onboarding/role/role-select", () => ({
  default: ({ onRoleSelect, showDosenInvalid }: any) => (
    <div>
      <button type="button" onClick={() => onRoleSelect("dosen")}>
        Choose dosen
      </button>
      <button type="button" onClick={() => onRoleSelect("mahasiswa")}>
        Choose mahasiswa
      </button>
      {showDosenInvalid ? <span>Institutional email required</span> : null}
    </div>
  ),
}));

mock.module("@/components/ui/button", () => ({
  Button: ({ children, variant: _variant, size: _size, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

mock.module("@/components/ui/loading-spinner", () => ({
  LoadingSpinner: () => <span data-testid="spinner" />,
}));

mock.module("@/lib/actions/role", () => ({
  submitRole: submitRoleMock,
}));

mock.module("@/lib/demo/sandbox-client", () => ({
  clearDemoSandboxClientState: clearDemoSandboxClientStateMock,
}));

describe("RoleFormClient", () => {
  afterEach(() => {
    submitRoleMock.mockReset();
    clearDemoSandboxClientStateMock.mockReset();
    globalThis.fetch = originalFetch;
  });

  afterAll(() => {
    mock.restore();
  });

  it("keeps the blocked submit button clickable before a role is selected", async () => {
    const { default: RoleFormClient } = await import("../role-form-client");

    render(<RoleFormClient />);

    const button = screen.getByRole("button", { name: /Continue/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    expect(button.getAttribute("aria-disabled")).toBe("true");

    fireEvent.click(button);
    expect(submitRoleMock).not.toHaveBeenCalled();
  });

  it("keeps the blocked teacher submit button clickable without an institutional email", async () => {
    const { default: RoleFormClient } = await import("../role-form-client");

    render(<RoleFormClient initialRole="dosen" hasInstitutionalEmail={false} />);

    const button = screen.getByRole("button", { name: /Continue/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    expect(button.getAttribute("aria-disabled")).toBe("true");

    fireEvent.click(button);
    expect(submitRoleMock).not.toHaveBeenCalled();
  });

  it("clears demo sandbox client state after a successful demo onboarding login", async () => {
    globalThis.fetch = mock(
      async () =>
        new Response(
          JSON.stringify({
            success: true,
          }),
          {
            headers: { "Content-Type": "application/json" },
          },
        ),
    ) as typeof fetch;

    const { default: RoleFormClient } = await import("../role-form-client");

    render(<RoleFormClient enableDemoLogin />);

    fireEvent.click(screen.getByRole("button", { name: /choose mahasiswa/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      expect(clearDemoSandboxClientStateMock).toHaveBeenCalledTimes(1);
      expect(submitRoleMock).toHaveBeenCalledTimes(1);
    });
  });

  it("shows an error when demo onboarding login returns a non-ok response", async () => {
    globalThis.fetch = mock(
      async () =>
        new Response(
          JSON.stringify({
            success: false,
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          },
        ),
    ) as typeof fetch;

    const { default: RoleFormClient } = await import("../role-form-client");

    render(<RoleFormClient enableDemoLogin />);

    fireEvent.click(screen.getByRole("button", { name: /choose mahasiswa/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(
      await screen.findByText("Failed to start the demo session. Please try again."),
    ).toBeTruthy();
    expect(submitRoleMock).not.toHaveBeenCalled();
    expect(clearDemoSandboxClientStateMock).not.toHaveBeenCalled();
  });

  it("shows an error when demo onboarding login returns invalid JSON", async () => {
    globalThis.fetch = mock(
      async () =>
        new Response("Service unavailable", {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        }),
    ) as typeof fetch;

    const { default: RoleFormClient } = await import("../role-form-client");

    render(<RoleFormClient enableDemoLogin />);

    fireEvent.click(screen.getByRole("button", { name: /choose mahasiswa/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(
      await screen.findByText("Failed to start the demo session. Please try again."),
    ).toBeTruthy();
    expect(submitRoleMock).not.toHaveBeenCalled();
    expect(clearDemoSandboxClientStateMock).not.toHaveBeenCalled();
  });
});
