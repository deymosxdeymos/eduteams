import { describe, it } from "bun:test";
import { DEMO_VISITOR_PUBLIC_COOKIE_NAME } from "@/lib/demo/cookies";
import {
  addDemoCreatedAssignment,
  clearDemoSandboxClientState,
  getDemoCreatedAssignments,
} from "@/lib/demo/sandbox-client";
function setDemoVisitorCookie(visitorId: string | null) {
  document.cookie = `${DEMO_VISITOR_PUBLIC_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  if (visitorId) document.cookie = `${DEMO_VISITOR_PUBLIC_COOKIE_NAME}=${visitorId}; path=/`;
}
describe("repro", () => {
  it("repro", () => {
    localStorage.clear();
    setDemoVisitorCookie("visitor-alpha");
    addDemoCreatedAssignment({
      id: "demo-local-alpha",
      courseId: "demo-sandbox-course",
      title: "Alpha",
      description: null,
      startAt: new Date("2026-03-01").toISOString(),
      createdAt: new Date("2026-03-01").toISOString(),
      skills: [],
      topics: [],
      submissionsCount: 0,
    });
    setDemoVisitorCookie("visitor-bravo");
    addDemoCreatedAssignment({
      id: "demo-local-bravo",
      courseId: "demo-sandbox-course",
      title: "Bravo",
      description: null,
      startAt: new Date("2026-03-02").toISOString(),
      createdAt: new Date("2026-03-02").toISOString(),
      skills: [],
      topics: [],
      submissionsCount: 0,
    });
    console.log(
      "keys before",
      Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)),
    );
    clearDemoSandboxClientState();
    console.log(
      "keys after",
      Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)),
    );
    console.log("bravo visible", getDemoCreatedAssignments("demo-sandbox-course"));
    setDemoVisitorCookie("visitor-alpha");
    console.log("alpha visible", getDemoCreatedAssignments("demo-sandbox-course"));
  });
});
