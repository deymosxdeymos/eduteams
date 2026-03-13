import { describe, expect, it } from "bun:test";
import {
  type AssignmentChanges,
  analyzeAssignmentEditImpact,
  detectArrayChanges,
  determineEditTier,
  formatChangesForDisplay,
  hasStructuralChanges,
  parseAssignmentStructure,
  type StructuralChange,
} from "../assignment-change-detection";

describe("parseAssignmentStructure", () => {
  it("returns empty arrays for null description", () => {
    const result = parseAssignmentStructure(null);
    expect(result).toEqual({ skills: [], topics: [] });
  });

  it("returns empty arrays for empty string", () => {
    const result = parseAssignmentStructure("");
    expect(result).toEqual({ skills: [], topics: [] });
  });

  it("returns empty arrays for invalid JSON", () => {
    const result = parseAssignmentStructure("not valid json");
    expect(result).toEqual({ skills: [], topics: [] });
  });

  it("returns empty arrays for JSON that is not an object", () => {
    const result = parseAssignmentStructure('"just a string"');
    expect(result).toEqual({ skills: [], topics: [] });
  });

  it("returns empty arrays for JSON array", () => {
    const result = parseAssignmentStructure("[1, 2, 3]");
    expect(result).toEqual({ skills: [], topics: [] });
  });

  it("parses valid structure with skills and topics", () => {
    const description = JSON.stringify({
      skills: ["JavaScript", "TypeScript"],
      topics: ["React", "Next.js"],
    });
    const result = parseAssignmentStructure(description);
    expect(result).toEqual({
      skills: ["JavaScript", "TypeScript"],
      topics: ["React", "Next.js"],
    });
  });

  it("returns empty array when skills is not an array", () => {
    const description = JSON.stringify({
      skills: "not an array",
      topics: ["React"],
    });
    const result = parseAssignmentStructure(description);
    expect(result).toEqual({ skills: [], topics: ["React"] });
  });

  it("returns empty array when topics is not an array", () => {
    const description = JSON.stringify({
      skills: ["JavaScript"],
      topics: { invalid: true },
    });
    const result = parseAssignmentStructure(description);
    expect(result).toEqual({ skills: ["JavaScript"], topics: [] });
  });

  it("handles missing skills property", () => {
    const description = JSON.stringify({ topics: ["React"] });
    const result = parseAssignmentStructure(description);
    expect(result).toEqual({ skills: [], topics: ["React"] });
  });

  it("handles missing topics property", () => {
    const description = JSON.stringify({ skills: ["JavaScript"] });
    const result = parseAssignmentStructure(description);
    expect(result).toEqual({ skills: ["JavaScript"], topics: [] });
  });

  it("handles empty object", () => {
    const description = JSON.stringify({});
    const result = parseAssignmentStructure(description);
    expect(result).toEqual({ skills: [], topics: [] });
  });
});

