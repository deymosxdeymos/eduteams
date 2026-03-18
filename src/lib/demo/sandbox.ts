import type { Gender, MBTIType } from "@/generated/prisma/client";
import type { DashboardStatistics } from "@/lib/dashboard/statistics";
import type { AssignmentStats } from "@/lib/stats/assignment";
import type { Course, ExtendedUser } from "@/lib/types";
import type { AssignmentClient, AssignmentResponse } from "@/lib/validation/assignments";
import type { GroupListItem, ManageAssignmentRow, ManageCourseRow } from "@/types/manage";
import {
  calculateDemoDashboardStatistics,
  type DemoDashboardStatisticsState,
} from "@/lib/demo/dashboard-statistics";
import { getDemoRequiredSecret } from "@/lib/demo/env";
import { isDemoAccountEmail, parseDemoRoleFromEmail } from "@/lib/demo/identity";
import {
  DEMO_ASSIGNMENT_ID,
  DEMO_COURSE_ID,
  DEMO_LOCAL_ASSIGNMENT_ID_PREFIX,
  DEMO_SANDBOX_STORAGE_KEY,
  DEMO_TEAM_FORMATION_STORAGE_EVENT,
  isDemoSandboxAssignmentId,
  isLocalDemoAssignmentId,
} from "@/lib/demo/sandbox-shared";

export {
  DEMO_ASSIGNMENT_ID,
  DEMO_COURSE_ID,
  DEMO_LOCAL_ASSIGNMENT_ID_PREFIX,
  DEMO_SANDBOX_STORAGE_KEY,
  DEMO_TEAM_FORMATION_STORAGE_EVENT,
  isDemoSandboxAssignmentId,
  isLocalDemoAssignmentId,
} from "@/lib/demo/sandbox-shared";

export const DEMO_SANDBOX_COOKIE_NAME = "eduteams-demo-sandbox";
export const DEMO_SANDBOX_VISITOR_ID = "sandboxdemo";
export const DEMO_TEACHER_ID = "demo-sandbox-teacher";
export const DEMO_STUDENT_ID = "demo-sandbox-student";

const DEMO_SANDBOX_COOKIE_SIGNATURE_ALGORITHM = "HMAC";
const DEMO_SANDBOX_COOKIE_SIGNATURE_HASH = "SHA-256";
const DEMO_DEFAULT_LOCALE = "id";
const DEMO_NOW = new Date("2026-03-01T09:00:00.000Z");
const DEMO_ASSIGNMENT_START = new Date("2026-03-03T08:00:00.000Z");
const DEMO_UPDATED_AT = new Date("2026-03-04T10:30:00.000Z");
const MBTI_ORDER: MBTIType[] = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
];

export type DemoRole = "TEACHER" | "STUDENT";

export interface DemoSandboxSession {
  version: 1;
  role: DemoRole;
  onboarded: boolean;
  userId?: string;
  email?: string;
}

export interface AuthenticatedDemoSandboxSession extends DemoSandboxSession {
  userId: string;
  email: string;
}

interface DemoSandboxUserInput {
  id: string;
  email?: string | null;
}

type DemoStudentRecord = {
  id: string;
  name: string;
  email: string;
  nim: string;
  gender: Gender;
  mbtiType: MBTIType;
  ei: number;
  sn: number;
  tf: number;
  pj: number;
  skills: Record<string, number>;
  topics: Record<string, number>;
  personalityAnswers: Record<string, number>;
};

type DemoTeamMember = {
  id: string;
  assignedSkillIds: string[];
  topSkills: string[];
  preferredTopics: string[];
  user: {
    id: string;
    name: string;
    email: string;
    mbtiType: MBTIType;
    nim: string;
    ei: number;
    sn: number;
    tf: number;
    pj: number;
    gender: Gender;
  };
};

type DemoTeam = {
  id: string;
  quality: number;
  createdAt: string;
  taskId: string;
  members: DemoTeamMember[];
};

type DemoTeamFormationResult = {
  assignmentId: string;
  topicNames: Record<string, string>;
  taskIdByIndex: string[];
  teams: DemoTeam[];
};

type DemoAssignmentSeed = {
  id: string;
  courseId: string;
  title: string;
  descriptionText: string;
  skills: string[];
  topics: string[];
  startAt: Date;
  createdAt: Date;
};

type DemoAssignmentDefinition = {
  title: string;
  skills: string[];
  topics: string[];
};

const DEMO_TEACHER_EMAIL = `demo.teacher.${DEMO_SANDBOX_VISITOR_ID}@eduteams.local`;
const DEMO_STUDENT_EMAIL = `demo.student.${DEMO_SANDBOX_VISITOR_ID}@eduteams.local`;

