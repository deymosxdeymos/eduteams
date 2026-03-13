import { describe, expect, it } from "bun:test";
import {
  calculatePersonalityScores,
  calculatePersonalityScoresFromQuestions,
  getMBTIType,
  isValidAnswerRecord,
  isValidPersonalityScores,
} from "@/lib/personality";

describe("isValidAnswerRecord", () => {
  it("returns true for empty object", () => {
    expect(isValidAnswerRecord({})).toBe(true);
  });

  it("returns true for valid answer records", () => {
    expect(isValidAnswerRecord({ "1": 1 })).toBe(true);
    expect(isValidAnswerRecord({ "1": 3, "2": 5 })).toBe(true);
    expect(isValidAnswerRecord({ q1: 1, q2: 2, q3: 3, q4: 4, q5: 5 })).toBe(true);
  });

  it("returns false for null", () => {
    expect(isValidAnswerRecord(null)).toBe(false);
  });

  it("returns false for non-object types", () => {
    expect(isValidAnswerRecord("string")).toBe(false);
    expect(isValidAnswerRecord(123)).toBe(false);
    expect(isValidAnswerRecord(undefined)).toBe(false);
    expect(isValidAnswerRecord(true)).toBe(false);
  });

  it("returns false for non-integer values", () => {
    expect(isValidAnswerRecord({ "1": 2.5 })).toBe(false);
    expect(isValidAnswerRecord({ "1": 1.1 })).toBe(false);
  });

  it("returns false for values outside 1-5 range", () => {
    expect(isValidAnswerRecord({ "1": 0 })).toBe(false);
    expect(isValidAnswerRecord({ "1": 6 })).toBe(false);
    expect(isValidAnswerRecord({ "1": -1 })).toBe(false);
  });

  it("returns false for non-number values", () => {
    expect(isValidAnswerRecord({ "1": "3" })).toBe(false);
    expect(isValidAnswerRecord({ "1": null })).toBe(false);
  });
});

describe("isValidPersonalityScores", () => {
  it("returns true for valid scores", () => {
    expect(isValidPersonalityScores({ ei: 0, sn: 0, tf: 0, pj: 0 })).toBe(true);
    expect(isValidPersonalityScores({ ei: 1, sn: 1, tf: 1, pj: 1 })).toBe(true);
    expect(isValidPersonalityScores({ ei: -1, sn: -1, tf: -1, pj: -1 })).toBe(true);
    expect(isValidPersonalityScores({ ei: 0.5, sn: -0.5, tf: 0.25, pj: -0.75 })).toBe(true);
  });

  it("returns false for null", () => {
    expect(isValidPersonalityScores(null)).toBe(false);
  });

  it("returns false for non-object types", () => {
    expect(isValidPersonalityScores("string")).toBe(false);
    expect(isValidPersonalityScores(123)).toBe(false);
  });

  it("returns false for missing keys", () => {
    expect(isValidPersonalityScores({ ei: 0, sn: 0, tf: 0 })).toBe(false);
    expect(isValidPersonalityScores({ ei: 0 })).toBe(false);
    expect(isValidPersonalityScores({})).toBe(false);
  });

  it("returns false for values outside -1 to 1 range", () => {
    expect(isValidPersonalityScores({ ei: 2, sn: 0, tf: 0, pj: 0 })).toBe(false);
    expect(isValidPersonalityScores({ ei: 0, sn: -2, tf: 0, pj: 0 })).toBe(false);
    expect(isValidPersonalityScores({ ei: 1.1, sn: 0, tf: 0, pj: 0 })).toBe(false);
  });

  it("returns false for non-number values", () => {
    expect(isValidPersonalityScores({ ei: "0", sn: 0, tf: 0, pj: 0 })).toBe(false);
  });
});

