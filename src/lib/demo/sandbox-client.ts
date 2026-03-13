"use client";

import { useSyncExternalStore } from "react";
import type { DemoRole } from "@/lib/demo/config";
import { DEMO_VISITOR_PUBLIC_COOKIE_NAME } from "@/lib/demo/cookies";
import {
  DEMO_SANDBOX_STORAGE_KEY,
  DEMO_TEAM_FORMATION_STORAGE_EVENT,
  isDemoSandboxAssignmentId,
} from "@/lib/demo/sandbox-shared";
import type { AssignmentResponse } from "@/lib/validation/assignments";

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

type DemoSandboxClientState = {
  version: 1;
  currentRole: DemoRole;
  onboardingCompleted: boolean;
  welcomeSplashSeen: boolean;
  createdAssignments: DemoLocalAssignment[];
  formedTeams: Record<string, DemoLocalTeamFormation>;
};

const DEFAULT_STATE: DemoSandboxClientState = {
  version: 1,
  currentRole: "TEACHER",
  onboardingCompleted: true,
  welcomeSplashSeen: true,
  createdAssignments: [],
  formedTeams: {},
};

const DEMO_VISITOR_ID_PATTERN = /^[a-z0-9_-]{8,64}$/i;

function readCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const [rawName, ...rawValueParts] = cookie.trim().split("=");
    if (rawName !== name) {
      continue;
    }

    try {
      const value = decodeURIComponent(rawValueParts.join("=")).trim();
      return value.length > 0 ? value : null;
    } catch {
      return null;
    }
  }

  return null;
}

function getDemoSandboxVisitorId() {
  const value = readCookie(DEMO_VISITOR_PUBLIC_COOKIE_NAME);

  if (!value || !DEMO_VISITOR_ID_PATTERN.test(value)) {
    return null;
  }

  return value;
}

function getDemoSandboxStorageKey(visitorId: string) {
  return `${DEMO_SANDBOX_STORAGE_KEY}:${visitorId}`;
}

function getActiveDemoSandboxStorageKey() {
  const visitorId = getDemoSandboxVisitorId();

  if (!visitorId) {
    return null;
  }

  return getDemoSandboxStorageKey(visitorId);
}

