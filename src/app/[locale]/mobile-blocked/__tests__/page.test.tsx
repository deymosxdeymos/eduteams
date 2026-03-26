import { describe, expect, it, mock } from "bun:test";
import { isValidElement } from "react";

function MockMobileBlockedScreen() {
  return <div data-testid="mobile-blocked-screen" />;
}

mock.module("@/components/mobile-blocker", () => ({
  MobileBlockedScreen: MockMobileBlockedScreen,
}));

describe("MobileBlockedPage", () => {
  it("renders a blocker screen instead of returning null", async () => {
    const { default: MobileBlockedPage } = await import("../page");

    const page = MobileBlockedPage();

    expect(isValidElement(page)).toBe(true);
    expect(page.type).toBe(MockMobileBlockedScreen);
  });
});
