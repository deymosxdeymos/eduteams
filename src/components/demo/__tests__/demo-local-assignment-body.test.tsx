import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";

const useDemoSandboxClientStateMock = mock(() => ({
  createdAssignments: [],
  formedTeams: {},
  submittedAssignments: [],
}));

function applyModuleMocks() {
  mock.module("@/components/dashboard/assignment-content", () => ({
    AssignmentContent: ({
      hasTeams,
      allowPersistedTeamActions,
      teams,
      taskIdByIndex,
      submittedStudentIds,
      quizCompletionPercent,
      incompleteStudentCount,
    }: any) => (
      <div
        data-testid="assignment-content"
        data-has-teams={String(hasTeams)}
        data-allow-persisted-team-actions={String(allowPersistedTeamActions)}
        data-team-member-ids={JSON.stringify(
          teams?.map((team: any) => team.members.map((member: any) => member.user.id)) ?? [],
        )}
        data-task-ids={JSON.stringify(taskIdByIndex ?? [])}
        data-submitted-student-ids={JSON.stringify(submittedStudentIds ?? [])}
        data-quiz-completion-percent={String(quizCompletionPercent ?? 0)}
        data-incomplete-student-count={String(incompleteStudentCount ?? 0)}
      />
    ),
  }));

  mock.module("@/lib/demo/sandbox-client", () => ({
    useDemoSandboxClientState: useDemoSandboxClientStateMock,
  }));
}