function subscribeToDemoSandboxState(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = () => onStoreChange();
  window.addEventListener(DEMO_TEAM_FORMATION_STORAGE_EVENT, handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    window.removeEventListener(DEMO_TEAM_FORMATION_STORAGE_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

export function getDemoSandboxClientState(): DemoSandboxClientState {
  if (typeof window === "undefined") {
    return DEFAULT_STATE;
  }

  const storageKey = getActiveDemoSandboxStorageKey();
  if (!storageKey) {
    return DEFAULT_STATE;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return DEFAULT_STATE;
    }

    const parsed = JSON.parse(raw) as Partial<DemoSandboxClientState>;
    if (parsed.version !== 1) {
      return DEFAULT_STATE;
    }

    return {
      ...DEFAULT_STATE,
      ...parsed,
      createdAssignments: parsed.createdAssignments ?? [],
      formedTeams: parsed.formedTeams ?? {},
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function useDemoSandboxClientState() {
  return useSyncExternalStore(
    subscribeToDemoSandboxState,
    getDemoSandboxClientState,
    () => DEFAULT_STATE,
  );
}

export function setDemoSandboxClientState(
  updater: DemoSandboxClientState | ((state: DemoSandboxClientState) => DemoSandboxClientState),
) {
  if (typeof window === "undefined") {
    return DEFAULT_STATE;
  }

  const storageKey = getActiveDemoSandboxStorageKey();
  if (!storageKey) {
    return DEFAULT_STATE;
  }

  const nextState = typeof updater === "function" ? updater(getDemoSandboxClientState()) : updater;

  window.localStorage.setItem(storageKey, JSON.stringify(nextState));
  window.dispatchEvent(new Event(DEMO_TEAM_FORMATION_STORAGE_EVENT));

  return nextState;
}

export function setDemoSandboxRole(role: DemoRole) {
  return setDemoSandboxClientState((state) => ({
    ...state,
    currentRole: role,
    onboardingCompleted: true,
  }));
}

export function addDemoCreatedAssignment(assignment: DemoLocalAssignment) {
  return setDemoSandboxClientState((state) => ({
    ...state,
    createdAssignments: [
      assignment,
      ...state.createdAssignments.filter((item) => item.id !== assignment.id),
    ],
  }));
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function persistDemoCreatedAssignment(
  assignment: Pick<
    AssignmentResponse,
    | "id"
    | "courseId"
    | "title"
    | "description"
    | "startAt"
    | "createdAt"
    | "skills"
    | "topics"
    | "submissionsCount"
  >,
) {
  if (!isDemoSandboxAssignmentId(assignment.id)) {
    return;
  }

  addDemoCreatedAssignment({
    id: assignment.id,
    courseId: assignment.courseId,
    title: assignment.title,
    description: assignment.description ?? null,
    startAt: toIsoString(assignment.startAt),
    createdAt: toIsoString(assignment.createdAt),
    skills: [...assignment.skills],
    topics: [...assignment.topics],
    submissionsCount: assignment.submissionsCount,
  });
}

export function getDemoCreatedAssignments(courseId?: string) {
  const state = getDemoSandboxClientState();
  return courseId
    ? state.createdAssignments.filter((item) => item.courseId === courseId)
    : state.createdAssignments;
}

export function saveDemoTeamFormation(result: DemoLocalTeamFormation) {
  return setDemoSandboxClientState((state) => ({
    ...state,
    formedTeams: {
      ...state.formedTeams,
      [result.assignmentId]: result,
    },
  }));
}

export function persistDemoTeamFormation(result: DemoLocalTeamFormation) {
  if (!isDemoSandboxAssignmentId(result.assignmentId)) {
    return;
  }

  saveDemoTeamFormation(result);
}

export function getDemoTeamFormation(assignmentId: string) {
  return getDemoSandboxClientState().formedTeams[assignmentId] ?? null;
}

export function getDemoAssignmentStatus(assignmentId: string): AssignmentResponse["status"] {
  return getDemoTeamFormation(assignmentId) ? "BERHASIL_PEMBAGIAN_GRUP" : "MENUNGGU";
}

type DemoStatusAssignment = {
  id: string;
  status: AssignmentResponse["status"];
};

function applyDemoAssignmentStatus<T extends DemoStatusAssignment>(assignment: T): T {
  if (!isDemoSandboxAssignmentId(assignment.id)) {
    return assignment;
  }

  const nextStatus = getDemoAssignmentStatus(assignment.id);
  if (assignment.status === nextStatus) {
    return assignment;
  }

  return {
    ...assignment,
    status: nextStatus,
  };
}

export function mergeDemoAssignments<T extends DemoStatusAssignment>(
  serverAssignments: T[],
  localAssignments: T[],
) {
  const localAssignmentIds = new Set(localAssignments.map((assignment) => assignment.id));

  return [
    ...localAssignments.map(applyDemoAssignmentStatus),
    ...serverAssignments
      .filter((assignment) => !localAssignmentIds.has(assignment.id))
      .map(applyDemoAssignmentStatus),
  ];
}

export function clearDemoSandboxClientState() {
  if (typeof window === "undefined") {
    return;
  }

  const storageKeys = Array.from({ length: window.localStorage.length }, (_, index) =>
    window.localStorage.key(index),
  ).filter((key): key is string => Boolean(key?.startsWith(`${DEMO_SANDBOX_STORAGE_KEY}:`)));

  for (const storageKey of storageKeys) {
    window.localStorage.removeItem(storageKey);
  }

  window.localStorage.removeItem(DEMO_SANDBOX_STORAGE_KEY);
  window.dispatchEvent(new Event(DEMO_TEAM_FORMATION_STORAGE_EVENT));
}
