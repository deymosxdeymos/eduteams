"use client";

import { useSyncExternalStore } from "react";
import type { DemoRole } from "@/lib/demo/config";
import { DEMO_VISITOR_PUBLIC_COOKIE_NAME } from "@/lib/demo/cookies";
import {
  DEFAULT_DEMO_SANDBOX_CLIENT_STATE,
  normalizeDemoSandboxClientState,
} from "@/lib/demo/sandbox-client-state";
import type {
  DemoLocalAssignment,
  DemoLocalTeam,
  DemoLocalTeamFormation,
  DemoLocalTeamMember,
  DemoSandboxClientState,
} from "@/lib/demo/sandbox-client-state";
import {
  DEMO_SANDBOX_STORAGE_KEY,
  DEMO_TEAM_FORMATION_STORAGE_EVENT,
  isDemoSandboxAssignmentId,
} from "@/lib/demo/sandbox-shared";
import { subscribeToDemoSandboxChanges } from "@/lib/demo/sandbox-storage-shared";
import {
  DEMO_SANDBOX_SUBMISSIONS_COOKIE_NAME,
  normalizeDemoSandboxSubmittedAssignmentIds,
  serializeDemoSandboxSubmissionsCookieValue,
} from "@/lib/demo/sandbox-submissions-shared";
import type { AssignmentResponse } from "@/lib/validation/assignments";

export type {
  DemoLocalAssignment,
  DemoLocalTeam,
  DemoLocalTeamFormation,
  DemoLocalTeamMember,
  DemoSandboxClientState,
} from "@/lib/demo/sandbox-client-state";

const DEMO_VISITOR_ID_PATTERN = /^[a-z0-9_-]{8,64}$/i;
const DEMO_SANDBOX_STORAGE_KEY_PREFIX = `${DEMO_SANDBOX_STORAGE_KEY}:`;
const DEMO_SANDBOX_STORAGE_KEYS_KEY = `${DEMO_SANDBOX_STORAGE_KEY}:keys`;
const MAX_TRACKED_DEMO_SANDBOX_STORAGE_KEYS = 16;

const demoSandboxClientCache = {
  trackedStorageKeys: {
    raw: undefined as string | null | undefined,
    values: [] as string[],
  },
  snapshot: {
    raw: undefined as string | null | undefined,
    key: undefined as string | null | undefined,
    exists: false,
    state: DEFAULT_DEMO_SANDBOX_CLIENT_STATE as DemoSandboxClientState,
  },
};

function readCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${name}=`;

  for (const cookie of document.cookie.split(";")) {
    const trimmedCookie = cookie.trim();
    if (!trimmedCookie.startsWith(prefix)) {
      continue;
    }

    try {
      const value = decodeURIComponent(trimmedCookie.slice(prefix.length));
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
  return `${DEMO_SANDBOX_STORAGE_KEY_PREFIX}${visitorId}`;
}

function normalizeTrackedDemoSandboxStorageKeys(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return Array.from(
    new Set(
      value.filter(
        (storageKey): storageKey is string =>
          typeof storageKey === "string" &&
          storageKey.startsWith(DEMO_SANDBOX_STORAGE_KEY_PREFIX) &&
          storageKey !== DEMO_SANDBOX_STORAGE_KEYS_KEY,
      ),
    ),
  );
}

function pruneTrackedDemoSandboxStorageKeys(storageKeys: readonly string[]) {
  if (typeof window === "undefined") {
    return normalizeTrackedDemoSandboxStorageKeys(storageKeys).slice(
      -MAX_TRACKED_DEMO_SANDBOX_STORAGE_KEYS,
    );
  }

  return normalizeTrackedDemoSandboxStorageKeys(storageKeys)
    .filter((storageKey) => window.localStorage.getItem(storageKey) !== null)
    .slice(-MAX_TRACKED_DEMO_SANDBOX_STORAGE_KEYS);
}

function setTrackedDemoSandboxStorageKeysCache(
  raw: string | null | undefined,
  storageKeys: string[],
) {
  demoSandboxClientCache.trackedStorageKeys.raw = raw;
  demoSandboxClientCache.trackedStorageKeys.values = storageKeys;
}

function getTrackedDemoSandboxStorageKeys() {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  const raw = window.localStorage.getItem(DEMO_SANDBOX_STORAGE_KEYS_KEY);
  if (raw === demoSandboxClientCache.trackedStorageKeys.raw) {
    return demoSandboxClientCache.trackedStorageKeys.values;
  }

  if (!raw) {
    setTrackedDemoSandboxStorageKeysCache(raw, []);
    return [];
  }

  try {
    const trackedStorageKeys = pruneTrackedDemoSandboxStorageKeys(JSON.parse(raw));

    if (trackedStorageKeys.length === 0) {
      window.localStorage.removeItem(DEMO_SANDBOX_STORAGE_KEYS_KEY);
      setTrackedDemoSandboxStorageKeysCache(null, []);
      return [];
    }

    const serialized = JSON.stringify(trackedStorageKeys);
    if (serialized !== raw) {
      window.localStorage.setItem(DEMO_SANDBOX_STORAGE_KEYS_KEY, serialized);
      setTrackedDemoSandboxStorageKeysCache(serialized, trackedStorageKeys);
      return trackedStorageKeys;
    }

    setTrackedDemoSandboxStorageKeysCache(raw, trackedStorageKeys);
    return trackedStorageKeys;
  } catch {
    setTrackedDemoSandboxStorageKeysCache(raw, []);
    return [];
  }
}

function setTrackedDemoSandboxStorageKeys(storageKeys: readonly string[]) {
  if (typeof window === "undefined") {
    return;
  }

  const nextStorageKeys = pruneTrackedDemoSandboxStorageKeys(storageKeys);

  if (nextStorageKeys.length === 0) {
    window.localStorage.removeItem(DEMO_SANDBOX_STORAGE_KEYS_KEY);
    setTrackedDemoSandboxStorageKeysCache(null, []);
    return;
  }

  const serialized = JSON.stringify(nextStorageKeys);
  window.localStorage.setItem(DEMO_SANDBOX_STORAGE_KEYS_KEY, serialized);
  setTrackedDemoSandboxStorageKeysCache(serialized, nextStorageKeys);
}

function trackDemoSandboxStorageKey(storageKey: string) {
  if (typeof window === "undefined") {
    return;
  }

  const trackedStorageKeys = getTrackedDemoSandboxStorageKeys();
  if (trackedStorageKeys.includes(storageKey)) {
    return;
  }

  setTrackedDemoSandboxStorageKeys([...trackedStorageKeys, storageKey]);
}

function getActiveDemoSandboxStorageKey() {
  const visitorId = getDemoSandboxVisitorId();

  if (!visitorId) {
    return null;
  }

  return getDemoSandboxStorageKey(visitorId);
}

function persistMigratedDemoSandboxClientState(storageKey: string, state: DemoSandboxClientState) {
  const serialized = JSON.stringify(state);
  window.localStorage.setItem(storageKey, serialized);
  trackDemoSandboxStorageKey(storageKey);
  setDemoSandboxClientStateCache(storageKey, serialized, true, state);
  syncDemoSandboxSubmissionCookie(state.submittedAssignments);
}

export function getDemoSandboxClientSnapshot() {
  if (typeof window === "undefined") {
    return { exists: false, state: DEFAULT_DEMO_SANDBOX_CLIENT_STATE };
  }

  const storageKey = getActiveDemoSandboxStorageKey();
  if (!storageKey) {
    return { exists: false, state: DEFAULT_DEMO_SANDBOX_CLIENT_STATE };
  }

  const raw = window.localStorage.getItem(storageKey);
  if (
    raw === demoSandboxClientCache.snapshot.raw &&
    storageKey === demoSandboxClientCache.snapshot.key
  ) {
    return {
      exists: demoSandboxClientCache.snapshot.exists,
      state: demoSandboxClientCache.snapshot.state,
    };
  }

  return readAndCacheDemoSandboxClientState(storageKey, raw);
}

export function hasDemoSandboxClientState() {
  return getDemoSandboxClientSnapshot().exists;
}

function writeCookie(name: string, value: string, options?: { maxAge?: number }) {
  if (typeof document === "undefined") {
    return;
  }

  const parts = [`${name}=${encodeURIComponent(value)}`, "path=/", "SameSite=Lax"];

  if (typeof options?.maxAge === "number") {
    parts.push(`Max-Age=${options.maxAge}`);
  }

  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }

  document.cookie = parts.join("; ");
}

function clearCookie(name: string) {
  if (typeof document === "undefined") {
    return;
  }

  const parts = [`${name}=`, "expires=Thu, 01 Jan 1970 00:00:00 GMT", "path=/", "SameSite=Lax"];

  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }

  document.cookie = parts.join("; ");
}

function syncDemoSandboxSubmissionCookie(assignmentIds: readonly string[]) {
  if (assignmentIds.length === 0) {
    clearCookie(DEMO_SANDBOX_SUBMISSIONS_COOKIE_NAME);
    return;
  }

  writeCookie(
    DEMO_SANDBOX_SUBMISSIONS_COOKIE_NAME,
    serializeDemoSandboxSubmissionsCookieValue(assignmentIds),
    {
      maxAge: 60 * 60 * 24 * 30,
    },
  );
}

const subscribeToDemoSandboxState = subscribeToDemoSandboxChanges;

function setDemoSandboxClientStateCache(
  storageKey: string | null | undefined,
  raw: string | null | undefined,
  exists: boolean,
  state: DemoSandboxClientState,
) {
  demoSandboxClientCache.snapshot.raw = raw;
  demoSandboxClientCache.snapshot.key = storageKey;
  demoSandboxClientCache.snapshot.exists = exists;
  demoSandboxClientCache.snapshot.state = state;
}

function resetCache() {
  demoSandboxClientCache.trackedStorageKeys.raw = undefined;
  demoSandboxClientCache.trackedStorageKeys.values = [];
  setDemoSandboxClientStateCache(undefined, undefined, false, DEFAULT_DEMO_SANDBOX_CLIENT_STATE);
}

function readAndCacheDemoSandboxClientState(storageKey: string, raw: string | null) {
  if (!raw) {
    setDemoSandboxClientStateCache(storageKey, raw, false, DEFAULT_DEMO_SANDBOX_CLIENT_STATE);
    return { exists: false, state: DEFAULT_DEMO_SANDBOX_CLIENT_STATE } as const;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DemoSandboxClientState>;
    const normalizedState = normalizeDemoSandboxClientState(parsed);

    if (!normalizedState) {
      setDemoSandboxClientStateCache(storageKey, raw, false, DEFAULT_DEMO_SANDBOX_CLIENT_STATE);
      return { exists: false, state: DEFAULT_DEMO_SANDBOX_CLIENT_STATE } as const;
    }

    if (normalizedState.didMigrate) {
      persistMigratedDemoSandboxClientState(storageKey, normalizedState.state);
      return { exists: true, state: demoSandboxClientCache.snapshot.state } as const;
    }

    trackDemoSandboxStorageKey(storageKey);
    setDemoSandboxClientStateCache(storageKey, raw, true, normalizedState.state);
    return { exists: true, state: demoSandboxClientCache.snapshot.state } as const;
  } catch {
    setDemoSandboxClientStateCache(storageKey, raw, false, DEFAULT_DEMO_SANDBOX_CLIENT_STATE);
    return { exists: false, state: DEFAULT_DEMO_SANDBOX_CLIENT_STATE } as const;
  }
}

export function getDemoSandboxClientState(): DemoSandboxClientState {
  return getDemoSandboxClientSnapshot().state;
}

export function useDemoSandboxClientState() {
  return useSyncExternalStore(
    subscribeToDemoSandboxState,
    getDemoSandboxClientState,
    () => DEFAULT_DEMO_SANDBOX_CLIENT_STATE,
  );
}

function haveSameSubmittedAssignments(nextAssignments: string[], previousAssignments: string[]) {
  return (
    nextAssignments.length === previousAssignments.length &&
    nextAssignments.every((assignmentId, index) => assignmentId === previousAssignments[index])
  );
}

export function setDemoSandboxClientState(
  updater: DemoSandboxClientState | ((state: DemoSandboxClientState) => DemoSandboxClientState),
) {
  if (typeof window === "undefined") {
    return DEFAULT_DEMO_SANDBOX_CLIENT_STATE;
  }

  const storageKey = getActiveDemoSandboxStorageKey();
  if (!storageKey) {
    return DEFAULT_DEMO_SANDBOX_CLIENT_STATE;
  }

  const currentState = getDemoSandboxClientState();
  const nextStateInput = typeof updater === "function" ? updater(currentState) : updater;

  if (nextStateInput === currentState) {
    return currentState;
  }

  const nextState = {
    ...nextStateInput,
    submittedAssignments: normalizeDemoSandboxSubmittedAssignmentIds(
      nextStateInput.submittedAssignments,
    ),
  } satisfies DemoSandboxClientState;
  const serialized = JSON.stringify(nextState);

  if (
    serialized === demoSandboxClientCache.snapshot.raw &&
    storageKey === demoSandboxClientCache.snapshot.key
  ) {
    return currentState;
  }

  window.localStorage.setItem(storageKey, serialized);
  trackDemoSandboxStorageKey(storageKey);
  setDemoSandboxClientStateCache(storageKey, serialized, true, nextState);

  if (
    !haveSameSubmittedAssignments(nextState.submittedAssignments, currentState.submittedAssignments)
  ) {
    syncDemoSandboxSubmissionCookie(nextState.submittedAssignments);
  }

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

export function markDemoAssignmentSubmitted(assignmentId: string) {
  return setDemoSandboxClientState((state) => ({
    ...state,
    submittedAssignments: normalizeDemoSandboxSubmittedAssignmentIds([
      ...state.submittedAssignments,
      assignmentId,
    ]),
  }));
}

export function clearDemoSandboxClientState() {
  if (typeof window === "undefined") {
    return;
  }

  const activeStorageKey = getActiveDemoSandboxStorageKey();
  const storageKeys = new Set(getTrackedDemoSandboxStorageKeys());

  if (activeStorageKey) {
    storageKeys.add(activeStorageKey);
  }

  for (const storageKey of storageKeys) {
    window.localStorage.removeItem(storageKey);
  }

  setTrackedDemoSandboxStorageKeys([]);
  resetCache();

  clearCookie(DEMO_SANDBOX_SUBMISSIONS_COOKIE_NAME);
  window.localStorage.removeItem(DEMO_SANDBOX_STORAGE_KEY);
  window.dispatchEvent(new Event(DEMO_TEAM_FORMATION_STORAGE_EVENT));
}