describe("DemoLocalAssignmentBody", () => {
  beforeEach(() => {
    useDemoSandboxClientStateMock.mockReset();
    useDemoSandboxClientStateMock.mockReturnValue({
      createdAssignments: [],
      submittedAssignments: [],
      formedTeams: {
        "demo-local-1": {
          assignmentId: "demo-local-1",
          topicNames: { topic1: "Topic A" },
          taskIdByIndex: ["topic1"],
          teams: [
            {
              id: "team-1",
              quality: 0.95,
              createdAt: "2026-03-03T08:00:00.000Z",
              taskId: "topic1",
              members: [
                {
                  id: "member-1",
                  assignedSkillIds: [],
                  topSkills: ["Skill A"],
                  preferredTopics: ["Topic A"],
                  user: {
                    id: "student-1",
                    name: "Student One",
                    email: "student-1@eduteams.local",
                    mbtiType: "INTJ",
                    nim: "13521001",
                    ei: 0.5,
                    sn: 0.5,
                    tf: 0.5,
                    pj: 0.5,
                    gender: "MALE",
                  },
                },
              ],
            },
          ],
        },
      },
    });

    applyModuleMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  it("keeps local demo teams visible while disabling persisted team actions", async () => {
    const { DemoLocalAssignmentBody } = await import("../demo-local-assignment-body");

    render(
      <DemoLocalAssignmentBody
        classId="demo-course"
        assignmentId="demo-local-1"
        courseName="Machine Learning"
        courseClass="K01"
        canManage
        isStudent={false}
        currentUserId="teacher-1"
        enrolledStudents={[
          {
            id: "student-1",
            name: "Student One",
            nim: "13521001",
            email: "student-1@eduteams.local",
            gender: "MALE",
            mbtiType: "INTJ",
          },
        ]}
      />,
    );

    const content = screen.getByTestId("assignment-content");
    expect(content.getAttribute("data-has-teams")).toBe("true");
    expect(content.getAttribute("data-allow-persisted-team-actions")).toBe("false");
    expect(content.getAttribute("data-team-member-ids")).toBe('[["student-1"]]');
  });

  it("keeps the paired demo student pending for teacher views until the student submits", async () => {
    const { DemoLocalAssignmentBody } = await import("../demo-local-assignment-body");

    render(
      <DemoLocalAssignmentBody
        classId="demo-course"
        assignmentId="demo-sandbox-assignment"
        courseName="Machine Learning"
        courseClass="K01"
        canManage
        isStudent={false}
        currentUserId="demo-sandbox-teacher"
        enrolledStudents={[
          {
            id: "demo-sandbox-student",
            name: "Bagas Pratama",
            nim: "20260001",
            email: "bagas@eduteams.local",
            gender: "MALE",
            mbtiType: "ENTP",
          },
          {
            id: "demo-sandbox-student-2",
            name: "Alya Rahma",
            nim: "20260002",
            email: "alya@eduteams.local",
            gender: "FEMALE",
            mbtiType: "INFJ",
          },
        ]}
      />,
    );

    const content = screen.getByTestId("assignment-content");
    expect(content.getAttribute("data-submitted-student-ids")).toBe('["demo-sandbox-student-2"]');
    expect(content.getAttribute("data-quiz-completion-percent")).toBe("50");
    expect(content.getAttribute("data-incomplete-student-count")).toBe("1");
  });

  it("filters persisted teams against the current enrolled roster", async () => {
    useDemoSandboxClientStateMock.mockReturnValue({
      createdAssignments: [],
      submittedAssignments: [],
      formedTeams: {
        "demo-local-1": {
          assignmentId: "demo-local-1",
          topicNames: { topic1: "Topic A", topic2: "Topic B" },
          taskIdByIndex: ["topic1", "topic2"],
          teams: [
            {
              id: "team-1",
              quality: 0.95,
              createdAt: "2026-03-03T08:00:00.000Z",
              taskId: "topic1",
              members: [
                {
                  id: "member-1",
                  assignedSkillIds: [],
                  topSkills: ["Skill A"],
                  preferredTopics: ["Topic A"],
                  user: {
                    id: "student-1",
                    name: "Student One",
                    email: "student-1@eduteams.local",
                    mbtiType: "INTJ",
                    nim: "13521001",
                    ei: 0.5,
                    sn: 0.5,
                    tf: 0.5,
                    pj: 0.5,
                    gender: "MALE",
                  },
                },
                {
                  id: "member-2",
                  assignedSkillIds: [],
                  topSkills: ["Skill B"],
                  preferredTopics: ["Topic A"],
                  user: {
                    id: "student-2",
                    name: "Student Two",
                    email: "student-2@eduteams.local",
                    mbtiType: "ENFP",
                    nim: "13521002",
                    ei: 0.5,
                    sn: 0.5,
                    tf: 0.5,
                    pj: 0.5,
                    gender: "FEMALE",
                  },
                },
              ],
            },
            {
              id: "team-2",
              quality: 0.8,
              createdAt: "2026-03-03T08:00:00.000Z",
              taskId: "topic2",
              members: [
                {
                  id: "member-3",
                  assignedSkillIds: [],
                  topSkills: ["Skill C"],
                  preferredTopics: ["Topic B"],
                  user: {
                    id: "student-3",
                    name: "Student Three",
                    email: "student-3@eduteams.local",
                    mbtiType: "ISTJ",
                    nim: "13521003",
                    ei: 0.5,
                    sn: 0.5,
                    tf: 0.5,
                    pj: 0.5,
                    gender: "MALE",
                  },
                },
              ],
            },
          ],
        },
      },
    });

    const { DemoLocalAssignmentBody } = await import("../demo-local-assignment-body");

    render(
      <DemoLocalAssignmentBody
        classId="demo-course"
        assignmentId="demo-local-1"
        courseName="Machine Learning"
        courseClass="K01"
        canManage
        isStudent={false}
        currentUserId="teacher-1"
        enrolledStudents={[
          {
            id: "student-2",
            name: "Student Two",
            nim: "13521002",
            email: "student-2@eduteams.local",
            gender: "FEMALE",
            mbtiType: "ENFP",
          },
        ]}
      />,
    );

    const content = screen.getByTestId("assignment-content");
    expect(content.getAttribute("data-has-teams")).toBe("true");
    expect(content.getAttribute("data-team-member-ids")).toBe('[["student-2"]]');
  });

  it("keeps topic ids aligned with the filtered demo teams", async () => {
    useDemoSandboxClientStateMock.mockReturnValue({
      createdAssignments: [],
      submittedAssignments: [],
      formedTeams: {
        "demo-local-1": {
          assignmentId: "demo-local-1",
          topicNames: { topic1: "Topic A", topic2: "Topic B" },
          taskIdByIndex: ["topic1", "topic2"],
          teams: [
            {
              id: "team-1",
              quality: 0.95,
              createdAt: "2026-03-03T08:00:00.000Z",
              taskId: "topic1",
              members: [
                {
                  id: "member-1",
                  assignedSkillIds: [],
                  topSkills: ["Skill A"],
                  preferredTopics: ["Topic A"],
                  user: {
                    id: "student-1",
                    name: "Student One",
                    email: "student-1@eduteams.local",
                    mbtiType: "INTJ",
                    nim: "13521001",
                    ei: 0.5,
                    sn: 0.5,
                    tf: 0.5,
                    pj: 0.5,
                    gender: "MALE",
                  },
                },
              ],
            },
            {
              id: "team-2",
              quality: 0.8,
              createdAt: "2026-03-03T08:00:00.000Z",
              taskId: "topic2",
              members: [
                {
                  id: "member-3",
                  assignedSkillIds: [],
                  topSkills: ["Skill C"],
                  preferredTopics: ["Topic B"],
                  user: {
                    id: "student-3",
                    name: "Student Three",
                    email: "student-3@eduteams.local",
                    mbtiType: "ISTJ",
                    nim: "13521003",
                    ei: 0.5,
                    sn: 0.5,
                    tf: 0.5,
                    pj: 0.5,
                    gender: "MALE",
                  },
                },
              ],
            },
          ],
        },
      },
    });

    const { DemoLocalAssignmentBody } = await import("../demo-local-assignment-body");

    render(
      <DemoLocalAssignmentBody
        classId="demo-course"
        assignmentId="demo-local-1"
        courseName="Machine Learning"
        courseClass="K01"
        canManage
        isStudent={false}
        currentUserId="teacher-1"
        enrolledStudents={[
          {
            id: "student-3",
            name: "Student Three",
            nim: "13521003",
            email: "student-3@eduteams.local",
            gender: "MALE",
            mbtiType: "ISTJ",
          },
        ]}
      />,
    );

    const content = screen.getByTestId("assignment-content");
    expect(content.getAttribute("data-team-member-ids")).toBe('[["student-3"]]');
    expect(content.getAttribute("data-task-ids")).toBe('["topic2"]');
  });
});
