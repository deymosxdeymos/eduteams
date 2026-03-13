"use client";

import { useMemo } from "react";
import { AssignmentContent } from "@/components/dashboard/assignment-content";
import type { Gender } from "@/generated/prisma/client";
import {
  getDemoAssignmentDefinition,
  getDemoAssignmentStatsForDefinition,
} from "@/lib/demo/sandbox";
import { useDemoSandboxClientState } from "@/lib/demo/sandbox-client";

interface DemoLocalAssignmentBodyProps {
  classId: string;
  assignmentId: string;
  courseName: string;
  courseClass: string;
  canManage: boolean;
  isStudent: boolean;
  currentUserId: string;
  initialTitle?: string;
  initialSkills?: readonly string[];
  initialTopics?: readonly string[];
  initialSubmissionsCount?: number;
  enrolledStudents: Array<{
    id: string;
    name: string;
    nim: string;
    email: string;
    gender: string | null;
    mbtiType?: string | null;
  }>;
}

export function DemoLocalAssignmentBody({
  classId,
  assignmentId,
  courseName,
  courseClass,
  canManage,
  isStudent,
  currentUserId,
  initialTitle,
  initialSkills,
  initialTopics,
  initialSubmissionsCount,
  enrolledStudents,
}: DemoLocalAssignmentBodyProps) {
  const sandboxState = useDemoSandboxClientState();
  const assignment = useMemo(
    () => sandboxState.createdAssignments.find((item) => item.id === assignmentId) ?? null,
    [assignmentId, sandboxState.createdAssignments],
  );
  const formedTeams = sandboxState.formedTeams[assignmentId] ?? null;
  const fallbackDefinition = useMemo(
    () =>
      getDemoAssignmentDefinition({
        title: initialTitle,
        skills: initialSkills,
        topics: initialTopics,
      }),
    [initialSkills, initialTitle, initialTopics],
  );

  const normalizedEnrolledStudents = useMemo(
    () =>
      enrolledStudents.map((student) => ({
        ...student,
        mbtiType: student.mbtiType ?? null,
      })),
    [enrolledStudents],
  );
  const enrolledStudentIds = useMemo(
    () => new Set(normalizedEnrolledStudents.map((student) => student.id)),
    [normalizedEnrolledStudents],
  );
  const assignmentTitle = assignment?.title ?? fallbackDefinition.title;
  const assignmentSkills = assignment?.skills ?? fallbackDefinition.skills;
  const assignmentTopics = assignment?.topics ?? fallbackDefinition.topics;
  const visibleTeamFormation = useMemo(() => {
    if (!formedTeams) {
      return null;
    }

    const teams = [];
    const taskIdByIndex = [];

    for (const [index, team] of formedTeams.teams.entries()) {
      const members = team.members
        .filter((member) => enrolledStudentIds.has(member.user.id))
        .map((member) => ({
          ...member,
          user: {
            ...member.user,
            gender: (member.user.gender === "MALE" || member.user.gender === "FEMALE"
              ? member.user.gender
              : null) as Gender | null,
          },
        }));

      if (members.length === 0) {
        continue;
      }

      const taskId = team.taskId ?? formedTeams.taskIdByIndex[index] ?? "";
      teams.push({
        ...team,
        createdAt: new Date(team.createdAt),
        members,
        taskId,
      });
      taskIdByIndex.push(taskId);
    }

    return {
      ...formedTeams,
      teams,
      taskIdByIndex,
    };
  }, [formedTeams, enrolledStudentIds]);
  const teams = visibleTeamFormation?.teams ?? [];
  const assignmentStats = getDemoAssignmentStatsForDefinition({
    skills: assignmentSkills,
    topics: assignmentTopics,
    includedStudentIds: normalizedEnrolledStudents.map((student) => student.id),
    quizSubmissions:
      assignment?.submissionsCount ?? initialSubmissionsCount ?? normalizedEnrolledStudents.length,
    teamsFormed: teams.length > 0,
  });

  return (
    <AssignmentContent
      assignmentId={assignmentId}
      classId={classId}
      courseId={classId}
      demoSkills={assignmentSkills}
      demoTopics={assignmentTopics}
      assignmentTitleLabel={assignmentTitle}
      courseNameLabel={courseName}
      courseClassLabel={courseClass}
      canManage={canManage}
      isStudent={isStudent}
      hasSubmitted={true}
      stats={assignmentStats}
      hasTeams={teams.length > 0}
      allowPersistedTeamActions={false}
      topicCount={assignmentTopics.length}
      enrollmentCount={normalizedEnrolledStudents.length}
      quizCompletionPercent={100}
      teams={teams}
      topicNames={visibleTeamFormation?.topicNames ?? {}}
      taskIdByIndex={visibleTeamFormation?.taskIdByIndex ?? []}
      isTeamFormationProcessing={false}
      incompleteStudentCount={0}
      currentUserId={currentUserId}
      enrolledStudents={normalizedEnrolledStudents}
      submittedStudentIds={normalizedEnrolledStudents.map((student) => student.id)}
    />
  );
}