const demoStudents: DemoStudentRecord[] = [
  {
    id: DEMO_STUDENT_ID,
    name: "Bagas Pratama",
    email: DEMO_STUDENT_EMAIL,
    nim: "20260001",
    gender: "MALE",
    mbtiType: "ENTP",
    ei: 0.78,
    sn: 0.44,
    tf: 0.68,
    pj: 0.39,
    skills: {
      "Python Programming": 0.84,
      "Data Analysis": 0.76,
      "Presentation Design": 0.55,
    },
    topics: {
      "Retail Personalization": 0.88,
      "Movie Recommendation": 0.72,
      "Fraud Detection": 0.58,
    },
    personalityAnswers: buildPersonalityAnswers(1),
  },
  {
    id: "demo-sandbox-student-2",
    name: "Alya Rahma",
    email: "alya.demo@eduteams.local",
    nim: "20260002",
    gender: "FEMALE",
    mbtiType: "INFJ",
    ei: 0.34,
    sn: 0.61,
    tf: 0.41,
    pj: 0.74,
    skills: {
      "Python Programming": 0.63,
      "Data Analysis": 0.82,
      "Presentation Design": 0.79,
    },
    topics: {
      "Retail Personalization": 0.66,
      "Movie Recommendation": 0.81,
      "Fraud Detection": 0.69,
    },
    personalityAnswers: buildPersonalityAnswers(2),
  },
  {
    id: "demo-sandbox-student-3",
    name: "Dimas Saputra",
    email: "dimas.demo@eduteams.local",
    nim: "20260003",
    gender: "MALE",
    mbtiType: "ISTJ",
    ei: 0.26,
    sn: 0.79,
    tf: 0.57,
    pj: 0.83,
    skills: {
      "Python Programming": 0.78,
      "Data Analysis": 0.74,
      "Presentation Design": 0.48,
    },
    topics: {
      "Retail Personalization": 0.52,
      "Movie Recommendation": 0.57,
      "Fraud Detection": 0.86,
    },
    personalityAnswers: buildPersonalityAnswers(3),
  },
  {
    id: "demo-sandbox-student-4",
    name: "Siti Nurhaliza",
    email: "siti.demo@eduteams.local",
    nim: "20260004",
    gender: "FEMALE",
    mbtiType: "ENFP",
    ei: 0.81,
    sn: 0.42,
    tf: 0.45,
    pj: 0.31,
    skills: {
      "Python Programming": 0.51,
      "Data Analysis": 0.62,
      "Presentation Design": 0.91,
    },
    topics: {
      "Retail Personalization": 0.74,
      "Movie Recommendation": 0.89,
      "Fraud Detection": 0.44,
    },
    personalityAnswers: buildPersonalityAnswers(4),
  },
  {
    id: "demo-sandbox-student-5",
    name: "Kevin Wijaya",
    email: "kevin.demo@eduteams.local",
    nim: "20260005",
    gender: "MALE",
    mbtiType: "INTJ",
    ei: 0.22,
    sn: 0.48,
    tf: 0.82,
    pj: 0.77,
    skills: {
      "Python Programming": 0.92,
      "Data Analysis": 0.86,
      "Presentation Design": 0.37,
    },
    topics: {
      "Retail Personalization": 0.61,
      "Movie Recommendation": 0.68,
      "Fraud Detection": 0.91,
    },
    personalityAnswers: buildPersonalityAnswers(5),
  },
  {
    id: "demo-sandbox-student-6",
    name: "Maya Putri",
    email: "maya.demo@eduteams.local",
    nim: "20260006",
    gender: "FEMALE",
    mbtiType: "ESFJ",
    ei: 0.73,
    sn: 0.71,
    tf: 0.36,
    pj: 0.69,
    skills: {
      "Python Programming": 0.49,
      "Data Analysis": 0.58,
      "Presentation Design": 0.83,
    },
    topics: {
      "Retail Personalization": 0.79,
      "Movie Recommendation": 0.64,
      "Fraud Detection": 0.55,
    },
    personalityAnswers: buildPersonalityAnswers(6),
  },
  {
    id: "demo-sandbox-student-7",
    name: "Rafi Hidayat",
    email: "rafi.demo@eduteams.local",
    nim: "20260007",
    gender: "MALE",
    mbtiType: "ISTP",
    ei: 0.41,
    sn: 0.65,
    tf: 0.71,
    pj: 0.28,
    skills: {
      "Python Programming": 0.74,
      "Data Analysis": 0.67,
      "Presentation Design": 0.43,
    },
    topics: {
      "Retail Personalization": 0.48,
      "Movie Recommendation": 0.59,
      "Fraud Detection": 0.82,
    },
    personalityAnswers: buildPersonalityAnswers(7),
  },
  {
    id: "demo-sandbox-student-8",
    name: "Nadya Aulia",
    email: "nadya.demo@eduteams.local",
    nim: "20260008",
    gender: "FEMALE",
    mbtiType: "ISFP",
    ei: 0.29,
    sn: 0.63,
    tf: 0.32,
    pj: 0.47,
    skills: {
      "Python Programming": 0.57,
      "Data Analysis": 0.54,
      "Presentation Design": 0.88,
    },
    topics: {
      "Retail Personalization": 0.71,
      "Movie Recommendation": 0.77,
      "Fraud Detection": 0.46,
    },
    personalityAnswers: buildPersonalityAnswers(8),
  },
];

