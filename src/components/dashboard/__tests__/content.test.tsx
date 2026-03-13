import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { DEMO_VISITOR_PUBLIC_COOKIE_NAME } from "@/lib/demo/cookies";
import { setDemoSandboxClientState } from "@/lib/demo/sandbox-client";
import { DEMO_COURSE_ID } from "@/lib/demo/sandbox-shared";
import type { DosenCourseSummary } from "@/lib/dashboard/courses";
import { EMPTY_DASHBOARD_STATISTICS } from "@/lib/dashboard/statistics";
import Content from "../content";

function setDemoVisitorCookie(visitorId: string | null) {
  document.cookie = `${DEMO_VISITOR_PUBLIC_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;

  if (visitorId) {
    document.cookie = `${DEMO_VISITOR_PUBLIC_COOKIE_NAME}=${visitorId}; path=/`;
  }
}

const MOCK_COURSES: DosenCourseSummary[] = [
  {
    id: "course-1",
    namaMataKuliah: "Algoritma",
    kelas: "RA",
    tahunAwalPeriode: 2024,
    tahunAkhirPeriode: 2025,
    periode: "ganjil",
    dosenId: "d1",
    shareToken: null,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-02T00:00:00Z"),
    studentCount: 30,
    dosen: {
      id: "d1",
      name: "Dosen 1",
      email: "dosen@example.com",
    },
  },
  {
    id: "course-2",
    namaMataKuliah: "Basis Data",
    kelas: "RB",
    tahunAwalPeriode: 2024,
    tahunAkhirPeriode: 2025,
    periode: "ganjil",
    dosenId: "d1",
    shareToken: null,
    createdAt: new Date("2024-02-01T00:00:00Z"),
    updatedAt: new Date("2024-02-02T00:00:00Z"),
    studentCount: 28,
    dosen: {
      id: "d1",
      name: "Dosen 1",
      email: "dosen@example.com",
    },
  },
];

describe("Dashboard Content", () => {
  beforeEach(() => {
    localStorage.clear();
    setDemoVisitorCookie(null);
  });

  afterEach(() => {
    localStorage.clear();
    setDemoVisitorCookie(null);
  });

  it("renders provided courses as class cards", () => {
    render(<Content statistics={EMPTY_DASHBOARD_STATISTICS} courses={MOCK_COURSES} />);

    expect(screen.getByText("Algoritma")).toBeTruthy();
    expect(screen.getByText("Basis Data")).toBeTruthy();
    expect(screen.getByText("30 students")).toBeTruthy();
  });

  it("recomputes demo statistics from persisted sandbox state", () => {
    setDemoVisitorCookie("visitor-alpha");
    setDemoSandboxClientState((state) => ({
      ...state,
      createdAssignments: [
        {
          id: "demo-local-1",
          courseId: DEMO_COURSE_ID,
          title: "Local Demo Assignment",
          description: null,
          startAt: new Date("2026-03-05T08:00:00.000Z").toISOString(),
          createdAt: new Date("2026-03-05T07:00:00.000Z").toISOString(),
          skills: ["Data Analysis"],
          topics: ["Fraud Detection"],
          submissionsCount: 8,
        },
      ],
      formedTeams: {
        "demo-sandbox-assignment": {
          assignmentId: "demo-sandbox-assignment",
          topicNames: {},
          taskIdByIndex: [],
          teams: [
            {
              id: "team-1",
              quality: 0.84,
              createdAt: new Date("2026-03-06T08:00:00.000Z").toISOString(),
              members: [],
            },
          ],
        },
        "demo-local-1": {
          assignmentId: "demo-local-1",
          topicNames: {},
          taskIdByIndex: [],
          teams: [
            {
              id: "team-2",
              quality: 0.72,
              createdAt: new Date("2026-03-06T08:10:00.000Z").toISOString(),
              members: [],
            },
          ],
        },
      },
    }));

    render(
      <Content
        statistics={EMPTY_DASHBOARD_STATISTICS}
        courses={[
          {
            id: DEMO_COURSE_ID,
            namaMataKuliah: "Algoritma",
            kelas: "RA",
            tahunAwalPeriode: 2024,
            tahunAkhirPeriode: 2025,
            periode: "ganjil",
            dosenId: "d1",
            shareToken: null,
            createdAt: new Date("2024-01-01T00:00:00Z"),
            updatedAt: new Date("2024-01-02T00:00:00Z"),
            studentCount: 30,
            dosen: {
              id: "d1",
              name: "Dosen 1",
              email: "dosen@example.com",
            },
          },
        ]}
      />,
    );

    expect(screen.getByText("Total assignments created").parentElement?.textContent).toContain("2");
    expect(
      screen.getByText("Total teams successfully formed").parentElement?.textContent,
    ).toContain("2");
    expect(screen.getByText("78%")).toBeTruthy();
  });

  it("filters classes based on search input", () => {
    render(<Content statistics={EMPTY_DASHBOARD_STATISTICS} courses={MOCK_COURSES} />);

    const searchInput = screen.getByPlaceholderText("Search for something?");
    fireEvent.change(searchInput, { target: { value: "basis" } });

    expect(screen.getByText("Basis Data")).toBeTruthy();
    expect(screen.queryByText("Algoritma")).toBeNull();
  });

  it("updates when courses prop changes", () => {
    const { rerender } = render(
      <Content statistics={EMPTY_DASHBOARD_STATISTICS} courses={MOCK_COURSES} />,
    );

    expect(screen.queryByText("Manajemen Proyek")).toBeNull();

    const updatedCourses: DosenCourseSummary[] = [
      ...MOCK_COURSES,
      {
        id: "course-3",
        namaMataKuliah: "Manajemen Proyek",
        kelas: "RC",
        tahunAwalPeriode: 2025,
        tahunAkhirPeriode: 2026,
        periode: "genap",
        dosenId: "d1",
        shareToken: "token-123",
        createdAt: new Date("2025-01-02T00:00:00Z"),
        updatedAt: new Date("2025-01-02T00:00:00Z"),
        studentCount: 0,
        dosen: {
          id: "d1",
          name: "Dosen 1",
          email: "dosen@example.com",
        },
      },
    ];

    rerender(<Content statistics={EMPTY_DASHBOARD_STATISTICS} courses={updatedCourses} />);

    expect(screen.getByText("Manajemen Proyek")).toBeTruthy();
  });
});