describe("detectArrayChanges", () => {
  describe("basic detection", () => {
    it("detects no changes for identical arrays", () => {
      const result = detectArrayChanges(["a", "b", "c"], ["a", "b", "c"]);
      expect(result.added).toEqual([]);
      expect(result.removed).toEqual([]);
      expect(result.renamed).toEqual([]);
    });

    it("detects added items", () => {
      const result = detectArrayChanges(["a", "b"], ["a", "b", "c"]);
      expect(result.added).toEqual(["c"]);
      expect(result.removed).toEqual([]);
      expect(result.renamed).toEqual([]);
    });

    it("detects removed items", () => {
      const result = detectArrayChanges(["a", "b", "c"], ["a", "b"]);
      expect(result.added).toEqual([]);
      expect(result.removed).toEqual(["c"]);
      expect(result.renamed).toEqual([]);
    });

    it("detects multiple added items", () => {
      const result = detectArrayChanges(["a"], ["a", "b", "c", "d"]);
      expect(result.added).toEqual(["b", "c", "d"]);
      expect(result.removed).toEqual([]);
    });

    it("detects multiple removed items", () => {
      const result = detectArrayChanges(["a", "b", "c", "d"], ["a"]);
      expect(result.removed).toEqual(["b", "c", "d"]);
      expect(result.added).toEqual([]);
    });

    it("detects both added and removed items", () => {
      const result = detectArrayChanges(["a", "b"], ["b", "c"]);
      expect(result.added).toEqual(["c"]);
      expect(result.removed).toEqual(["a"]);
    });

    it("handles empty old array", () => {
      const result = detectArrayChanges([], ["a", "b"]);
      expect(result.added).toEqual(["a", "b"]);
      expect(result.removed).toEqual([]);
    });

    it("handles empty new array", () => {
      const result = detectArrayChanges(["a", "b"], []);
      expect(result.added).toEqual([]);
      expect(result.removed).toEqual(["a", "b"]);
    });

    it("handles both arrays empty", () => {
      const result = detectArrayChanges([], []);
      expect(result.added).toEqual([]);
      expect(result.removed).toEqual([]);
      expect(result.renamed).toEqual([]);
    });
  });

  describe("case insensitivity", () => {
    it("treats items as same regardless of case", () => {
      const result = detectArrayChanges(["JavaScript"], ["javascript"]);
      expect(result.added).toEqual([]);
      expect(result.removed).toEqual([]);
      expect(result.renamed).toEqual([]);
    });

    it("treats mixed case as same", () => {
      const result = detectArrayChanges(["REACT", "next.js"], ["react", "NEXT.JS"]);
      expect(result.added).toEqual([]);
      expect(result.removed).toEqual([]);
    });
  });

  describe("whitespace handling", () => {
    it("trims whitespace when comparing", () => {
      const result = detectArrayChanges(["  react  "], ["react"]);
      expect(result.added).toEqual([]);
      expect(result.removed).toEqual([]);
    });

    it("preserves original casing in output", () => {
      const result = detectArrayChanges(["React"], ["Angular"]);
      expect(result.removed).toEqual(["React"]);
      expect(result.added).toEqual(["Angular"]);
    });
  });

  describe("rename detection", () => {
    it("detects rename when old contains new (substring match)", () => {
      const result = detectArrayChanges(["JavaScript"], ["Java"]);
      expect(result.renamed).toEqual([{ old: "JavaScript", new: "Java" }]);
      expect(result.added).toEqual([]);
      expect(result.removed).toEqual([]);
    });

    it("detects rename when new contains old (substring match)", () => {
      const result = detectArrayChanges(["React"], ["React Native"]);
      expect(result.renamed).toEqual([{ old: "React", new: "React Native" }]);
      expect(result.added).toEqual([]);
      expect(result.removed).toEqual([]);
    });

    it("does not detect rename when items are completely different", () => {
      const result = detectArrayChanges(["Python"], ["Rust"]);
      expect(result.renamed).toEqual([]);
      expect(result.removed).toEqual(["Python"]);
      expect(result.added).toEqual(["Rust"]);
    });

    it("detects multiple renames", () => {
      const result = detectArrayChanges(["JavaScript", "TypeScript"], ["Java", "Type"]);
      expect(result.renamed).toHaveLength(2);
      expect(result.renamed).toContainEqual({ old: "JavaScript", new: "Java" });
      expect(result.renamed).toContainEqual({ old: "TypeScript", new: "Type" });
      expect(result.removed).toEqual([]);
      expect(result.added).toEqual([]);
    });

    it("detects rename even when there are other changes", () => {
      const result = detectArrayChanges(["JavaScript", "Python"], ["Java", "Python", "Rust"]);
      // JavaScript -> Java is detected as rename, Rust is a pure addition
      expect(result.renamed).toEqual([{ old: "JavaScript", new: "Java" }]);
      expect(result.removed).toEqual([]);
      expect(result.added).toEqual(["Rust"]);
    });
  });

  describe("duplicate handling", () => {
    it("handles duplicates in old array", () => {
      const result = detectArrayChanges(["a", "a", "b"], ["a", "b", "c"]);
      expect(result.added).toEqual(["c"]);
      expect(result.removed).toEqual([]);
    });

    it("handles duplicates in new array", () => {
      const result = detectArrayChanges(["a", "b"], ["a", "b", "b", "c"]);
      expect(result.added).toEqual(["c"]);
      expect(result.removed).toEqual([]);
    });
  });

  describe("edge cases", () => {
    it("handles special characters", () => {
      const result = detectArrayChanges(["C++", "C#"], ["C++", "F#"]);
      expect(result.removed).toEqual(["C#"]);
      expect(result.added).toEqual(["F#"]);
    });

    it("handles unicode characters", () => {
      const result = detectArrayChanges(["日本語"], ["中文"]);
      expect(result.removed).toEqual(["日本語"]);
      expect(result.added).toEqual(["中文"]);
    });

    it("handles items that differ only by case", () => {
      // When converting to lowercase, these are the same
      const result = detectArrayChanges(["ABC"], ["abc"]);
      expect(result.added).toEqual([]);
      expect(result.removed).toEqual([]);
    });
  });
});