const demoAssignment: DemoAssignmentSeed = {
  id: DEMO_ASSIGNMENT_ID,
  courseId: DEMO_COURSE_ID,
  title: "Capstone Recommendation Sprint",
  descriptionText:
    "Analyze learner behavior, prioritize the strongest recommendation use case, and prepare a demo-ready proposal.",
  skills: ["Python Programming", "Data Analysis", "Presentation Design"],
  topics: ["Retail Personalization", "Movie Recommendation", "Fraud Detection"],
  startAt: DEMO_ASSIGNMENT_START,
  createdAt: new Date("2026-03-01T08:30:00.000Z"),
};

export function isDemoModeEnabled() {
  return process.env.DEMO_MODE === "1";
}

export function isDemoSandboxUser(user: DemoSandboxUserInput | null | undefined) {
  if (!user || !isDemoModeEnabled()) {
    return false;
  }

  if (user.id === DEMO_TEACHER_ID || user.id === DEMO_STUDENT_ID) {
    return true;
  }

  return typeof user.email === "string" && isDemoAccountEmail(user.email);
}

export function getDemoSandboxPrincipalId(user: DemoSandboxUserInput | null | undefined) {
  if (!user || !isDemoModeEnabled()) {
    return null;
  }

  if (user.id === DEMO_TEACHER_ID || user.id === DEMO_STUDENT_ID) {
    return user.id;
  }

  const demoRole = typeof user.email === "string" ? parseDemoRoleFromEmail(user.email) : null;

  if (demoRole === "TEACHER") {
    return DEMO_TEACHER_ID;
  }

  if (demoRole === "STUDENT") {
    return DEMO_STUDENT_ID;
  }

  return null;
}

export function getDefaultDemoSandboxSession(role: DemoRole = "TEACHER"): DemoSandboxSession {
  return {
    version: 1,
    role,
    onboarded: true,
  };
}

function normalizeDemoSandboxSessionField(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

export function buildDemoSandboxSession(
  role: DemoRole,
  options?: {
    onboarded?: boolean;
    userId?: string | null;
    email?: string | null;
  },
): DemoSandboxSession {
  const session: DemoSandboxSession = {
    version: 1,
    role,
    onboarded: options?.onboarded ?? true,
  };
  const userId = normalizeDemoSandboxSessionField(options?.userId);
  const email = normalizeDemoSandboxSessionField(options?.email);

  if (userId && email && parseDemoRoleFromEmail(email) === role) {
    session.userId = userId;
    session.email = email;
  }

  return session;
}

export function hasDemoSandboxAuthenticatedSession(
  session: DemoSandboxSession | null | undefined,
): session is AuthenticatedDemoSandboxSession {
  return Boolean(session?.userId && session.email);
}

function getDemoSandboxCookieSecret() {
  return getDemoRequiredSecret();
}

function encodeBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function decodeBase64Url(value: string) {
  const normalizedValue = value.replaceAll("-", "+").replaceAll("_", "/");
  const paddedValue = normalizedValue.padEnd(
    normalizedValue.length + ((4 - (normalizedValue.length % 4)) % 4),
    "=",
  );
  const binary = atob(paddedValue);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

let demoSandboxCookieSigningKeyPromise: Promise<CryptoKey> | null = null;

async function getDemoSandboxCookieSigningKey() {
  demoSandboxCookieSigningKeyPromise ??= crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getDemoSandboxCookieSecret()),
    {
      name: DEMO_SANDBOX_COOKIE_SIGNATURE_ALGORITHM,
      hash: DEMO_SANDBOX_COOKIE_SIGNATURE_HASH,
    },
    false,
    ["sign", "verify"],
  );

  return demoSandboxCookieSigningKeyPromise;
}

async function signDemoSandboxCookiePayload(payload: string) {
  const signature = await crypto.subtle.sign(
    DEMO_SANDBOX_COOKIE_SIGNATURE_ALGORITHM,
    await getDemoSandboxCookieSigningKey(),
    new TextEncoder().encode(payload),
  );

  return encodeBase64Url(new Uint8Array(signature));
}

export async function parseDemoSandboxCookieValue(
  value: string | null | undefined,
): Promise<DemoSandboxSession | null> {
  if (!value) {
    return null;
  }

  try {
    const [encodedPayload, encodedSignature, ...extraParts] = value.split(".");
    if (!encodedPayload || !encodedSignature || extraParts.length > 0) {
      return null;
    }

    const isValidSignature = await crypto.subtle.verify(
      DEMO_SANDBOX_COOKIE_SIGNATURE_ALGORITHM,
      await getDemoSandboxCookieSigningKey(),
      decodeBase64Url(encodedSignature),
      new TextEncoder().encode(encodedPayload),
    );
    if (!isValidSignature) {
      return null;
    }

    const parsed = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(encodedPayload)),
    ) as Partial<DemoSandboxSession>;
    if (parsed.version !== 1) {
      return null;
    }
    if (parsed.role !== "TEACHER" && parsed.role !== "STUDENT") {
      return null;
    }

    const userId = normalizeDemoSandboxSessionField(parsed.userId);
    const email = normalizeDemoSandboxSessionField(parsed.email);
    const hasIdentity = Boolean(userId || email);

    if (hasIdentity) {
      if (!userId || !email || parseDemoRoleFromEmail(email) !== parsed.role) {
        return null;
      }
    }

    return buildDemoSandboxSession(parsed.role, {
      onboarded: parsed.onboarded !== false,
      userId,
      email,
    });
  } catch {
    return null;
  }
}

