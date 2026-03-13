export const DEMO_SANDBOX_STORAGE_KEY = "eduteams-demo-sandbox:v1";
export const DEMO_LOCAL_ASSIGNMENT_ID_PREFIX = "demo-local-";
export const DEMO_ASSIGNMENT_ID = "demo-sandbox-assignment";
export const DEMO_COURSE_ID = "demo-sandbox-course";
export const DEMO_TEAM_FORMATION_STORAGE_EVENT = "eduteams-demo-team-formation-updated";

export function isLocalDemoAssignmentId(assignmentId: string) {
  return assignmentId.startsWith(DEMO_LOCAL_ASSIGNMENT_ID_PREFIX);
}

export function isDemoSandboxAssignmentId(assignmentId: string) {
  return assignmentId === DEMO_ASSIGNMENT_ID || isLocalDemoAssignmentId(assignmentId);
}