describe("getMBTIType", () => {
  it("returns ISTJ for all negative scores", () => {
    expect(getMBTIType({ ei: -1, sn: -1, tf: -1, pj: -1 })).toBe("ISTJ");
  });

  it("returns ENFP for all positive scores", () => {
    expect(getMBTIType({ ei: 1, sn: 1, tf: 1, pj: 1 })).toBe("ENFP");
  });

  it("returns correct type for zero scores (defaults to positive)", () => {
    expect(getMBTIType({ ei: 0, sn: 0, tf: 0, pj: 0 })).toBe("ENFP");
  });

  it("returns correct type for mixed scores", () => {
    expect(getMBTIType({ ei: -0.5, sn: 0.5, tf: -0.5, pj: 0.5 })).toBe("INTP");
    expect(getMBTIType({ ei: 0.5, sn: -0.5, tf: 0.5, pj: -0.5 })).toBe("ESFJ");
  });

  it("throws for invalid scores", () => {
    expect(() => getMBTIType({ ei: 2, sn: 0, tf: 0, pj: 0 })).toThrow("Invalid personality scores");
    expect(() => getMBTIType(null as any)).toThrow("Invalid personality scores");
  });
});

describe("calculatePersonalityScores", () => {
  it("throws for invalid answer records", () => {
    expect(() =>
      calculatePersonalityScores({ "1": 6 }, [
        { id: "1", dimension: "ei", reversed: false, isAttentionCheck: false },
      ]),
    ).toThrow("Invalid answer record format");

    expect(() =>
      calculatePersonalityScores({ "1": 0 }, [
        { id: "1", dimension: "ei", reversed: false, isAttentionCheck: false },
      ]),
    ).toThrow("Invalid answer record format");
  });

  it("computes max-positive scores and maps to ENFP", () => {
    const questions = [
      { id: "q1", dimension: "ei", reversed: false, isAttentionCheck: false },
      { id: "q2", dimension: "ei", reversed: true, isAttentionCheck: false },
      { id: "q3", dimension: "sn", reversed: false, isAttentionCheck: false },
      { id: "q4", dimension: "sn", reversed: true, isAttentionCheck: false },
      { id: "q5", dimension: "tf", reversed: false, isAttentionCheck: false },
      { id: "q6", dimension: "tf", reversed: true, isAttentionCheck: false },
      { id: "q7", dimension: "pj", reversed: false, isAttentionCheck: false },
      { id: "q8", dimension: "pj", reversed: true, isAttentionCheck: false },
      { id: "q9", dimension: "ei", reversed: false, isAttentionCheck: true },
    ];
    const answers = {
      q1: 5,
      q2: 1,
      q3: 5,
      q4: 1,
      q5: 5,
      q6: 1,
      q7: 5,
      q8: 1,
      q9: 4, // attention check ignored
    };

    const scores = calculatePersonalityScores(answers, questions);
    expect(scores.ei).toBe(1);
    expect(scores.sn).toBe(1);
    expect(scores.tf).toBe(1);
    expect(scores.pj).toBe(1);
    expect(getMBTIType(scores)).toBe("ENFP");
  });

  it("computes max-negative scores and maps to ISTJ", () => {
    const questions = [
      { id: "q1", dimension: "ei", reversed: false, isAttentionCheck: false },
      { id: "q2", dimension: "sn", reversed: false, isAttentionCheck: false },
      { id: "q3", dimension: "tf", reversed: false, isAttentionCheck: false },
      { id: "q4", dimension: "pj", reversed: false, isAttentionCheck: false },
    ];
    const answers = { q1: 1, q2: 1, q3: 1, q4: 1 };

    const scores = calculatePersonalityScores(answers, questions);
    expect(scores.ei).toBe(-1);
    expect(scores.sn).toBe(-1);
    expect(scores.tf).toBe(-1);
    expect(scores.pj).toBe(-1);
    expect(getMBTIType(scores)).toBe("ISTJ");
  });
});