export async function stringifyDemoSandboxCookieValue(session: DemoSandboxSession) {
  const payload = encodeBase64Url(new TextEncoder().encode(JSON.stringify(session)));
  const signature = await signDemoSandboxCookiePayload(payload);

  return `${payload}.${signature}`;
}

export function buildDemoSandboxUser(
  role: DemoRole,
  options?: { onboarded?: boolean },
): ExtendedUser {
  const now = DEMO_NOW;
  const isOnboarded = options?.onboarded ?? true;
  const onboardingState = isOnboarded
    ? {
        isOnboarded: true,
        hasSeenWelcomeSplash: true,
        onboardingStep: "completed",
      }
    : {
        isOnboarded: false,
        hasSeenWelcomeSplash: false,
        onboardingStep: null,
      };

  if (role === "TEACHER") {
    return {
      id: DEMO_TEACHER_ID,
      name: "Dr. Rina Wijaya",
      email: DEMO_TEACHER_EMAIL,
      emailVerified: true,
      image: null,
      createdAt: now,
      updatedAt: now,
      role: "TEACHER",
      nim: null,
      gender: "FEMALE",
      ...onboardingState,
      onboardingData: { locale: DEMO_DEFAULT_LOCALE },
      mbtiType: null,
      ei: null,
      sn: null,
      tf: null,
      pj: null,
      personalityData: null,
    };
  }

  const student = demoStudents[0];
  return {
    id: student.id,
    name: student.name,
    email: student.email,
    emailVerified: true,
    image: null,
    createdAt: now,
    updatedAt: now,
    role: "STUDENT",
    nim: student.nim,
    gender: student.gender,
    ...onboardingState,
    onboardingData: { locale: DEMO_DEFAULT_LOCALE },
    mbtiType: student.mbtiType,
    ei: student.ei,
    sn: student.sn,
    tf: student.tf,
    pj: student.pj,
    personalityData: { answers: student.personalityAnswers },
  };
}

export function getDemoCourse(): Course {
  return {
    id: DEMO_COURSE_ID,
    namaMataKuliah: "Machine Learning",
    kelas: "K01",
    dosenId: DEMO_TEACHER_ID,
    shareToken: "demo-share-token",
    tahunAwalPeriode: 2025,
    tahunAkhirPeriode: 2026,
    periode: "genap",
    archivedAt: null,
    createdAt: DEMO_NOW,
    updatedAt: DEMO_UPDATED_AT,
  } as Course;
}

export function getDemoCourseSummary(input?: { excludedStudentIds?: Iterable<string> }) {
  const course = getDemoCourse();
  const studentCount = getFilteredDemoStudents(input?.excludedStudentIds).length;

  return {
    ...course,
    studentCount,
    dosen: {
      id: DEMO_TEACHER_ID,
      name: "Dr. Rina Wijaya",
      email: DEMO_TEACHER_EMAIL,
    },
  };
}

export function getDemoCourseListForTeacher(input?: { excludedStudentIds?: Iterable<string> }) {
  return [getDemoCourseSummary(input)];
}

export function getDemoStudentClasses(input?: { excludedStudentIds?: Iterable<string> }) {
  const course = getDemoCourse();
  const studentCount = getFilteredDemoStudents(input?.excludedStudentIds).length;

  return [
    {
      id: course.id,
      namaMataKuliah: course.namaMataKuliah,
      kelas: course.kelas,
      tahunAwalPeriode: course.tahunAwalPeriode,
      tahunAkhirPeriode: course.tahunAkhirPeriode,
      periode: course.periode,
      dosen: { name: "Dr. Rina Wijaya" },
      enrolledAt: DEMO_NOW,
      studentCount,
      canLeave: false,
    },
  ];
}

export function getDemoManageCourses(input?: {
  excludedStudentIds?: Iterable<string>;
}): ManageCourseRow[] {
  const course = getDemoCourse();
  const studentsCount = getFilteredDemoStudents(input?.excludedStudentIds).length;

  return [
    {
      id: course.id,
      name: course.namaMataKuliah,
      classCode: course.kelas,
      periodLabel: "2025/2026 Genap",
      startYear: course.tahunAwalPeriode,
      endYear: course.tahunAkhirPeriode,
      semester: "genap",
      assignmentsCount: 1,
      studentsCount,
      isArchived: false,
      isManuallyArchived: false,
      updatedAt: course.updatedAt.toISOString(),
    },
  ];
}

function getFilteredDemoStudents(excludedStudentIds?: Iterable<string>) {
  if (!excludedStudentIds) {
    return demoStudents;
  }

  const excludedIds = new Set(excludedStudentIds);
  return demoStudents.filter((student) => !excludedIds.has(student.id));
}

function mapDemoStudentForCourse(student: DemoStudentRecord) {
  return {
    id: student.id,
    name: student.name,
    nim: student.nim,
    email: student.email,
    gender: student.gender,
    mbtiType: student.mbtiType,
    ei: student.ei,
    sn: student.sn,
    tf: student.tf,
    pj: student.pj,
    enrolledAt: DEMO_NOW,
  };
}

