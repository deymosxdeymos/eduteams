import type { DemoRole } from "@/lib/demo/config";
import { normalizeDemoSandboxSubmittedAssignmentIds } from "@/lib/demo/sandbox-submissions-shared";

export type DemoLocalAssignment = {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  startAt: string;
  createdAt: string;
  skills: string[];
  topics: string[];
  submissionsCount: number;
};

export type DemoLocalTeamMember = {
  id: string;
  assignedSkillIds?: string[];
  topSkills?: string[];
  preferredTopics?: string[];
  user: {
    id: string;
    name: string;
    email?: string;
    mbtiType?: string | null;
    nim?: string;
    ei?: number | null;
    sn?: number | null;
    tf?: number | null;
    pj?: number | null;
    gender?: string | null;
  };
};

export type DemoLocalTeam = {
  id: string;
  quality: number | null;
  createdAt: string;
  taskId?: string;
  members: DemoLocalTeamMember[];
};

export type DemoLocalTeamFormation = {
  assignmentId: string;
  topicNames: Record<string, string>;
  taskIdByIndex: string[];
  teams: DemoLocalTeam[];
};

export type DemoSandboxClientState = {
  version: 1;
  currentRole: DemoRole;
  onboardingCompleted: boolean;
  welcomeSplashSeen: boolean;
  createdAssignments: DemoLocalAssignment[];
  formedTeams: Record<string, DemoLocalTeamFormation>;
  submittedAssignments: string[];
};

export const DEFAULT_DEMO_SANDBOX_CLIENT_STATE: DemoSandboxClientState = {
  version: 1,
  currentRole: "TEACHER",
  onboardingCompleted: true,
  welcomeSplashSeen: true,
  createdAssignments: [],
  formedTeams: {},
  submittedAssignments: [],
};

function normalizeMigratedDemoSandboxSubmittedAssignments(
  parsed: Partial<DemoSandboxClientState>,
  createdAssignments: DemoLocalAssignment[],
) {
  if (Array.isArray(parsed.submittedAssignments)) {
    return {
      submittedAssignments: normalizeDemoSandboxSubmittedAssignmentIds(parsed.submittedAssignments),
      didMigrate: false,
    };
  }

  return {
    submittedAssignments: normalizeDemoSandboxSubmittedAssignmentIds(
      createdAssignments.map((assignment) => assignment.id),
    ),
    didMigrate: true,
  };
}

export function normalizeDemoSandboxClientState(parsed: Partial<DemoSandboxClientState>) {
  if (parsed.version !== 1) {
    return null;
  }

  const createdAssignments = Array.isArray(parsed.createdAssignments)
    ? parsed.createdAssignments
    : [];
  const formedTeams =
    parsed.formedTeams && typeof parsed.formedTeams === "object" ? parsed.formedTeams : {};
  const { submittedAssignments, didMigrate } = normalizeMigratedDemoSandboxSubmittedAssignments(
    parsed,
    createdAssignments,
  );

  return {
    didMigrate,
    state: {
      ...DEFAULT_DEMO_SANDBOX_CLIENT_STATE,
      ...parsed,
      createdAssignments,
      formedTeams,
      submittedAssignments,
    } satisfies DemoSandboxClientState,
  };
}
