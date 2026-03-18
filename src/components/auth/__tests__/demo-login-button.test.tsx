import { afterEach, describe, expect, it, mock } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const actualSandboxClient = await import("@/lib/demo/sandbox-client");
const clearDemoSandboxClientStateMock = mock(() => undefined);
const originalFetch = globalThis.fetch;

mock.module("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => {
    if (key === "signingIn") {
      return "Signing in";
    }

    if (key === "tryDemo") {
      return "Try Demo";
    }

    return key;
  },
}));

mock.module("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

mock.module("@/components/ui/loading-spinner", () => ({
  LoadingSpinner: () => <span data-testid="loading-spinner" />,
}));

mock.module("@/lib/demo/sandbox-client", () => ({
  ...actualSandboxClient,
  clearDemoSandboxClientState: clearDemoSandboxClientStateMock,
}));

const { DemoLoginButton } = await import("../demo-login-button");

describe("DemoLoginButton", () => {
  afterEach(() => {
    clearDemoSandboxClientStateMock.mockReset();
    globalThis.fetch = originalFetch;
    mock.restore();
  });

  it("clears persisted sandbox state after a successful demo restart", async () => {
    globalThis.fetch = mock(
      async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: { redirectTo: "/dashboard" },
          }),
          {
            headers: { "Content-Type": "application/json" },
          },
        ),
    ) as typeof fetch;

    render(<DemoLoginButton />);

    fireEvent.click(screen.getByRole("button", { name: /try demo/i }));

    await waitFor(() => {
      expect(clearDemoSandboxClientStateMock).toHaveBeenCalledTimes(1);
    });
  });

  it("keeps persisted sandbox state when demo login does not succeed", async () => {
    globalThis.fetch = mock(
      async () =>
        new Response(
          JSON.stringify({
            success: false,
          }),
          {
            headers: { "Content-Type": "application/json" },
          },
        ),
    ) as typeof fetch;

    render(<DemoLoginButton />);

    fireEvent.click(screen.getByRole("button", { name: /try demo/i }));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });
    expect(clearDemoSandboxClientStateMock).not.toHaveBeenCalled();
  });
});