describe("determineEditTier", () => {
  const emptyChanges: StructuralChange = {
    added: [],
    removed: [],
    renamed: [],
  };

  describe("Tier 4: Teams already formed", () => {
    it("returns tier 4 when teams formed and skills added", () => {
      const skillChanges: StructuralChange = {
        added: ["NewSkill"],
        removed: [],
        renamed: [],
      };
      const result = determineEditTier(skillChanges, emptyChanges, "BERHASIL_PEMBAGIAN_GRUP", 5);
      expect(result.tier).toBe(4);
      expect(result.reason).toContain("Cannot edit");
      expect(result.reason).toContain("teams have been formed");
    });

    it("returns tier 4 when teams formed and topics removed", () => {
      const topicChanges: StructuralChange = {
        added: [],
        removed: ["OldTopic"],
        renamed: [],
      };
      const result = determineEditTier(emptyChanges, topicChanges, "BERHASIL_PEMBAGIAN_GRUP", 5);
      expect(result.tier).toBe(4);
    });

    it("returns tier 4 when teams formed and items renamed", () => {
      const skillChanges: StructuralChange = {
        added: [],
        removed: [],
        renamed: [{ old: "OldName", new: "NewName" }],
      };
      const result = determineEditTier(skillChanges, emptyChanges, "BERHASIL_PEMBAGIAN_GRUP", 5);
      expect(result.tier).toBe(4);
    });

    it("returns tier 1 when teams formed but no structural changes", () => {
      const result = determineEditTier(emptyChanges, emptyChanges, "BERHASIL_PEMBAGIAN_GRUP", 5);
      expect(result.tier).toBe(1);
      expect(result.reason).toBeUndefined();
    });
  });

  describe("Tier 1: No submissions", () => {
    it("returns tier 1 when no submissions regardless of changes", () => {
      const destructiveChanges: StructuralChange = {
        added: ["New"],
        removed: ["Old"],
        renamed: [{ old: "A", new: "B" }],
      };
      const result = determineEditTier(destructiveChanges, destructiveChanges, "BELUM_ISI", 0);
      expect(result.tier).toBe(1);
    });

    it("returns tier 1 for MENUNGGU status with no submissions", () => {
      const changes: StructuralChange = {
        added: ["NewSkill"],
        removed: ["OldSkill"],
        renamed: [],
      };
      const result = determineEditTier(changes, emptyChanges, "MENUNGGU", 0);
      expect(result.tier).toBe(1);
    });
  });

  describe("Tier 3: Destructive changes with submissions", () => {
    it("returns tier 3 when skills are removed with submissions", () => {
      const skillChanges: StructuralChange = {
        added: [],
        removed: ["RemovedSkill"],
        renamed: [],
      };
      const result = determineEditTier(skillChanges, emptyChanges, "MENUNGGU", 10);
      expect(result.tier).toBe(3);
      expect(result.reason).toContain("invalidate");
      expect(result.reason).toContain("10");
      expect(result.reason).toContain("submissions");
    });

    it("returns tier 3 when topics are removed with submissions", () => {
      const topicChanges: StructuralChange = {
        added: [],
        removed: ["RemovedTopic"],
        renamed: [],
      };
      const result = determineEditTier(emptyChanges, topicChanges, "MENUNGGU", 3);
      expect(result.tier).toBe(3);
    });

    it("returns tier 3 when skills are renamed with submissions", () => {
      const skillChanges: StructuralChange = {
        added: [],
        removed: [],
        renamed: [{ old: "OldSkill", new: "NewSkill" }],
      };
      const result = determineEditTier(skillChanges, emptyChanges, "MENUNGGU", 5);
      expect(result.tier).toBe(3);
    });

    it("returns tier 3 when topics are renamed with submissions", () => {
      const topicChanges: StructuralChange = {
        added: [],
        removed: [],
        renamed: [{ old: "OldTopic", new: "NewTopic" }],
      };
      const result = determineEditTier(emptyChanges, topicChanges, "BELUM_ISI", 1);
      expect(result.tier).toBe(3);
      expect(result.reason).toContain("1");
      expect(result.reason).not.toContain("submissions"); // singular
    });

    it("uses singular form for 1 submission", () => {
      const skillChanges: StructuralChange = {
        added: [],
        removed: ["Skill"],
        renamed: [],
      };
      const result = determineEditTier(skillChanges, emptyChanges, "MENUNGGU", 1);
      expect(result.tier).toBe(3);
      expect(result.reason).toContain("1 existing submission.");
    });

    it("uses plural form for multiple submissions", () => {
      const skillChanges: StructuralChange = {
        added: [],
        removed: ["Skill"],
        renamed: [],
      };
      const result = determineEditTier(skillChanges, emptyChanges, "MENUNGGU", 5);
      expect(result.tier).toBe(3);
      expect(result.reason).toContain("5 existing submissions");
    });
  });

  describe("Tier 2: Additive changes with submissions", () => {
    it("returns tier 2 when skills are added with submissions", () => {
      const skillChanges: StructuralChange = {
        added: ["NewSkill"],
        removed: [],
        renamed: [],
      };
      const result = determineEditTier(skillChanges, emptyChanges, "MENUNGGU", 5);
      expect(result.tier).toBe(2);
      expect(result.reason).toContain("New items added");
      expect(result.reason).toContain("5 students");
    });

    it("returns tier 2 when topics are added with submissions", () => {
      const topicChanges: StructuralChange = {
        added: ["NewTopic"],
        removed: [],
        renamed: [],
      };
      const result = determineEditTier(emptyChanges, topicChanges, "MENUNGGU", 3);
      expect(result.tier).toBe(2);
    });

    it("uses singular form for 1 student", () => {
      const skillChanges: StructuralChange = {
        added: ["NewSkill"],
        removed: [],
        renamed: [],
      };
      const result = determineEditTier(skillChanges, emptyChanges, "MENUNGGU", 1);
      expect(result.tier).toBe(2);
      expect(result.reason).toContain("1 student who submitted");
    });

    // Tier 3 takes precedence over Tier 2
    it("returns tier 3 when both additions and removals exist", () => {
      const skillChanges: StructuralChange = {
        added: ["NewSkill"],
        removed: ["OldSkill"],
        renamed: [],
      };
      const result = determineEditTier(skillChanges, emptyChanges, "MENUNGGU", 5);
      expect(result.tier).toBe(3);
    });
  });

  describe("Tier 1: Only metadata changes", () => {
    it("returns tier 1 when no structural changes with submissions", () => {
      const result = determineEditTier(emptyChanges, emptyChanges, "MENUNGGU", 100);
      expect(result.tier).toBe(1);
      expect(result.reason).toBeUndefined();
    });
  });
});

