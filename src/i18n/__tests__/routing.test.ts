import { describe, expect, it } from "bun:test";
import { getLocalizedHref } from "../routing";

describe("getLocalizedHref", () => {
  it("keeps default-locale paths unchanged", () => {
    expect(getLocalizedHref("id", "/dashboard/class/demo/assignments/demo-local")).toBe(
      "/dashboard/class/demo/assignments/demo-local",
    );
  });

  it("prefixes non-default locale paths", () => {
    expect(getLocalizedHref("en", "/dashboard/class/demo/assignments/demo-local")).toBe(
      "/en/dashboard/class/demo/assignments/demo-local",
    );
  });

  it("does not double-prefix paths that already include the locale", () => {
    expect(getLocalizedHref("en", "/en/dashboard/class/demo/assignments/demo-local")).toBe(
      "/en/dashboard/class/demo/assignments/demo-local",
    );
  });

  it("localizes the homepage path", () => {
    expect(getLocalizedHref("en", "/")).toBe("/en");
  });
});
