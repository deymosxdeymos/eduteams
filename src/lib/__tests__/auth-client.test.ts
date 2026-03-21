import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

const actualBetterAuthReact = await import("better-auth/react");

const createAuthClientMock = mock(() => ({}));

describe("auth client configuration", () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    createAuthClientMock.mockReset();
    createAuthClientMock.mockReturnValue({});

    mock.module("better-auth/react", () => ({
      createAuthClient: createAuthClientMock,
    }));
  });

  afterEach(() => {
    if (originalAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    }

    mock.restore();
    mock.module("better-auth/react", () => actualBetterAuthReact);
  });

  it("uses the current origin instead of a separate auth base URL env var", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://different-origin.example.com";

    await import(`../auth-client?auth-client=${Date.now()}`);

    expect(createAuthClientMock).toHaveBeenCalledTimes(1);
    expect(createAuthClientMock).toHaveBeenCalledWith();
  });
});