export function getDemoStudentsForCourse(input?: { excludedStudentIds?: Iterable<string> }) {
  return getFilteredDemoStudents(input?.excludedStudentIds).map(mapDemoStudentForCourse);
}

export function getDemoSubmittedStudentIds(input?: { excludedStudentIds?: Iterable<string> }) {
  return getFilteredDemoStudents(input?.excludedStudentIds).map((student) => student.id);
}

export function getDemoAssignmentSubmissionSnapshot(input: {
  assignmentId: string;
  currentUserId: string;
  enrolledStudentIds: readonly string[];
  submittedAssignmentIds: readonly string[];
}) {
  const submissionStudentId = input.enrolledStudentIds.includes(input.currentUserId)
    ? input.currentUserId
    : input.enrolledStudentIds.includes(DEMO_STUDENT_ID)
      ? DEMO_STUDENT_ID
      : null;
  const hasSubmissionStudentSubmitted = submissionStudentId
    ? input.submittedAssignmentIds.includes(input.assignmentId)
    : true;

  return {
    submissionStudentId,
    hasSubmissionStudentSubmitted,
    submittedStudentIds:
      submissionStudentId && !hasSubmissionStudentSubmitted
        ? input.enrolledStudentIds.filter((studentId) => studentId !== submissionStudentId)
        : [...input.enrolledStudentIds],
  };
}

export function getDemoSeededAssignment(input?: { submissionsCount?: number }): AssignmentResponse {
  return {
    id: demoAssignment.id,
    courseId: demoAssignment.courseId,
    title: demoAssignment.title,
    description: JSON.stringify({
      text: demoAssignment.descriptionText,
      skills: demoAssignment.skills,
      topics: demoAssignment.topics,
    }),
    startAt: demoAssignment.startAt,
    createdAt: demoAssignment.createdAt,
    status: "MENUNGGU",
    skills: demoAssignment.skills,
    topics: demoAssignment.topics,
    submissionsCount: input?.submissionsCount ?? demoStudents.length,
  };
}

export function getDemoAssignmentsForUser(
  user: Pick<ExtendedUser, "id" | "role" | "email">,
  input?: { submittedAssignmentIds?: readonly string[]; removedStudentIds?: readonly string[] },
): AssignmentClient[] {
  const isStudent = user.role === "STUDENT";
  const removedSet = input?.removedStudentIds?.length ? new Set(input.removedStudentIds) : null;
  const enrolledStudentIds = removedSet
    ? demoStudents.filter((student) => !removedSet.has(student.id)).map((student) => student.id)
    : demoStudents.map((student) => student.id);
  const submissionSnapshot = getDemoAssignmentSubmissionSnapshot({
    assignmentId: DEMO_ASSIGNMENT_ID,
    currentUserId: getDemoSandboxPrincipalId(user) ?? user.id,
    enrolledStudentIds,
    submittedAssignmentIds: input?.submittedAssignmentIds ?? [],
  });
  const assignment = getDemoSeededAssignment({
    submissionsCount: submissionSnapshot.submittedStudentIds.length,
  });

  return [
    {
      ...assignment,
      submittedByMe: isStudent ? submissionSnapshot.hasSubmissionStudentSubmitted : false,
      needsUpdate: false,
    },
  ];
}

export function getDemoManageAssignments(input?: {
  totalStudents?: number;
}): ManageAssignmentRow[] {
  const totalStudents = input?.totalStudents ?? demoStudents.length;
  const assignment = getDemoSeededAssignment({ submissionsCount: totalStudents });
  return [
    {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description ?? null,
      status: assignment.status,
      startAt: assignment.startAt.toISOString(),
      createdAt: assignment.createdAt.toISOString(),
      isArchived: false,
      submissionsCount: assignment.submissionsCount,
      totalStudents,
      skills: [...assignment.skills],
      topics: [...assignment.topics],
    },
  ];
}

export function getDemoSidebarData(
  user: Pick<ExtendedUser, "id" | "name" | "email" | "role">,
  input?: { notStartedCount?: number },
) {
  return {
    user: {
      id: user.id,
      name: user.name ?? "Demo User",
      email: user.email,
      role: user.role ?? "unknown",
    },
    notStartedCount: input?.notStartedCount ?? 0,
  };
}

export function getDemoDashboardStatistics(
  input?: DemoDashboardStatisticsState,
): DashboardStatistics {
  return calculateDemoDashboardStatistics(input);
}

export function getDemoAssignmentStats(input?: {
  excludedStudentIds?: Iterable<string>;
}): AssignmentStats {
  return getDemoAssignmentStatsForDefinition({
    skills: demoAssignment.skills,
    topics: demoAssignment.topics,
    excludedStudentIds: input?.excludedStudentIds,
  });
}