describe("analyzeAssignmentEditImpact", () => {
  it("analyzes complete impact for destructive changes", () => {
    const currentDescription = JSON.stringify({
      skills: ["JavaScript", "TypeScript"],
      topics: ["React", "Vue"],
    });

    const result = analyzeAssignmentEditImpact(
      currentDescription,
      ["JavaScript", "Python"], // TypeScript removed, Python added
      ["React", "Angular"], // Vue removed, Angular added
      "MENUNGGU",
      10,
    );

    expect(result.tier).toBe(3);
    expect(result.affectedSubmissions).toBe(10);
    expect(result.changes.skills.removed).toEqual(["TypeScript"]);
    expect(result.changes.skills.added).toEqual(["Python"]);
    expect(result.changes.topics.removed).toEqual(["Vue"]);
    expect(result.changes.topics.added).toEqual(["Angular"]);
  });

  it("analyzes complete impact for additive changes only", () => {
    const currentDescription = JSON.stringify({
      skills: ["JavaScript"],
      topics: ["React"],
    });

    const result = analyzeAssignmentEditImpact(
      currentDescription,
      ["JavaScript", "TypeScript"],
      ["React", "Next.js"],
      "MENUNGGU",
      5,
    );

    expect(result.tier).toBe(2);
    expect(result.affectedSubmissions).toBe(5);
    expect(result.changes.skills.added).toEqual(["TypeScript"]);
    expect(result.changes.topics.added).toEqual(["Next.js"]);
  });

  it("handles null description as empty structure", () => {
    const result = analyzeAssignmentEditImpact(null, ["JavaScript"], ["React"], "BELUM_ISI", 0);

    expect(result.tier).toBe(1);
    expect(result.changes.skills.added).toEqual(["JavaScript"]);
    expect(result.changes.topics.added).toEqual(["React"]);
  });

  it("returns tier 4 for formed teams with any structural changes", () => {
    const currentDescription = JSON.stringify({
      skills: ["JavaScript"],
      topics: ["React"],
    });

    const result = analyzeAssignmentEditImpact(
      currentDescription,
      ["JavaScript", "TypeScript"],
      ["React"],
      "BERHASIL_PEMBAGIAN_GRUP",
      10,
    );

    expect(result.tier).toBe(4);
    expect(result.reason).toContain("Cannot edit");
  });
});

