import { describe, expect, it } from "bun:test";
import {
  buildDemoTeamFormation,
  buildDemoAssignmentAnswersHref,
  buildDemoAssignmentHref,
  DEMO_ASSIGNMENT_ID,
  DEMO_STUDENT_ID,
  DEMO_TEACHER_ID,
  getDemoAssignmentAnswersView,
  getDemoAssignmentDefinitionFromSearchParams,
  getDemoAssignmentStats,
  getDemoAssignmentStatsForDefinition,
  getDemoAssignmentSubmissionSnapshot,
  getDemoAssignmentsForUser,
  getDemoDashboardStatistics,
  getDemoManageAssignments,
  getDemoSubmittedStudents,
  getDemoStudentsForCourse,
} from "@/lib/demo/sandbox";

describe("demo sandbox assignment helpers", () => {
  it("builds assignment hrefs with the local assignment definition", () => {
    const href = buildDemoAssignmentHref({
      classId: "demo-sandbox-course",
      assignmentId: "demo-local-123",
      title: "Custom Sprint",
      skills: ["Data Analysis", "Presentation Design"],
      topics: ["Fraud Detection", "Movie Recommendation"],
    });

    expect(href).toBe(
      "/dashboard/class/demo-sandbox-course/assignments/demo-local-123?demoTitle=Custom+Sprint&demoSkill=Data+Analysis&demoSkill=Presentation+Design&demoTopic=Fraud+Detection&demoTopic=Movie+Recommendation",
    );
  });

  it("builds answers hrefs with the local assignment definition", () => {
    const href = buildDemoAssignmentAnswersHref({
      classId: "demo-sandbox-course",
      assignmentId: "demo-local-123",
      title: "Custom Sprint",
      skills: ["Data Analysis", "Presentation Design"],
      topics: ["Fraud Detection", "Movie Recommendation"],
    });

    expect(href).toBe(
      "/dashboard/class/demo-sandbox-course/assignments/demo-local-123/answers?demoTitle=Custom+Sprint&demoSkill=Data+Analysis&demoSkill=Presentation+Design&demoTopic=Fraud+Detection&demoTopic=Movie+Recommendation",
    );
  });

  it("uses the provided local assignment definition for demo answers", () => {
    const answersView = getDemoAssignmentAnswersView("demo-sandbox-student", {
      title: "Custom Sprint",
      skills: ["Data Analysis", "Presentation Design"],
      topics: ["Fraud Detection", "Movie Recommendation"],
    });

    expect(answersView).toEqual({
      title: "Custom Sprint",
      skills: [
        { name: "Data Analysis", level: 0.76 },
        { name: "Presentation Design", level: 0.55 },
      ],
      topics: [
        { name: "Fraud Detection", preference: 0.58 },
        { name: "Movie Recommendation", preference: 0.72 },
      ],
    });
  });

  it("synthesizes deterministic answers for custom skills and topics", () => {
    const firstView = getDemoAssignmentAnswersView("demo-sandbox-student", {
      title: "AI Discovery Sprint",
      skills: ["Prompt Engineering"],
      topics: ["Campus Sustainability"],
    });
    const secondView = getDemoAssignmentAnswersView("demo-sandbox-student", {
      title: "AI Discovery Sprint",
      skills: ["Prompt Engineering"],
      topics: ["Campus Sustainability"],
    });

    expect(firstView).toEqual(secondView);
    expect(firstView).toEqual({
      title: "AI Discovery Sprint",
      skills: [{ name: "Prompt Engineering", level: expect.any(Number) }],
      topics: [{ name: "Campus Sustainability", preference: expect.any(Number) }],
    });
    expect(firstView?.skills[0]?.level).toBeGreaterThan(0);
    expect(firstView?.skills[0]?.level).toBeLessThanOrEqual(1);
    expect(firstView?.topics[0]?.preference).toBeGreaterThan(0);
    expect(firstView?.topics[0]?.preference).toBeLessThanOrEqual(1);
  });

  it("preserves explicit empty skills and topics from search params", () => {
    const definition = getDemoAssignmentDefinitionFromSearchParams({
      demoTitle: "Lean Brief",
      demoSkillsEmpty: "1",
      demoTopicsEmpty: "1",
    });

    expect(definition).toEqual({
      title: "Lean Brief",
      skills: [],
      topics: [],
    });
  });

  it("reflects persisted seeded-assignment submissions in demo student assignment rows", () => {
    const pendingAssignments = getDemoAssignmentsForUser(
      { id: DEMO_STUDENT_ID, role: "STUDENT" },
      { submittedAssignmentIds: [] },
    );
    const submittedAssignments = getDemoAssignmentsForUser(
      { id: DEMO_STUDENT_ID, role: "STUDENT" },
      { submittedAssignmentIds: [DEMO_ASSIGNMENT_ID] },
    );

    expect(pendingAssignments[0]).toEqual(
      expect.objectContaining({
        id: DEMO_ASSIGNMENT_ID,
        submittedByMe: false,
      }),
    );
    expect(submittedAssignments[0]).toEqual(
      expect.objectContaining({
        id: DEMO_ASSIGNMENT_ID,
        submittedByMe: true,
      }),
    );
    expect(submittedAssignments[0]?.submissionsCount).toBeGreaterThan(
      pendingAssignments[0]?.submissionsCount ?? 0,
    );
  });

  it("keeps the paired demo student pending for teacher views until the local submission is recorded", () => {
    const snapshot = getDemoAssignmentSubmissionSnapshot({
      assignmentId: DEMO_ASSIGNMENT_ID,
      currentUserId: DEMO_TEACHER_ID,
      enrolledStudentIds: [DEMO_STUDENT_ID, "demo-sandbox-student-2", "demo-sandbox-student-3"],
      submittedAssignmentIds: [],
    });

    expect(snapshot.hasSubmissionStudentSubmitted).toBe(false);
    expect(snapshot.submittedStudentIds).toEqual([
      "demo-sandbox-student-2",
      "demo-sandbox-student-3",
    ]);
  });

  it("counts the paired demo student after the local submission is recorded", () => {
    const snapshot = getDemoAssignmentSubmissionSnapshot({
      assignmentId: DEMO_ASSIGNMENT_ID,
      currentUserId: DEMO_TEACHER_ID,
      enrolledStudentIds: [DEMO_STUDENT_ID, "demo-sandbox-student-2"],
      submittedAssignmentIds: [DEMO_ASSIGNMENT_ID],
    });

    expect(snapshot.hasSubmissionStudentSubmitted).toBe(true);
    expect(snapshot.submittedStudentIds).toEqual([DEMO_STUDENT_ID, "demo-sandbox-student-2"]);
  });

  it("keeps teacher assignment list counts aligned with the persisted submission snapshot", () => {
    const enrolledStudentIds = getDemoStudentsForCourse().map((student) => student.id);
    const pendingSnapshot = getDemoAssignmentSubmissionSnapshot({
      assignmentId: DEMO_ASSIGNMENT_ID,
      currentUserId: DEMO_TEACHER_ID,
      enrolledStudentIds,
      submittedAssignmentIds: [],
    });
    const submittedSnapshot = getDemoAssignmentSubmissionSnapshot({
      assignmentId: DEMO_ASSIGNMENT_ID,
      currentUserId: DEMO_TEACHER_ID,
      enrolledStudentIds,
      submittedAssignmentIds: [DEMO_ASSIGNMENT_ID],
    });
    const pendingAssignments = getDemoAssignmentsForUser(
      { id: DEMO_TEACHER_ID, role: "TEACHER" },
      { submittedAssignmentIds: [] },
    );
    const submittedAssignments = getDemoAssignmentsForUser(
      { id: DEMO_TEACHER_ID, role: "TEACHER" },
      { submittedAssignmentIds: [DEMO_ASSIGNMENT_ID] },
    );

    expect(pendingAssignments[0]).toEqual(
      expect.objectContaining({
        submissionsCount: pendingSnapshot.submittedStudentIds.length,
        submittedByMe: false,
      }),
    );
    expect(submittedAssignments[0]).toEqual(
      expect.objectContaining({
        submissionsCount: submittedSnapshot.submittedStudentIds.length,
        submittedByMe: false,
      }),
    );
  });

  it("omits removed students when building demo teams", () => {
    const totalStudents = getDemoStudentsForCourse().length;
    const result = buildDemoTeamFormation({
      assignmentId: "demo-sandbox-assignment",
      method: "JUMLAH_KELOMPOK",
      value: 2,
      excludedStudentIds: ["demo-sandbox-student-2"],
    });

    const memberIds = result.teams.flatMap((team) => team.members.map((member) => member.user.id));

    expect(memberIds).not.toContain("demo-sandbox-student-2");
    expect(memberIds).toHaveLength(totalStudents - 1);
  });

  it("omits removed students from submitted demo students", () => {
    const submittedStudents = getDemoSubmittedStudents({
      excludedStudentIds: ["demo-sandbox-student-2"],
    });

    expect(submittedStudents.map((student) => student.id)).not.toContain("demo-sandbox-student-2");
  });

  it("omits the paired pending demo student from submitted answer rosters", () => {
    const submittedStudents = getDemoSubmittedStudents({
      assignmentId: DEMO_ASSIGNMENT_ID,
      currentUserId: DEMO_TEACHER_ID,
      submittedAssignmentIds: [],
    });

    expect(submittedStudents.map((student) => student.id)).not.toContain(DEMO_STUDENT_ID);
  });

  it("restores the paired demo student to submitted answer rosters after submission", () => {
    const submittedStudents = getDemoSubmittedStudents({
      assignmentId: DEMO_ASSIGNMENT_ID,
      currentUserId: DEMO_TEACHER_ID,
      submittedAssignmentIds: [DEMO_ASSIGNMENT_ID],
    });

    expect(submittedStudents.map((student) => student.id)).toContain(DEMO_STUDENT_ID);
  });

  it("uses the filtered roster for manage assignment counts", () => {
    const totalStudents = getDemoStudentsForCourse({
      excludedStudentIds: ["demo-sandbox-student-2"],
    }).length;

    expect(getDemoManageAssignments({ totalStudents })).toEqual([
      expect.objectContaining({
        submissionsCount: totalStudents,
        totalStudents,
      }),
    ]);
  });

  it("derives dashboard statistics from persisted sandbox state", () => {
    const stats = getDemoDashboardStatistics({
      createdAssignments: [{ id: "demo-local-1" }, { id: "demo-local-2" }],
      formedTeams: {
        "demo-sandbox-assignment": {
          teams: [{ quality: 0.88 }, { quality: 0.76 }],
        },
        "demo-local-1": {
          teams: [{ quality: 0.92 }, { quality: null }],
        },
      },
    });

    expect(stats).toEqual({
      totalAssignments: 3,
      totalTeams: 4,
      avgTeamQuality: (0.88 + 0.76 + 0.92) / 3,
      qualitySummary: {
        min: 0.76,
        max: 0.92,
        mean: (0.88 + 0.76 + 0.92) / 3,
        n: 3,
      },
    });
  });

  it("excludes removed students from demo assignment stats", () => {
    const excludedStudentIds = ["demo-sandbox-student-2"];
    const filteredStudentIds = getDemoStudentsForCourse({ excludedStudentIds }).map(
      (student) => student.id,
    );
    const stats = getDemoAssignmentStats({ excludedStudentIds });
    const statsFromIncludedRoster = getDemoAssignmentStatsForDefinition({
      skills: ["Data Analysis", "UI Design"],
      topics: ["Fraud Detection", "Movie Recommendation"],
      includedStudentIds: filteredStudentIds,
    });

    expect(stats.quizSubmissions).toBe(filteredStudentIds.length);
    expect(stats.gender.reduce((sum, group) => sum + group.value, 0)).toBe(
      filteredStudentIds.length,
    );
    expect(stats.mbti.reduce((sum, item) => sum + item.jumlah, 0)).toBe(filteredStudentIds.length);
    expect(statsFromIncludedRoster.quizSubmissions).toBe(filteredStudentIds.length);
    expect(statsFromIncludedRoster.gender.reduce((sum, group) => sum + group.value, 0)).toBe(
      filteredStudentIds.length,
    );
    expect(statsFromIncludedRoster.mbti.reduce((sum, item) => sum + item.jumlah, 0)).toBe(
      filteredStudentIds.length,
    );
  });

  it("synthesizes non-empty analytics for custom skills and topics", () => {
    const stats = getDemoAssignmentStatsForDefinition({
      skills: ["Prompt Engineering"],
      topics: ["Campus Sustainability"],
    });

    expect(stats.skills).toEqual([{ label: "Prompt Engineering", value: expect.any(Number) }]);
    expect(stats.topicPreferences).toEqual([
      { name: "Campus Sustainability", value: expect.any(Number) },
    ]);
    expect(stats.skills[0]?.value).toBeGreaterThan(0);
    expect(stats.topicPreferences[0]?.value).toBeGreaterThan(0);
    expect(stats.chartReady).toBe(true);
    expect(stats.skillsReady).toBe(true);
  });
});