export function getDemoAssignmentStatsForDefinition(input: {
  skills: string[];
  topics: string[];
  quizSubmissions?: number;
  teamsFormed?: boolean;
  excludedStudentIds?: Iterable<string>;
  includedStudentIds?: Iterable<string>;
}): AssignmentStats {
  const includedStudentIds =
    input.includedStudentIds === undefined ? null : new Set(input.includedStudentIds);
  const roster =
    includedStudentIds === null
      ? getFilteredDemoStudents(input.excludedStudentIds)
      : demoStudents.filter((student) => includedStudentIds.has(student.id));
  const mbtiCounts = new Map<MBTIType, number>();
  for (const student of roster) {
    mbtiCounts.set(student.mbtiType, (mbtiCounts.get(student.mbtiType) ?? 0) + 1);
  }

  const rosterSize = roster.length;
  const skills = input.skills.map((skill) => ({
    label: skill,
    value: Math.round(
      (roster.reduce((sum, student) => sum + getDemoStudentSkillLevel(student, skill), 0) /
        Math.max(1, rosterSize)) *
        100,
    ),
  }));
  const topicPreferences = input.topics.map((topic) => ({
    name: topic,
    value: Math.round(
      (roster.reduce((sum, student) => sum + getDemoStudentTopicPreference(student, topic), 0) /
        Math.max(1, rosterSize)) *
        100,
    ),
  }));
  const quizSubmissions = input.quizSubmissions ?? rosterSize;

  return {
    mbti: MBTI_ORDER.map((type) => ({
      kategori: type as MBTIType,
      jumlah: mbtiCounts.get(type as MBTIType) ?? 0,
    })),
    gender: [
      {
        name: "laki",
        value: roster.filter((student) => student.gender === "MALE").length,
      },
      {
        name: "perempuan",
        value: roster.filter((student) => student.gender === "FEMALE").length,
      },
    ],
    skills,
    topicPreferences,
    teamsFormed: input.teamsFormed ?? false,
    quizSubmissions,
    chartReady: quizSubmissions > 0,
    skillsReady: skills.some((skill) => skill.value > 0),
    teamQuality: undefined,
  };
}

export function getDemoSkills(search: string) {
  const normalized = search.trim().toLowerCase();
  return demoAssignment.skills
    .filter((skill) => (normalized.length === 0 ? true : skill.toLowerCase().includes(normalized)))
    .map((skill) => ({
      id: slugify(skill),
      name: skill,
    }));
}

export function createDemoAssignmentResponse(input: {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  skills: string[];
  topics: string[];
  startAt?: Date;
  createdAt?: Date;
  submissionsCount?: number;
}): AssignmentResponse {
  const startAt = input.startAt ?? new Date();
  const createdAt = input.createdAt ?? new Date();
  const descriptionPayload: Record<string, unknown> = {
    text: input.description?.trim() || "",
    skills: input.skills,
    topics: input.topics,
  };

  return {
    id: input.id,
    courseId: input.courseId,
    title: input.title,
    description: JSON.stringify(descriptionPayload),
    startAt,
    createdAt,
    status: "MENUNGGU",
    skills: input.skills,
    topics: input.topics,
    submissionsCount: input.submissionsCount ?? demoStudents.length,
  };
}

function buildDemoTopicMetadata(topics: string[]) {
  const normalizedTopics = topics.length > 0 ? topics : ["General Collaboration"];
  const topicNames = Object.fromEntries(
    normalizedTopics.map((topic, index) => [`topic-${index + 1}`, topic]),
  );
  const taskIdByIndex = Object.keys(topicNames);

  return {
    topicNames,
    taskIdByIndex,
  };
}

export function buildDemoTeamFormation(params: {
  assignmentId: string;
  method: "JUMLAH_KELOMPOK" | "JUMLAH_MHS_PER_KELOMPOK";
  value: number;
  topics?: string[];
  excludedStudentIds?: Iterable<string>;
}): DemoTeamFormationResult {
  const roster = [...getFilteredDemoStudents(params.excludedStudentIds)].sort((a, b) =>
    a.name.localeCompare(b.name, "id"),
  );
  const groupCount =
    params.method === "JUMLAH_KELOMPOK"
      ? Math.max(1, Math.min(params.value, roster.length))
      : Math.max(1, Math.ceil(roster.length / Math.max(1, params.value)));

  const buckets = Array.from({ length: groupCount }, () => [] as DemoStudentRecord[]);
  for (let index = 0; index < roster.length; index += 1) {
    const bucketIndex = index % groupCount;
    buckets[bucketIndex].push(roster[index]);
  }

  const { topicNames, taskIdByIndex } = buildDemoTopicMetadata(
    params.topics ?? demoAssignment.topics,
  );

  return {
    assignmentId: params.assignmentId,
    topicNames,
    taskIdByIndex,
    teams: buckets.map((bucket, index) => {
      const topicId = taskIdByIndex[index % taskIdByIndex.length] ?? "topic-1";
      return {
        id: `demo-team-${params.assignmentId}-${index + 1}`,
        quality: Number((0.9 - index * 0.04).toFixed(2)),
        createdAt: new Date().toISOString(),
        taskId: topicId,
        members: bucket.map((student) => buildDemoTeamMember(student)),
      };
    }),
  };
}

type DemoAssignmentSearchParamValue = string | string[] | undefined;