describe("hasStructuralChanges", () => {
  it("returns false when no changes", () => {
    const changes: AssignmentChanges = {
      skills: { added: [], removed: [], renamed: [] },
      topics: { added: [], removed: [], renamed: [] },
    };
    expect(hasStructuralChanges(changes)).toBe(false);
  });

  it("returns true when skills added", () => {
    const changes: AssignmentChanges = {
      skills: { added: ["New"], removed: [], renamed: [] },
      topics: { added: [], removed: [], renamed: [] },
    };
    expect(hasStructuralChanges(changes)).toBe(true);
  });

  it("returns true when skills removed", () => {
    const changes: AssignmentChanges = {
      skills: { added: [], removed: ["Old"], renamed: [] },
      topics: { added: [], removed: [], renamed: [] },
    };
    expect(hasStructuralChanges(changes)).toBe(true);
  });

  it("returns true when skills renamed", () => {
    const changes: AssignmentChanges = {
      skills: { added: [], removed: [], renamed: [{ old: "A", new: "B" }] },
      topics: { added: [], removed: [], renamed: [] },
    };
    expect(hasStructuralChanges(changes)).toBe(true);
  });

  it("returns true when topics added", () => {
    const changes: AssignmentChanges = {
      skills: { added: [], removed: [], renamed: [] },
      topics: { added: ["New"], removed: [], renamed: [] },
    };
    expect(hasStructuralChanges(changes)).toBe(true);
  });

  it("returns true when topics removed", () => {
    const changes: AssignmentChanges = {
      skills: { added: [], removed: [], renamed: [] },
      topics: { added: [], removed: ["Old"], renamed: [] },
    };
    expect(hasStructuralChanges(changes)).toBe(true);
  });

  it("returns true when topics renamed", () => {
    const changes: AssignmentChanges = {
      skills: { added: [], removed: [], renamed: [] },
      topics: { added: [], removed: [], renamed: [{ old: "X", new: "Y" }] },
    };
    expect(hasStructuralChanges(changes)).toBe(true);
  });

  it("returns true when multiple changes exist", () => {
    const changes: AssignmentChanges = {
      skills: { added: ["A"], removed: ["B"], renamed: [] },
      topics: { added: [], removed: [], renamed: [{ old: "X", new: "Y" }] },
    };
    expect(hasStructuralChanges(changes)).toBe(true);
  });
});

describe("formatChangesForDisplay", () => {
  it("formats empty changes", () => {
    const changes: AssignmentChanges = {
      skills: { added: [], removed: [], renamed: [] },
      topics: { added: [], removed: [], renamed: [] },
    };
    const result = formatChangesForDisplay(changes);
    expect(result.skills).toEqual([]);
    expect(result.topics).toEqual([]);
  });

  it("formats added items", () => {
    const changes: AssignmentChanges = {
      skills: { added: ["JavaScript", "TypeScript"], removed: [], renamed: [] },
      topics: { added: ["React"], removed: [], renamed: [] },
    };
    const result = formatChangesForDisplay(changes);
    expect(result.skills).toContainEqual({ type: "added", text: "JavaScript" });
    expect(result.skills).toContainEqual({ type: "added", text: "TypeScript" });
    expect(result.topics).toContainEqual({ type: "added", text: "React" });
  });

  it("formats removed items", () => {
    const changes: AssignmentChanges = {
      skills: { added: [], removed: ["Python"], renamed: [] },
      topics: { added: [], removed: ["Vue", "Angular"], renamed: [] },
    };
    const result = formatChangesForDisplay(changes);
    expect(result.skills).toContainEqual({ type: "removed", text: "Python" });
    expect(result.topics).toContainEqual({ type: "removed", text: "Vue" });
    expect(result.topics).toContainEqual({ type: "removed", text: "Angular" });
  });

  it("formats renamed items with arrow notation", () => {
    const changes: AssignmentChanges = {
      skills: {
        added: [],
        removed: [],
        renamed: [{ old: "JavaScript", new: "JS" }],
      },
      topics: {
        added: [],
        removed: [],
        renamed: [{ old: "React", new: "React Native" }],
      },
    };
    const result = formatChangesForDisplay(changes);
    expect(result.skills).toContainEqual({
      type: "renamed",
      text: "JavaScript → JS",
    });
    expect(result.topics).toContainEqual({
      type: "renamed",
      text: "React → React Native",
    });
  });

  it("orders changes: removed, added, renamed", () => {
    const changes: AssignmentChanges = {
      skills: {
        added: ["Added"],
        removed: ["Removed"],
        renamed: [{ old: "Old", new: "New" }],
      },
      topics: { added: [], removed: [], renamed: [] },
    };
    const result = formatChangesForDisplay(changes);

    expect(result.skills[0]).toEqual({ type: "removed", text: "Removed" });
    expect(result.skills[1]).toEqual({ type: "added", text: "Added" });
    expect(result.skills[2]).toEqual({ type: "renamed", text: "Old → New" });
  });

  it("handles multiple items of each type", () => {
    const changes: AssignmentChanges = {
      skills: {
        added: ["A1", "A2"],
        removed: ["R1", "R2"],
        renamed: [
          { old: "O1", new: "N1" },
          { old: "O2", new: "N2" },
        ],
      },
      topics: { added: [], removed: [], renamed: [] },
    };
    const result = formatChangesForDisplay(changes);

    expect(result.skills).toHaveLength(6);
    expect(result.skills.filter((s) => s.type === "removed")).toHaveLength(2);
    expect(result.skills.filter((s) => s.type === "added")).toHaveLength(2);
    expect(result.skills.filter((s) => s.type === "renamed")).toHaveLength(2);
  });
});