describe("calculatePersonalityScoresFromQuestions", () => {
  describe("single-letter dimensions", () => {
    it("handles E dimension (adds to ei)", () => {
      const questions = [{ id: "q1", dimension: "e", reversed: false, isAttentionCheck: false }];
      const scores = calculatePersonalityScoresFromQuestions({ q1: 5 }, questions);
      expect(scores.ei).toBe(1);
    });

    it("handles I dimension (subtracts from ei)", () => {
      const questions = [{ id: "q1", dimension: "i", reversed: false, isAttentionCheck: false }];
      const scores = calculatePersonalityScoresFromQuestions({ q1: 5 }, questions);
      expect(scores.ei).toBe(-1);
    });

    it("handles S dimension (subtracts from sn)", () => {
      const questions = [{ id: "q1", dimension: "s", reversed: false, isAttentionCheck: false }];
      const scores = calculatePersonalityScoresFromQuestions({ q1: 5 }, questions);
      expect(scores.sn).toBe(-1);
    });

    it("handles N dimension (adds to sn)", () => {
      const questions = [{ id: "q1", dimension: "n", reversed: false, isAttentionCheck: false }];
      const scores = calculatePersonalityScoresFromQuestions({ q1: 5 }, questions);
      expect(scores.sn).toBe(1);
    });

    it("handles T dimension (subtracts from tf)", () => {
      const questions = [{ id: "q1", dimension: "t", reversed: false, isAttentionCheck: false }];
      const scores = calculatePersonalityScoresFromQuestions({ q1: 5 }, questions);
      expect(scores.tf).toBe(-1);
    });

    it("handles F dimension (adds to tf)", () => {
      const questions = [{ id: "q1", dimension: "f", reversed: false, isAttentionCheck: false }];
      const scores = calculatePersonalityScoresFromQuestions({ q1: 5 }, questions);
      expect(scores.tf).toBe(1);
    });

    it("handles J dimension (subtracts from pj)", () => {
      const questions = [{ id: "q1", dimension: "j", reversed: false, isAttentionCheck: false }];
      const scores = calculatePersonalityScoresFromQuestions({ q1: 5 }, questions);
      expect(scores.pj).toBe(-1);
    });

    it("handles P dimension (adds to pj)", () => {
      const questions = [{ id: "q1", dimension: "p", reversed: false, isAttentionCheck: false }];
      const scores = calculatePersonalityScoresFromQuestions({ q1: 5 }, questions);
      expect(scores.pj).toBe(1);
    });
  });

  describe("interaction dimensions (two-letter)", () => {
    const INTERACTION_WEIGHT = 0.35;

    // Note: Interaction dimensions only add weighted values to sum, not to count.
    // When used alone (no main dimension questions), the count is 0, so the result is 0.
    // These tests verify the behavior when combined with main dimension questions.

    it("handles NJ dimension combined with main dimensions", () => {
      const questions = [
        { id: "q1", dimension: "sn", reversed: false, isAttentionCheck: false },
        { id: "q2", dimension: "pj", reversed: false, isAttentionCheck: false },
        { id: "q3", dimension: "nj", reversed: false, isAttentionCheck: false },
      ];
      // q1: sn norm = 0, q2: pj norm = 0, q3: nj adds weighted to both
      const scores = calculatePersonalityScoresFromQuestions({ q1: 3, q2: 3, q3: 5 }, questions);
      // sn: (0 + 0.35*1) / 1 = 0.35
      // pj: (0 + -0.35*1) / 1 = -0.35
      expect(scores.sn).toBeCloseTo(INTERACTION_WEIGHT);
      expect(scores.pj).toBeCloseTo(-INTERACTION_WEIGHT);
    });

    it("handles NP dimension combined with main dimensions", () => {
      const questions = [
        { id: "q1", dimension: "sn", reversed: false, isAttentionCheck: false },
        { id: "q2", dimension: "pj", reversed: false, isAttentionCheck: false },
        { id: "q3", dimension: "np", reversed: false, isAttentionCheck: false },
      ];
      const scores = calculatePersonalityScoresFromQuestions({ q1: 3, q2: 3, q3: 5 }, questions);
      expect(scores.sn).toBeCloseTo(INTERACTION_WEIGHT);
      expect(scores.pj).toBeCloseTo(INTERACTION_WEIGHT);
    });

    it("handles SJ dimension combined with main dimensions", () => {
      const questions = [
        { id: "q1", dimension: "sn", reversed: false, isAttentionCheck: false },
        { id: "q2", dimension: "pj", reversed: false, isAttentionCheck: false },
        { id: "q3", dimension: "sj", reversed: false, isAttentionCheck: false },
      ];
      const scores = calculatePersonalityScoresFromQuestions({ q1: 3, q2: 3, q3: 5 }, questions);
      expect(scores.sn).toBeCloseTo(-INTERACTION_WEIGHT);
      expect(scores.pj).toBeCloseTo(-INTERACTION_WEIGHT);
    });

    it("handles SP dimension combined with main dimensions", () => {
      const questions = [
        { id: "q1", dimension: "sn", reversed: false, isAttentionCheck: false },
        { id: "q2", dimension: "pj", reversed: false, isAttentionCheck: false },
        { id: "q3", dimension: "sp", reversed: false, isAttentionCheck: false },
      ];
      const scores = calculatePersonalityScoresFromQuestions({ q1: 3, q2: 3, q3: 5 }, questions);
      expect(scores.sn).toBeCloseTo(-INTERACTION_WEIGHT);
      expect(scores.pj).toBeCloseTo(INTERACTION_WEIGHT);
    });

    it("handles EF dimension combined with main dimensions", () => {
      const questions = [
        { id: "q1", dimension: "ei", reversed: false, isAttentionCheck: false },
        { id: "q2", dimension: "tf", reversed: false, isAttentionCheck: false },
        { id: "q3", dimension: "ef", reversed: false, isAttentionCheck: false },
      ];
      const scores = calculatePersonalityScoresFromQuestions({ q1: 3, q2: 3, q3: 5 }, questions);
      expect(scores.ei).toBeCloseTo(INTERACTION_WEIGHT);
      expect(scores.tf).toBeCloseTo(INTERACTION_WEIGHT);
    });

    it("handles ET dimension combined with main dimensions", () => {
      const questions = [
        { id: "q1", dimension: "ei", reversed: false, isAttentionCheck: false },
        { id: "q2", dimension: "tf", reversed: false, isAttentionCheck: false },
        { id: "q3", dimension: "et", reversed: false, isAttentionCheck: false },
      ];
      const scores = calculatePersonalityScoresFromQuestions({ q1: 3, q2: 3, q3: 5 }, questions);
      expect(scores.ei).toBeCloseTo(INTERACTION_WEIGHT);
      expect(scores.tf).toBeCloseTo(-INTERACTION_WEIGHT);
    });

    it("handles IF dimension combined with main dimensions", () => {
      const questions = [
        { id: "q1", dimension: "ei", reversed: false, isAttentionCheck: false },
        { id: "q2", dimension: "tf", reversed: false, isAttentionCheck: false },
        { id: "q3", dimension: "if", reversed: false, isAttentionCheck: false },
      ];
      const scores = calculatePersonalityScoresFromQuestions({ q1: 3, q2: 3, q3: 5 }, questions);
      expect(scores.ei).toBeCloseTo(-INTERACTION_WEIGHT);
      expect(scores.tf).toBeCloseTo(INTERACTION_WEIGHT);
    });

    it("handles IT dimension combined with main dimensions", () => {
      const questions = [
        { id: "q1", dimension: "ei", reversed: false, isAttentionCheck: false },
        { id: "q2", dimension: "tf", reversed: false, isAttentionCheck: false },
        { id: "q3", dimension: "it", reversed: false, isAttentionCheck: false },
      ];
      const scores = calculatePersonalityScoresFromQuestions({ q1: 3, q2: 3, q3: 5 }, questions);
      expect(scores.ei).toBeCloseTo(-INTERACTION_WEIGHT);
      expect(scores.tf).toBeCloseTo(-INTERACTION_WEIGHT);
    });

    it("interaction dimensions alone result in zero (no count)", () => {
      const questions = [{ id: "q1", dimension: "nj", reversed: false, isAttentionCheck: false }];
      const scores = calculatePersonalityScoresFromQuestions({ q1: 5 }, questions);
      // NJ only adds weighted values to sum, not to count
      // count is 0 for both sn and pj, so result is 0
      expect(scores.sn).toBe(0);
      expect(scores.pj).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("skips attention check questions", () => {
      const questions = [
        { id: "q1", dimension: "ei", reversed: false, isAttentionCheck: true },
        { id: "q2", dimension: "ei", reversed: false, isAttentionCheck: false },
      ];
      const scores = calculatePersonalityScoresFromQuestions({ q1: 1, q2: 5 }, questions);
      // Only q2 should be counted
      expect(scores.ei).toBe(1);
    });

    it("handles reversed questions", () => {
      const questions = [{ id: "q1", dimension: "ei", reversed: true, isAttentionCheck: false }];
      // Answer 5 reversed becomes 6-5=1, norm = (1-3)/2 = -1
      const scores = calculatePersonalityScoresFromQuestions({ q1: 5 }, questions);
      expect(scores.ei).toBe(-1);
    });

    it("handles missing answers", () => {
      const questions = [
        { id: "q1", dimension: "ei", reversed: false, isAttentionCheck: false },
        { id: "q2", dimension: "ei", reversed: false, isAttentionCheck: false },
      ];
      // Only q1 answered
      const scores = calculatePersonalityScoresFromQuestions({ q1: 5 }, questions);
      expect(scores.ei).toBe(1);
    });

    it("falls back to ordinal key when id not found", () => {
      const questions = [{ id: "q1", dimension: "ei", reversed: false, isAttentionCheck: false }];
      // Answer by ordinal position (1-indexed)
      const scores = calculatePersonalityScoresFromQuestions({ "1": 5 }, questions);
      expect(scores.ei).toBe(1);
    });

    it("returns zero for dimensions with no questions", () => {
      const questions = [{ id: "q1", dimension: "ei", reversed: false, isAttentionCheck: false }];
      const scores = calculatePersonalityScoresFromQuestions({ q1: 5 }, questions);
      expect(scores.sn).toBe(0);
      expect(scores.tf).toBe(0);
      expect(scores.pj).toBe(0);
    });

    it("clamps scores to -1 to 1 range", () => {
      // Create extreme values that would exceed range
      const questions = [
        { id: "q1", dimension: "ei", reversed: false, isAttentionCheck: false },
        { id: "q2", dimension: "e", reversed: false, isAttentionCheck: false },
        { id: "q3", dimension: "e", reversed: false, isAttentionCheck: false },
      ];
      const scores = calculatePersonalityScoresFromQuestions({ q1: 5, q2: 5, q3: 5 }, questions);
      // All max positive, average should be 1 (clamped)
      expect(scores.ei).toBe(1);
    });

    it("handles uppercase dimension names", () => {
      const questions = [{ id: "q1", dimension: "EI", reversed: false, isAttentionCheck: false }];
      const scores = calculatePersonalityScoresFromQuestions({ q1: 5 }, questions);
      expect(scores.ei).toBe(1);
    });

    it("ignores unknown dimension names", () => {
      const questions = [
        {
          id: "q1",
          dimension: "unknown",
          reversed: false,
          isAttentionCheck: false,
        },
        { id: "q2", dimension: "ei", reversed: false, isAttentionCheck: false },
      ];
      const scores = calculatePersonalityScoresFromQuestions({ q1: 5, q2: 3 }, questions);
      // Unknown dimension ignored, only q2 counted
      expect(scores.ei).toBe(0);
    });

    it("handles empty questions array", () => {
      const scores = calculatePersonalityScoresFromQuestions({}, []);
      expect(scores).toEqual({ ei: 0, sn: 0, tf: 0, pj: 0 });
    });

    it("handles neutral answers (value 3)", () => {
      const questions = [{ id: "q1", dimension: "ei", reversed: false, isAttentionCheck: false }];
      // norm = (3-3)/2 = 0
      const scores = calculatePersonalityScoresFromQuestions({ q1: 3 }, questions);
      expect(scores.ei).toBe(0);
    });
  });

  describe("complex scenarios", () => {
    it("averages multiple questions for same dimension", () => {
      const questions = [
        { id: "q1", dimension: "ei", reversed: false, isAttentionCheck: false },
        { id: "q2", dimension: "ei", reversed: false, isAttentionCheck: false },
      ];
      // q1: norm = (5-3)/2 = 1, q2: norm = (1-3)/2 = -1, avg = 0
      const scores = calculatePersonalityScoresFromQuestions({ q1: 5, q2: 1 }, questions);
      expect(scores.ei).toBe(0);
    });

    it("combines main and single-letter dimensions", () => {
      const questions = [
        { id: "q1", dimension: "ei", reversed: false, isAttentionCheck: false },
        { id: "q2", dimension: "e", reversed: false, isAttentionCheck: false },
        { id: "q3", dimension: "i", reversed: false, isAttentionCheck: false },
      ];
      // q1: +1, q2: +1, q3: -1 (because i subtracts), total sum=1, count=3, avg=0.33
      const scores = calculatePersonalityScoresFromQuestions({ q1: 5, q2: 5, q3: 5 }, questions);
      expect(scores.ei).toBeCloseTo(1 / 3);
    });
  });
});
