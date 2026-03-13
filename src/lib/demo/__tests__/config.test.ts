import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { isDemoModeEnabled } from "../config";

const originalDemoMode = process.env.DEMO_MODE;

describe("demo config", () => {
  beforeEach(() => {
    delete process.env.DEMO_MODE;
  });

  afterEach(() => {
    if (originalDemoMode === undefined) {
      delete process.env.DEMO_MODE;
    } else {
      process.env.DEMO_MODE = originalDemoMode;
    }
  });

  it("disables demo mode by default", () => {
    expect(isDemoModeEnabled()).toBe(false);
  });

  it("enables demo mode when the flag is set", () => {
    process.env.DEMO_MODE = "1";

    expect(isDemoModeEnabled()).toBe(true);
  });
});
