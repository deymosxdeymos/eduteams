import { describe, expect, it, mock } from 'bun:test';

const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({
      id: 'u1',
      name: 'User',
      nim: '123',
      role: 'mahasiswa',
      gender: 'MALE',
    })),
    update: mock(async () => ({})),
  },
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

describe('user/data-diri API', () => {
  it('GET returns mapped user fields', async () => {
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));
    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/user/data-diri') as any,
      undefined as any
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data.jenisKelamin).toBe('laki-laki');
    expect(json.data.role).toBe('mahasiswa');
  });

  it('POST updates user and requires role-specific fields', async () => {
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));
    const { POST } = await import('../route');
    const reqOk = new Request('http://localhost/api/user/data-diri', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        namaLengkap: 'U',
        jenisKelamin: 'laki-laki',
        role: 'dosen',
        npm: 'X',
      }),
    });
    const resOk = await POST(reqOk as any, undefined as any);
    expect(resOk.status).toBe(200);

    const reqFail = new Request('http://localhost/api/user/data-diri', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        namaLengkap: 'U',
        jenisKelamin: 'perempuan',
        role: 'mahasiswa',
      }),
    });
    const resFail = await POST(reqFail as any, undefined as any);
    expect(resFail.status).toBe(400);
  });
});
