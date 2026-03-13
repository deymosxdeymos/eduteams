"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { StudentManageShell } from "@/components/dashboard/student-manage-shell";
import { getLocalizedHref } from "@/i18n/routing";
import {
  buildDemoAssignmentHref,
  buildDemoAssignmentQuizHref,
  getDemoSandboxPrincipalId,
  getDemoStudentManageItems,
} from "@/lib/demo/sandbox";
import { useDemoSandboxClientState } from "@/lib/demo/sandbox-client";
import type { ExtendedUser } from "@/lib/types";
import type { GroupListItem } from "@/types/manage";

interface DemoStudentManageContentProps {
  user: ExtendedUser;
  serverItems?: GroupListItem[];
}

export function DemoStudentManageContent({
  user,
  serverItems = [],
}: DemoStudentManageContentProps) {
  const locale = useLocale();
  const sandboxState = useDemoSandboxClientState();
  const currentUserId = getDemoSandboxPrincipalId(user) ?? user.id;

  const items = useMemo(() => {
    const baseItems = getDemoStudentManageItems();
    const createdAssignments = sandboxState.createdAssignments.map((assignment) => ({
      id: assignment.id,
      courseId: assignment.courseId,
      taskTitle: assignment.title,
      className: "Machine Learning K01",
      academicYear: "2025/2026",
      status: sandboxState.formedTeams[assignment.id]
        ? ("waiting" as const)
        : ("not-started" as const),
      href: buildDemoAssignmentHref({
        classId: assignment.courseId,
        assignmentId: assignment.id,
        title: assignment.title,
        skills: assignment.skills,
        topics: assignment.topics,
      }),
      quizHref: buildDemoAssignmentQuizHref({
        classId: assignment.courseId,
        assignmentId: assignment.id,
        title: assignment.title,
        skills: assignment.skills,
        topics: assignment.topics,
      }),
      startAt: assignment.startAt,
      description: assignment.description ?? null,
    }));

    return [...createdAssignments, ...serverItems, ...baseItems].map((item) => {
      const localizedItem = {
        ...item,
        href: getLocalizedHref(
          locale,
          item.href ?? `/dashboard/class/${item.courseId}/assignments/${item.id}`,
        ),
        quizHref: getLocalizedHref(
          locale,
          item.quizHref ?? `/dashboard/class/${item.courseId}/assignments/${item.id}/quiz`,
        ),
      };
      const localTeams = sandboxState.formedTeams[item.id];
      if (!localTeams) {
        return localizedItem;
      }

      const myTeam = localTeams.teams.find((team) =>
        team.members.some((member) => member.user.id === currentUserId),
      );

      if (!myTeam) {
        return localizedItem;
      }

      return {
        ...localizedItem,
        status: "my-group" as const,
        teamName: `Kelompok ${String.fromCharCode(65 + localTeams.teams.indexOf(myTeam))}`,
        teamQuality: myTeam.quality ?? undefined,
        teamMembers: myTeam.members.map((member) => ({
          id: member.id,
          user: {
            id: member.user.id,
            name: member.user.name,
            mbtiType: member.user.mbtiType ?? null,
          },
        })),
      };
    });
  }, [
    currentUserId,
    locale,
    sandboxState.createdAssignments,
    sandboxState.formedTeams,
    serverItems,
  ]);

  return (
    <section className="flex h-full flex-col rounded-3xl bg-white px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Tugas Saya</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Demo sandbox items and persisted class assignments are shown together here.
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <StudentManageShell items={items} isLoading={false} />
      </div>
    </section>
  );
}
