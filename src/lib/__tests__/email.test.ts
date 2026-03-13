import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { isInstitutionalEmail } from "../email";

describe("isInstitutionalEmail", () => {
  const originalEnv = process.env.NEXT_PUBLIC_DISABLE_INSTITUTIONAL_EMAIL;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_DISABLE_INSTITUTIONAL_EMAIL;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NEXT_PUBLIC_DISABLE_INSTITUTIONAL_EMAIL = originalEnv;
    } else {
      delete process.env.NEXT_PUBLIC_DISABLE_INSTITUTIONAL_EMAIL;
    }
  });
  it("returns true for valid institutional email addresses", () => {
    expect(isInstitutionalEmail("user@if.itera.ac.id")).toBe(true);
    expect(isInstitutionalEmail("test.user@if.itera.ac.id")).toBe(true);
    expect(isInstitutionalEmail("admin@IF.ITERA.AC.ID")).toBe(true);
  });

  it("returns false for non-institutional email addresses", () => {
    expect(isInstitutionalEmail("user@gmail.com")).toBe(false);
    expect(isInstitutionalEmail("user@yahoo.com")).toBe(false);
    expect(isInstitutionalEmail("user@itera.ac.id")).toBe(false);
    expect(isInstitutionalEmail("user@if.ac.id")).toBe(false);
  });

  it("returns false for invalid email formats", () => {
    expect(isInstitutionalEmail("")).toBe(false);
    expect(isInstitutionalEmail("invalid-email")).toBe(false);
    expect(isInstitutionalEmail("user@")).toBe(false);
    expect(isInstitutionalEmail("user@domain.com")).toBe(false);
  });

  it("handles null and undefined inputs", () => {
    expect(isInstitutionalEmail(null)).toBe(false);
    expect(isInstitutionalEmail(undefined)).toBe(false);
  });

  it("returns true when institutional email check is disabled", () => {
    process.env.NEXT_PUBLIC_DISABLE_INSTITUTIONAL_EMAIL = "1";

    expect(isInstitutionalEmail("any@gmail.com")).toBe(true);
    expect(isInstitutionalEmail("random@yahoo.com")).toBe(true);
    expect(isInstitutionalEmail("")).toBe(true);
    expect(isInstitutionalEmail(null)).toBe(true);
    expect(isInstitutionalEmail(undefined)).toBe(true);
  });

  it("respects the environment variable setting", () => {
    // Test with '0' (disabled)
    process.env.NEXT_PUBLIC_DISABLE_INSTITUTIONAL_EMAIL = "0";
    expect(isInstitutionalEmail("user@gmail.com")).toBe(false);
    expect(isInstitutionalEmail("user@if.itera.ac.id")).toBe(true);

    // Test with undefined (default behavior)
    delete process.env.NEXT_PUBLIC_DISABLE_INSTITUTIONAL_EMAIL;
    expect(isInstitutionalEmail("user@gmail.com")).toBe(false);
    expect(isInstitutionalEmail("user@if.itera.ac.id")).toBe(true);
  });
});
