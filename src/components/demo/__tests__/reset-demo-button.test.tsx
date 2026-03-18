import { afterEach, describe, expect, it, mock } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

const clearDemoSandboxClientStateMock = mock(() => undefined);

mock.module("next-intl", () => ({
  useLocale: () => "id",
  useTranslations: () => (key: string) => key,
}));

mock.module("@/lib/demo/sandbox-client", () => ({
  clearDemoSandboxClientState: clearDemoSandboxClientStateMock,
}));

const { DemoResetButton } = await import("../reset-demo-button");

describe("DemoResetButton", () => {
  afterEach(() => {
    clearDemoSandboxClientStateMock.mockReset();
    mock.restore();
  });

  it("surfaces reset failures without clearing client state", async () => {
    const fetchMock = mock(async () => new Response(null, { status: 500 })) as typeof fetch;
    globalThis.fetch = fetchMock;

    render(<DemoResetButton />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /reset demo/i,
      }),
    );

    const alert = await screen.findByRole("alert");

    expect(alert.textContent).toBe("Failed to reset demo. Please try again.");
    expect(clearDemoSandboxClientStateMock).not.toHaveBeenCalled();
  });
});
