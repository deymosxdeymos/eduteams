import { describe, expect, it, mock } from 'bun:test';

mock.module('@/lib/csrf', () => ({ isSameOrigin: () => true }));

const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({
      id: 'u1',
      role: 'TEACHER',
      isOnboarded: true,
    })),
  },
  course: {
    findFirst: mock(async (args: any) =>
      args?.where?.id === 'c1' && args?.where?.dosenId === 'u1'
        ? {
            id: 'c1',
            shareToken: null,
            namaMataKuliah: 'Algoritma',
            kelas: 'RA',
          }
        : null
    ),
    update: mock(async (args: any) => ({
      id: args.where.id,
      shareToken: args.data.shareToken,
    })),
  },
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

describe('courses/[id]/share-token API', () => {
  it('GET generates token if missing and returns shareUrl', async () => {
    (process as any).env.NEXT_PUBLIC_APP_URL = 'http://app.local';
    mock.module('@paralleldrive/cuid2', () => ({ createId: () => 'tok-1' }));
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));
    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/courses/c1/share-token') as any,
      { params: Promise.resolve({ id: 'c1' }) } as any
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data.token).toBe('tok-1');
    expect(json.data.shareUrl).toBe('http://app.local/join-class/tok-1');
  });

  it('POST regenerates token', async () => {
    (process as any).env.NEXT_PUBLIC_APP_URL = 'http://app.local';
    mock.module('@paralleldrive/cuid2', () => ({ createId: () => 'tok-2' }));
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/courses/c1/share-token', {
      method: 'POST',
      headers: { 'x-forwarded-host': 'localhost' },
    });
    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'c1' }) } as any
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data.token).toBe('tok-2');
    expect(json.data.shareUrl).toBe('http://app.local/join-class/tok-2');
  });
});
