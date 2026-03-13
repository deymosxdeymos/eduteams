import type { TeamFormationStatus } from "@/generated/prisma/client";
import type { Edu2comParameters, Edu2comTeamsResponse } from "@/lib/edu2com/contract";
import type { Edu2comWeights } from "@/lib/edu2com/config";

export type TeamFormationProviderName = "local" | "edu2com";
export type TeamFormationExecutionMode = "sync" | "async";
export type TeamFormationMethod = "JUMLAH_KELOMPOK" | "JUMLAH_MHS_PER_KELOMPOK";

export interface BuiltTeamFormationPayload {
  assignment: {
    id: string;
    courseId: string;
    description: string | null;
    ownerId: string;
  };
  owner: {
    id: string;
  };
  method: TeamFormationMethod;
  value: number;
  people: Edu2comParameters["people"];
  tasks: Edu2comParameters["tasks"];
  weights: Edu2comWeights;
  initRandom: boolean;
  requestData: Edu2comParameters;
  counts: {
    enrolledStudents: number;
    submittedStudents: number;
    eligibleStudents: number;
    excludedWithoutSubmission: number;
    excludedWithoutCompletePersonality: number;
    taskCount: number;
    totalTeamCapacity: number;
  };
}

export interface PersistedTeamFormationRequest {
  id: string;
  ownerId: string;
  assignmentId: string | null;
  provider: TeamFormationProviderName;
  status: TeamFormationStatus;
  replyPostUrl: string | null;
}

export interface TeamFormationLaunchResult {
  requestId: string;
  provider: TeamFormationProviderName;
  mode: TeamFormationExecutionMode;
  status: Extract<TeamFormationStatus, "PROCESSING" | "COMPLETED">;
}

export interface TeamFormationCompletionInput {
  teamsPayload: Edu2comTeamsResponse;
}