function normalizeDemoAssignmentSearchParamValue(value: DemoAssignmentSearchParamValue) {
  if (Array.isArray(value)) {
    return value.find((item) => typeof item === "string" && item.trim().length > 0)?.trim();
  }

  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizeDemoAssignmentSearchParamList(value: DemoAssignmentSearchParamValue) {
  const values = Array.isArray(value) ? value : value ? [value] : [];

  return values.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
  );
}

function normalizeDemoAssignmentEmptyFlag(value: DemoAssignmentSearchParamValue) {
  const normalizedValue = normalizeDemoAssignmentSearchParamValue(value)?.toLowerCase();
  return normalizedValue === "1" || normalizedValue === "true";
}

function buildDemoAssignmentSearchParams(input: {
  title: string;
  skills?: readonly string[];
  topics?: readonly string[];
}) {
  const searchParams = new URLSearchParams({ demoTitle: input.title });

  if (input.skills) {
    if (input.skills.length === 0) {
      searchParams.set("demoSkillsEmpty", "1");
    }
    for (const skill of input.skills) {
      searchParams.append("demoSkill", skill);
    }
  }

  if (input.topics) {
    if (input.topics.length === 0) {
      searchParams.set("demoTopicsEmpty", "1");
    }
    for (const topic of input.topics) {
      searchParams.append("demoTopic", topic);
    }
  }

  return searchParams;
}

export function buildDemoAssignmentHref(input: {
  classId: string;
  assignmentId: string;
  title: string;
  skills?: readonly string[];
  topics?: readonly string[];
}) {
  const pathname = `/dashboard/class/${input.classId}/assignments/${input.assignmentId}`;
  if (!isLocalDemoAssignmentId(input.assignmentId)) {
    return pathname;
  }

  const searchParams = buildDemoAssignmentSearchParams(input);
  return `${pathname}?${searchParams.toString()}`;
}

export function buildDemoAssignmentQuizHref(input: {
  classId: string;
  assignmentId: string;
  title: string;
  skills: readonly string[];
  topics: readonly string[];
}) {
  const pathname = `/dashboard/class/${input.classId}/assignments/${input.assignmentId}/quiz`;
  if (!isLocalDemoAssignmentId(input.assignmentId)) {
    return pathname;
  }

  const searchParams = buildDemoAssignmentSearchParams(input);
  return `${pathname}?${searchParams.toString()}`;
}

export function buildDemoAssignmentAnswersHref(input: {
  classId: string;
  assignmentId: string;
  title: string;
  skills: readonly string[];
  topics: readonly string[];
}) {
  const pathname = `/dashboard/class/${input.classId}/assignments/${input.assignmentId}/answers`;
  if (!isLocalDemoAssignmentId(input.assignmentId)) {
    return pathname;
  }

  const searchParams = buildDemoAssignmentSearchParams(input);
  return `${pathname}?${searchParams.toString()}`;
}

export function getDemoAssignmentDefinition(input?: {
  title?: string;
  skills?: readonly string[];
  topics?: readonly string[];
}): DemoAssignmentDefinition {
  const title = input?.title?.trim() || demoAssignment.title;
  const skills =
    input?.skills?.filter((skill) => typeof skill === "string" && skill.trim().length > 0) ??
    demoAssignment.skills;
  const topics =
    input?.topics?.filter((topic) => typeof topic === "string" && topic.trim().length > 0) ??
    demoAssignment.topics;

  return {
    title,
    skills: [...skills],
    topics: [...topics],
  };
}

export function getDemoAssignmentDefinitionFromSearchParams(searchParams?: {
  demoTitle?: DemoAssignmentSearchParamValue;
  demoSkill?: DemoAssignmentSearchParamValue;
  demoTopic?: DemoAssignmentSearchParamValue;
  demoSkillsEmpty?: DemoAssignmentSearchParamValue;
  demoTopicsEmpty?: DemoAssignmentSearchParamValue;
}) {
  const skills = normalizeDemoAssignmentSearchParamList(searchParams?.demoSkill);
  const topics = normalizeDemoAssignmentSearchParamList(searchParams?.demoTopic);

  return getDemoAssignmentDefinition({
    title: normalizeDemoAssignmentSearchParamValue(searchParams?.demoTitle),
    skills:
      skills.length > 0 || normalizeDemoAssignmentEmptyFlag(searchParams?.demoSkillsEmpty)
        ? skills
        : undefined,
    topics:
      topics.length > 0 || normalizeDemoAssignmentEmptyFlag(searchParams?.demoTopicsEmpty)
        ? topics
        : undefined,
  });
}

export function getDemoStudentManageItems(): GroupListItem[] {
  return [
    {
      id: demoAssignment.id,
      courseId: DEMO_COURSE_ID,
      taskTitle: demoAssignment.title,
      className: `${getDemoCourse().namaMataKuliah} ${getDemoCourse().kelas}`,
      academicYear: "2025/2026",
      status: "waiting",
      href: buildDemoAssignmentHref({
        classId: DEMO_COURSE_ID,
        assignmentId: demoAssignment.id,
        title: demoAssignment.title,
        skills: demoAssignment.skills,
        topics: demoAssignment.topics,
      }),
      quizHref: buildDemoAssignmentQuizHref({
        classId: DEMO_COURSE_ID,
        assignmentId: demoAssignment.id,
        title: demoAssignment.title,
        skills: demoAssignment.skills,
        topics: demoAssignment.topics,
      }),
      startAt: demoAssignment.startAt,
      description: JSON.stringify({
        text: demoAssignment.descriptionText,
      }),
    },
  ];
}

