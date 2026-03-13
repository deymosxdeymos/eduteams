import { describe, expect, it } from "bun:test";
import { deriveMBTIType, getMBTIType } from "../mbti-helpers";

type MBTIType =
  | "ENFP"
  | "ENFJ"
  | "ENTP"
  | "ENTJ"
  | "ESFP"
  | "ESFJ"
  | "ESTP"
  | "ESTJ"
  | "INFP"
  | "INFJ"
  | "INTP"
  | "INTJ"
  | "ISFP"
  | "ISFJ"
  | "ISTP"
  | "ISTJ";

describe("deriveMBTIType", () => {
  it("derives ENFP from all positive scores", () => {
    expect(deriveMBTIType({ ei: 0.5, sn: 0.5, tf: 0.5, pj: 0.5 })).toBe("ENFP");
  });

  it("derives ISTJ from all negative scores", () => {
    expect(deriveMBTIType({ ei: -0.5, sn: -0.5, tf: -0.5, pj: -0.5 })).toBe("ISTJ");
  });

  it("derives ENTP from mixed scores", () => {
    expect(deriveMBTIType({ ei: 0.5, sn: 0.5, tf: -0.5, pj: 0.5 })).toBe("ENTP");
  });

  it("returns null for incomplete scores (missing ei)", () => {
    expect(deriveMBTIType({ ei: null, sn: 0.5, tf: 0.5, pj: 0.5 })).toBe(null);
  });

  it("returns null for incomplete scores (missing sn)", () => {
    expect(deriveMBTIType({ ei: 0.5, sn: null, tf: 0.5, pj: 0.5 })).toBe(null);
  });

  it("returns null for incomplete scores (missing tf)", () => {
    expect(deriveMBTIType({ ei: 0.5, sn: 0.5, tf: null, pj: 0.5 })).toBe(null);
  });

  it("returns null for incomplete scores (missing pj)", () => {
    expect(deriveMBTIType({ ei: 0.5, sn: 0.5, tf: 0.5, pj: null })).toBe(null);
  });

  it("returns null for all missing scores", () => {
    expect(deriveMBTIType({ ei: null, sn: null, tf: null, pj: null })).toBe(null);
  });
});

describe("getMBTIType", () => {
  it("prefers derived type over stored type when scores available", () => {
    const user = {
      ei: 0.5,
      sn: 0.5,
      tf: 0.5,
      pj: 0.5,
      mbtiType: "INTJ" as MBTIType, // Wrong stored value
    };
    expect(getMBTIType(user)).toBe("ENFP"); // Correct derived value
  });

  it("falls back to stored type if scores missing", () => {
    const user = {
      ei: null,
      sn: null,
      tf: null,
      pj: null,
      mbtiType: "INTJ" as MBTIType,
    };
    expect(getMBTIType(user)).toBe("INTJ");
  });

  it("returns null if no scores and no stored type", () => {
    const user = {
      ei: null,
      sn: null,
      tf: null,
      pj: null,
      mbtiType: null,
    };
    expect(getMBTIType(user)).toBe(null);
  });

  it("derives correct type even when stored type is wrong (ENFP vs ISTJ)", () => {
    const user = {
      ei: 0.5,
      sn: 0.5,
      tf: 0.5,
      pj: 0.5,
      mbtiType: "ISTJ" as MBTIType, // Completely opposite stored value
    };
    expect(getMBTIType(user)).toBe("ENFP"); // Still derives correctly
  });

  it("works without stored mbtiType field", () => {
    const user = {
      ei: -0.5,
      sn: -0.5,
      tf: -0.5,
      pj: -0.5,
    };
    expect(getMBTIType(user)).toBe("ISTJ");
  });

  it("derives correct type for partial mismatch", () => {
    const user = {
      ei: 0.5,
      sn: -0.5,
      tf: 0.5,
      pj: -0.5,
      mbtiType: "INTP" as MBTIType, // Wrong stored value
    };
    expect(getMBTIType(user)).toBe("ESFJ"); // Correct derived value
  });

  it("returns stored type when scores are partially null", () => {
    const user = {
      ei: 0.5,
      sn: null,
      tf: null,
      pj: null,
      mbtiType: "ENFP" as MBTIType,
    };
    expect(getMBTIType(user)).toBe("ENFP");
  });
});
