import { beforeEach, describe, expect, it, mock } from "bun:test";

const submitMock = mock();

beforeEach(() => {
  submitMock.mockReset();
  submitMock.mockImplementation(async () => ({
    status: "completed",
    durationMs: 90_000,
    attentionPassed: true,
    scores: { ei: 0.1, sn: -0.2, tf: 0.3, pj: -0.4 },
    mbtiType: "ENTP",
  }));
});

describe("POST /api/user/personality", () => {
  it("returns scores and type when submission succeeds", async () => {
    const { buildPersonalityHandler } = await import("../handler");
    const POST = buildPersonalityHandler({
      submitSession: submitMock,
      getCurrentUser: async () => ({ id: "u1" }) as any,
    });

    const req = new Request("http://localhost/api/user/personality", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId: "11111111-1111-4111-8111-111111111111",
        answers: { q1: 3 },
      }),
    });

    const res = await POST(req as any);
    const json = (await res.json()) as any;
    expect(res.status).toBe(200);
    expect(submitMock.mock.calls.length).toBe(1);
    expect(json.data.success).toBe(true);
    expect(json.data.scores.ei).toBeCloseTo(0.1);
    expect(json.data.mbtiType).toBe("ENTP");
  });

  it("returns 400 when attention check fails", async () => {
    submitMock.mockImplementationOnce(async () => ({
      status: "attention_check_failed",
      durationMs: 80_000,
      attentionPassed: false,
    }));

    const { buildPersonalityHandler } = await import("../handler");
    const POST = buildPersonalityHandler({
      submitSession: submitMock,
      getCurrentUser: async () => ({ id: "u1" }) as any,
    });

    const req = new Request("http://localhost/api/user/personality", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId: "11111111-1111-4111-8111-111111111111",
        answers: { q1: 3 },
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const json = (await res.json()) as any;
    expect(json.success).toBe(false);
  });

  it("accepts demo sandbox-authenticated users through getCurrentUser", async () => {
    const { buildPersonalityHandler } = await import("../handler");
    const POST = buildPersonalityHandler({
      submitSession: submitMock,
      getCurrentUser: async () =>
        ({
          id: "demo-student-id",
          email: "demo.student.visitor1234@eduteams.local",
        }) as any,
    });

    const req = new Request("http://localhost/api/user/personality", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId: "11111111-1111-4111-8111-111111111111",
        answers: { q1: 3 },
      }),
    });

    const res = await POST(req as any);

    expect(res.status).toBe(200);
    expect(submitMock).toHaveBeenCalledWith({
      sessionId: "11111111-1111-4111-8111-111111111111",
      userId: "demo-student-id",
      answers: { q1: 3 },
    });
  });

  it("returns 401 when getCurrentUser does not resolve a user", async () => {
    const { buildPersonalityHandler } = await import("../handler");
    const POST = buildPersonalityHandler({
      submitSession: submitMock,
      getCurrentUser: async () => null,
    });

    const req = new Request("http://localhost/api/user/personality", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId: "11111111-1111-4111-8111-111111111111",
        answers: { q1: 3 },
      }),
    });

    const res = await POST(req as any);

    expect(res.status).toBe(401);
    expect(submitMock).not.toHaveBeenCalled();
  });
});
