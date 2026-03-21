import { afterAll, afterEach, describe, expect, it, mock } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

const submitRoleMock = mock(async () => undefined);

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
        demoLoginError: "Failed to start the demo session. Please try again.",
        institutionalEmailRequired: "Institutional email required",
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

describe("RoleFormClient", () => {
  afterEach(() => {
    submitRoleMock.mockReset();
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

  it("blocks teacher selection for non-institutional accounts", async () => {
    const { default: RoleFormClient } = await import("../role-form-client");

    render(<RoleFormClient canChooseTeacher={false} />);

    fireEvent.click(screen.getByRole("button", { name: /Choose dosen/i }));

    expect(screen.getByText("Institutional email required")).toBeInTheDocument();

    const button = screen.getByRole("button", { name: /Continue/i }) as HTMLButtonElement;
    expect(button.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(button);
    expect(submitRoleMock).not.toHaveBeenCalled();
  });

  it("shows the server-reported teacher eligibility error and lets the user recover", async () => {
    const { default: RoleFormClient } = await import("../role-form-client");

    render(<RoleFormClient canChooseTeacher={false} initialShowDosenInvalid />);

    expect(screen.getByText("Institutional email required")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Choose mahasiswa/i }));

    expect(screen.queryByText("Institutional email required")).not.toBeInTheDocument();

    const button = screen.getByRole("button", { name: /Continue/i }) as HTMLButtonElement;
    expect(button.getAttribute("aria-disabled")).toBe("false");
  });

  it("allows submitting after selecting teacher", async () => {
    const { default: RoleFormClient } = await import("../role-form-client");

    render(<RoleFormClient initialRole="dosen" />);

    const button = screen.getByRole("button", { name: /Continue/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    expect(button.getAttribute("aria-disabled")).toBe("false");
  });
});
