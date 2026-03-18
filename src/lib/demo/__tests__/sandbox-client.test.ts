import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { DEMO_VISITOR_PUBLIC_COOKIE_NAME } from "@/lib/demo/cookies";
import { DEMO_SANDBOX_STORAGE_KEY } from "@/lib/demo/sandbox";
import { DEMO_SANDBOX_SUBMISSIONS_COOKIE_NAME } from "@/lib/demo/sandbox-submissions-shared";
import {
  addDemoCreatedAssignment,
  clearDemoSandboxClientState,
  getDemoCreatedAssignments,
  getDemoSandboxClientState,
  hasDemoSandboxClientState,
  markDemoAssignmentSubmitted,
} from "../sandbox-client";

function setDemoVisitorCookie(visitorId: string | null) {
  document.cookie = `${DEMO_VISITOR_PUBLIC_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  document.cookie = `${DEMO_SANDBOX_SUBMISSIONS_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;

  if (visitorId) {
    document.cookie = `${DEMO_VISITOR_PUBLIC_COOKIE_NAME}=${visitorId}; path=/`;
  }
}

describe("demo sandbox client state", () => {
  beforeEach(() => {
    clearDemoSandboxClientState();
    localStorage.clear();
    setDemoVisitorCookie(null);
  });

  afterEach(() => {
    clearDemoSandboxClientState();
    localStorage.clear();
    setDemoVisitorCookie(null);
  });

  it("isolates persisted assignments by demo visitor", () => {
    setDemoVisitorCookie("visitor-alpha");
    addDemoCreatedAssignment({
      id: "demo-local-alpha",
      courseId: "demo-sandbox-course",
      title: "Alpha Assignment",
      description: null,
      startAt: new Date("2026-03-01T09:00:00.000Z").toISOString(),
      createdAt: new Date("2026-03-01T09:00:00.000Z").toISOString(),
      skills: ["Data Analysis"],
      topics: ["Fraud Detection"],
      submissionsCount: 12,
    });

    expect(
      getDemoCreatedAssignments("demo-sandbox-course").map((assignment) => assignment.id),
    ).toEqual(["demo-local-alpha"]);

    setDemoVisitorCookie("visitor-bravo");
    expect(getDemoCreatedAssignments("demo-sandbox-course")).toEqual([]);

    addDemoCreatedAssignment({
      id: "demo-local-bravo",
      courseId: "demo-sandbox-course",
      title: "Bravo Assignment",
      description: null,
      startAt: new Date("2026-03-02T09:00:00.000Z").toISOString(),
      createdAt: new Date("2026-03-02T09:00:00.000Z").toISOString(),
      skills: ["Backend Development"],
      topics: ["Movie Recommendation"],
      submissionsCount: 8,
    });

    setDemoVisitorCookie("visitor-alpha");
    expect(
      getDemoCreatedAssignments("demo-sandbox-course").map((assignment) => assignment.id),
    ).toEqual(["demo-local-alpha"]);

    setDemoVisitorCookie("visitor-bravo");
    expect(
      getDemoCreatedAssignments("demo-sandbox-course").map((assignment) => assignment.id),
    ).toEqual(["demo-local-bravo"]);
  });

  it("clears all persisted demo sandbox state", () => {
    setDemoVisitorCookie("visitor-alpha");
    addDemoCreatedAssignment({
      id: "demo-local-alpha",
      courseId: "demo-sandbox-course",
      title: "Alpha Assignment",
      description: null,
      startAt: new Date("2026-03-01T09:00:00.000Z").toISOString(),
      createdAt: new Date("2026-03-01T09:00:00.000Z").toISOString(),
      skills: [],
      topics: [],
      submissionsCount: 0,
    });

    setDemoVisitorCookie("visitor-bravo");
    addDemoCreatedAssignment({
      id: "demo-local-bravo",
      courseId: "demo-sandbox-course",
      title: "Bravo Assignment",
      description: null,
      startAt: new Date("2026-03-02T09:00:00.000Z").toISOString(),
      createdAt: new Date("2026-03-02T09:00:00.000Z").toISOString(),
      skills: [],
      topics: [],
      submissionsCount: 0,
    });

    clearDemoSandboxClientState();
    expect(getDemoCreatedAssignments("demo-sandbox-course")).toEqual([]);

    setDemoVisitorCookie("visitor-alpha");
    expect(getDemoCreatedAssignments("demo-sandbox-course")).toEqual([]);
  });

  it("migrates legacy persisted state without submitted assignments", () => {
    setDemoVisitorCookie("visitor-alpha");
    localStorage.setItem(
      `${DEMO_SANDBOX_STORAGE_KEY}:visitor-alpha`,
      JSON.stringify({
        version: 1,
        currentRole: "STUDENT",
        onboardingCompleted: true,
        welcomeSplashSeen: true,
        createdAssignments: [
          {
            id: "demo-local-legacy",
            courseId: "demo-sandbox-course",
            title: "Legacy Assignment",
            description: null,
            startAt: new Date("2026-03-01T09:00:00.000Z").toISOString(),
            createdAt: new Date("2026-03-01T09:00:00.000Z").toISOString(),
            skills: ["Prompt Engineering"],
            topics: ["Campus Sustainability"],
            submissionsCount: 1,
          },
        ],
        formedTeams: {},
      }),
    );

    expect(hasDemoSandboxClientState()).toBe(true);
    expect(getDemoSandboxClientState().submittedAssignments).toEqual(["demo-local-legacy"]);
    expect(localStorage.getItem(`${DEMO_SANDBOX_STORAGE_KEY}:visitor-alpha`)).toContain(
      '"submittedAssignments":["demo-local-legacy"]',
    );
    expect(decodeURIComponent(document.cookie)).toContain('"assignmentIds":["demo-local-legacy"]');
  });

  it("mirrors submitted demo assignments into a cookie for server-rendered routes", () => {
    setDemoVisitorCookie("visitor-alpha");

    markDemoAssignmentSubmitted("demo-local-alpha");

    expect(document.cookie).toContain(DEMO_SANDBOX_SUBMISSIONS_COOKIE_NAME);
    expect(decodeURIComponent(document.cookie)).toContain('"assignmentIds":["demo-local-alpha"]');

    clearDemoSandboxClientState();

    expect(document.cookie).not.toContain(DEMO_SANDBOX_SUBMISSIONS_COOKIE_NAME);
  });
});
