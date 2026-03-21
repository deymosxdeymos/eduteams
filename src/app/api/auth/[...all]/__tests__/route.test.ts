import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

const getHandlerMock = mock(async () => new Response("ok"));
const postHandlerMock = mock(async () => new Response("delegated"));

function importRouteModule() {
  return import(`../route?test=${Math.random()}`);
}

function applyModuleMocks() {
  mock.module("better-auth/next-js", () => ({
    toNextJsHandler: () => ({
      GET: getHandlerMock,
      POST: postHandlerMock,
    }),
  }));

  mock.module("@/lib/auth", () => ({
    getAuth: () => ({}),
  }));
}

describe("/api/auth/[...all]", () => {
  beforeEach(() => {
    getHandlerMock.mockReset();
    postHandlerMock.mockReset();

    getHandlerMock.mockResolvedValue(new Response("ok"));
    postHandlerMock.mockResolvedValue(new Response("delegated"));

    applyModuleMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  it("delegates posts to Better Auth", async () => {
    const { POST } = await importRouteModule();
    const request = new Request("http://localhost:3000/api/auth/sign-in/social", {
      method: "POST",
    }) as Parameters<typeof POST>[0];
    const response = await POST(request);

    expect(await response.text()).toBe("delegated");
    expect(postHandlerMock).toHaveBeenCalledWith(request);
  });

  it("passes GET requests through unchanged", async () => {
    const { GET } = await importRouteModule();
    const request = new Request("http://localhost:3000/api/auth/get-session") as Parameters<
      typeof GET
    >[0];
    const response = await GET(request);

    expect(await response.text()).toBe("ok");
    expect(getHandlerMock).toHaveBeenCalledWith(request);
  });
});
