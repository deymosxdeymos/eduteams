import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { GET } from "../route";

describe("GET /api/edu2com/weights", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return default weights when no env vars are set", async () => {
    delete process.env.EDU2COM_ALPHA_WEIGHT;
    delete process.env.EDU2COM_BETA_WEIGHT;
    delete process.env.EDU2COM_DELTA_WEIGHT;

    const response = await GET();
    const data = await response.json();

    expect(data).toEqual({
      alpha: 0.4,
      beta: 0.3,
      delta: 0.1,
    });
  });

  it("should return env-based weights when env vars are set", async () => {
    process.env.EDU2COM_ALPHA_WEIGHT = "0.5";
    process.env.EDU2COM_BETA_WEIGHT = "0.25";
    process.env.EDU2COM_DELTA_WEIGHT = "0.15";

    const response = await GET();
    const data = await response.json();

    expect(data).toEqual({
      alpha: 0.5,
      beta: 0.25,
      delta: 0.15,
    });
  });

  it("should not include gamma (student preferences) in response", async () => {
    const response = await GET();
    const data = await response.json();

    expect(data).not.toHaveProperty("gamma");
    expect(Object.keys(data)).toEqual(["alpha", "beta", "delta"]);
  });
});