export function getDemoSubmittedStudents(options?: {
  excludedStudentIds?: readonly string[];
  assignmentId?: string;
  currentUserId?: string;
  submittedAssignmentIds?: readonly string[];
}) {
  const excludedStudentIds = new Set(options?.excludedStudentIds ?? []);
  const visibleStudents = demoStudents.filter((student) => !excludedStudentIds.has(student.id));
  const submittedStudentIds =
    options?.assignmentId && options.currentUserId
      ? new Set(
          getDemoAssignmentSubmissionSnapshot({
            assignmentId: options.assignmentId,
            currentUserId: options.currentUserId,
            enrolledStudentIds: visibleStudents.map((student) => student.id),
            submittedAssignmentIds: options.submittedAssignmentIds ?? [],
          }).submittedStudentIds,
        )
      : null;

  return visibleStudents
    .filter((student) => !submittedStudentIds || submittedStudentIds.has(student.id))
    .map((student) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      nim: student.nim,
      role: "STUDENT" as const,
      image: null,
      gender: student.gender,
      mbtiType: student.mbtiType,
      ei: student.ei,
      sn: student.sn,
      tf: student.tf,
      pj: student.pj,
      personalityData: { answers: student.personalityAnswers },
    }));
}

export function getDemoAssignmentAnswersView(
  studentId: string,
  assignmentDefinition?: {
    title?: string;
    skills?: readonly string[];
    topics?: readonly string[];
  },
) {
  const student = demoStudents.find((candidate) => candidate.id === studentId);
  if (!student) {
    return null;
  }

  const assignment = getDemoAssignmentDefinition(assignmentDefinition);

  return {
    title: assignment.title,
    skills: assignment.skills.map((skill) => ({
      name: skill,
      level: getDemoStudentSkillLevel(student, skill),
    })),
    topics: assignment.topics.map((topic) => ({
      name: topic,
      preference: getDemoStudentTopicPreference(student, topic),
    })),
  };
}

function buildDemoTeamMember(student: DemoStudentRecord): DemoTeamMember {
  const orderedSkills = Object.entries(student.skills)
    .toSorted((a, b) => b[1] - a[1])
    .map(([skill]) => skill);
  const orderedTopics = Object.entries(student.topics)
    .toSorted((a, b) => b[1] - a[1])
    .map(([topic]) => topic);

  return {
    id: `demo-member-${student.id}`,
    assignedSkillIds: orderedSkills.slice(0, 2).map(slugify),
    topSkills: orderedSkills.slice(0, 2),
    preferredTopics: orderedTopics.slice(0, 2),
    user: {
      id: student.id,
      name: student.name,
      email: student.email,
      mbtiType: student.mbtiType,
      nim: student.nim,
      ei: student.ei,
      sn: student.sn,
      tf: student.tf,
      pj: student.pj,
      gender: student.gender,
    },
  };
}

function buildPersonalityAnswers(seed: number) {
  return Object.fromEntries(
    Array.from({ length: 20 }, (_, index) => {
      const value = ((index + seed) % 5) + 1;
      return [String(index + 1), value];
    }),
  );
}

function averageDemoMetric(metrics: Record<string, number>) {
  const values = Object.values(metrics);
  if (values.length === 0) {
    return 0.65;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function hashDemoMetricSeed(value: string) {
  let hash = 0;

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash;
}

function clampDemoMetric(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function buildSyntheticDemoMetric(
  student: DemoStudentRecord,
  metricType: "skills" | "topics",
  metricName: string,
): number {
  const metrics = metricType === "skills" ? student.skills : student.topics;
  const trimmedMetricName = metricName.trim();
  if (trimmedMetricName.length === 0) {
    return averageDemoMetric(metrics);
  }

  const seededValue = metrics[trimmedMetricName];
  if (typeof seededValue === "number") {
    return seededValue;
  }

  const baseline = averageDemoMetric(metrics);
  const labelOffset =
    (hashDemoMetricSeed(`${metricType}:${trimmedMetricName.toLowerCase()}`) % 1000) / 999 - 0.5;
  const studentOffset =
    (hashDemoMetricSeed(`${student.id}:${metricType}:${trimmedMetricName.toLowerCase()}`) % 1000) /
      999 -
    0.5;

  return Number(
    clampDemoMetric(baseline + labelOffset * 0.18 + studentOffset * 0.22, 0.35, 0.95).toFixed(2),
  );
}

function getDemoStudentSkillLevel(student: DemoStudentRecord, skill: string) {
  return buildSyntheticDemoMetric(student, "skills", skill);
}

function getDemoStudentTopicPreference(student: DemoStudentRecord, topic: string) {
  return buildSyntheticDemoMetric(student, "topics", topic);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
