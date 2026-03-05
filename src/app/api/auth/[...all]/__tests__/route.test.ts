import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';

const getHandlerMock = mock(async () => new Response('ok'));
const postHandlerMock = mock(async () => new Response('delegated'));
const shouldBlockPublicDemoCredentialAuthMock = mock(() => false);

function importRouteModule() {
  return import(`../route?test=${Math.random()}`);
}

function applyModuleMocks() {
  mock.module('better-auth/next-js', () => ({
    toNextJsHandler: () => ({
      GET: getHandlerMock,
      POST: postHandlerMock,
    }),
  }));

  mock.module('@/lib/auth', () => ({
    auth: {},
    shouldBlockPublicDemoCredentialAuth: shouldBlockPublicDemoCredentialAuthMock,
  }));
}

describe.serial('/api/auth/[...all]', () => {
  beforeEach(() => {
    getHandlerMock.mockReset();
    postHandlerMock.mockReset();
    shouldBlockPublicDemoCredentialAuthMock.mockReset();

    getHandlerMock.mockResolvedValue(new Response('ok'));
    postHandlerMock.mockResolvedValue(new Response('delegated'));
    shouldBlockPublicDemoCredentialAuthMock.mockReturnValue(false);

    applyModuleMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  it('returns 404 for public credential auth posts in demo mode', async () => {
    shouldBlockPublicDemoCredentialAuthMock.mockReturnValue(true);

    const { POST } = await importRouteModule();
    const request = new Request('http://localhost:3000/api/auth/sign-in/email', {
      method: 'POST',
    }) as Parameters<typeof POST>[0];
    const response = await POST(request);

    expect(response.status).toBe(404);
    expect(postHandlerMock).not.toHaveBeenCalled();
  });

  it('delegates non-blocked posts to Better Auth', async () => {
    const { POST } = await importRouteModule();
    const request = new Request('http://localhost:3000/api/auth/sign-in/social', {
      method: 'POST',
    }) as Parameters<typeof POST>[0];
    const response = await POST(request);

    expect(await response.text()).toBe('delegated');
    expect(shouldBlockPublicDemoCredentialAuthMock).toHaveBeenCalledWith(request);
    expect(postHandlerMock).toHaveBeenCalledWith(request);
  });

  it('passes GET requests through unchanged', async () => {
    const { GET } = await importRouteModule();
    const request = new Request('http://localhost:3000/api/auth/session') as Parameters<
      typeof GET
    >[0];
    const response = await GET(request);

    expect(await response.text()).toBe('ok');
    expect(getHandlerMock).toHaveBeenCalledWith(request);
  });
});
