import { describe, expect, it } from "bun:test";
import { shouldBlockSmallScreenRequest } from "@/lib/request-device";

describe("shouldBlockSmallScreenRequest", () => {
  it("blocks narrow viewport hints before checking device heuristics", () => {
    const requestHeaders = new Headers({
      "sec-ch-ua-mobile": "?0",
      "viewport-width": "768",
    });

    expect(shouldBlockSmallScreenRequest(requestHeaders)).toBe(true);
  });

  it("blocks explicit mobile client hints", () => {
    const requestHeaders = new Headers({
      "sec-ch-ua-mobile": "?1",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36",
    });

    expect(shouldBlockSmallScreenRequest(requestHeaders)).toBe(true);
  });

  it("blocks tablet user agents when viewport hints are unavailable", () => {
    const requestHeaders = new Headers({
      "user-agent":
        "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1",
    });

    expect(shouldBlockSmallScreenRequest(requestHeaders)).toBe(true);
  });

  it("allows desktop requests without small-screen signals", () => {
    const requestHeaders = new Headers({
      "sec-ch-ua-mobile": "?0",
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36",
    });

    expect(shouldBlockSmallScreenRequest(requestHeaders)).toBe(false);
  });
});