describe("integration: real-world scenarios", () => {
  it("handles instructor adding new skill mid-course", () => {
    const currentDescription = JSON.stringify({
      skills: ["Problem Solving", "Communication"],
      topics: ["Data Structures"],
    });

    const result = analyzeAssignmentEditImpact(
      currentDescription,
      ["Problem Solving", "Communication", "Leadership"],
      ["Data Structures"],
      "MENUNGGU",
      25,
    );

    expect(result.tier).toBe(2);
    expect(result.changes.skills.added).toEqual(["Leadership"]);
    expect(result.reason).toContain("25 students");
  });

  it("handles instructor removing obsolete topic", () => {
    const currentDescription = JSON.stringify({
      skills: ["JavaScript"],
      topics: ["jQuery", "React", "Angular"],
    });

    const result = analyzeAssignmentEditImpact(
      currentDescription,
      ["JavaScript"],
      ["React", "Angular"], // jQuery removed
      "MENUNGGU",
      30,
    );

    expect(result.tier).toBe(3);
    expect(result.changes.topics.removed).toEqual(["jQuery"]);
    expect(result.reason).toContain("invalidate");
  });

  it("handles complete restructure of assignment", () => {
    const currentDescription = JSON.stringify({
      skills: ["Skill A", "Skill B", "Skill C"],
      topics: ["Topic 1", "Topic 2"],
    });

    const result = analyzeAssignmentEditImpact(
      currentDescription,
      ["Skill X", "Skill Y"],
      ["Topic A", "Topic B", "Topic C"],
      "MENUNGGU",
      15,
    );

    expect(result.tier).toBe(3);
    expect(result.changes.skills.removed).toHaveLength(3);
    expect(result.changes.skills.added).toHaveLength(2);
    expect(result.changes.topics.removed).toHaveLength(2);
    expect(result.changes.topics.added).toHaveLength(3);
  });

  it("blocks edits after team formation", () => {
    const currentDescription = JSON.stringify({
      skills: ["JavaScript"],
      topics: ["React"],
    });

    const result = analyzeAssignmentEditImpact(
      currentDescription,
      ["JavaScript", "TypeScript"],
      ["React"],
      "BERHASIL_PEMBAGIAN_GRUP",
      20,
    );

    expect(result.tier).toBe(4);
    expect(result.reason).toContain("reset");
  });

  it("allows metadata-only changes at any stage", () => {
    // Same skills and topics, different order (order shouldn't matter)
    const currentDescription = JSON.stringify({
      skills: ["A", "B", "C"],
      topics: ["X", "Y"],
    });

    const result = analyzeAssignmentEditImpact(
      currentDescription,
      ["C", "B", "A"], // Same items, different order
      ["Y", "X"], // Same items, different order
      "BERHASIL_PEMBAGIAN_GRUP",
      50,
    );

    expect(result.tier).toBe(1);
    expect(result.reason).toBeUndefined();
  });
});
