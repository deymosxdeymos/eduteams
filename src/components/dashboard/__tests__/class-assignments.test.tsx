import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";

const pushMock = mock(() => undefined);
const getDemoAssignmentStatusMock = mock(() => "BELUM_ISI");
const getDemoCreatedAssignmentsMock = mock(() => []);
const getDemoSandboxClientStateMock = mock(() => ({
  submittedAssignments: [],
}));
const hasDemoSandboxClientStateMock = mock(() => true);
const getDemoSandboxClientSnapshotMock = mock(() => {
  const sandboxState = getDemoSandboxClientStateMock();

  return {
    exists: hasDemoSandboxClientStateMock(),
    state: {
      ...sandboxState,
      createdAssignments: getDemoCreatedAssignmentsMock(),
    },
  };
});

mock.module("next/dynamic", () => ({
  default: () => () => null,
}));

mock.module("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    switch (key) {
      case "createAssignment":
        return "Create assignment";
      case "shareClass":
        return "Share class";
      case "searchPlaceholder":
        return "Search assignments";
      case "searchAria":
        return "Search assignments";
      case "status.waiting":
        return "waiting";
      case "status.noneFilled":
        return "none";
      case "status.formed":
        return "formed";
      case "status.progress":
        return `${values?.filled}/${values?.total}`;
      default:
        return key;
    }
  },
}));

mock.module("nuqs", () => ({
  parseAsBoolean: {},
  parseAsStringLiteral: () => ({}),
  useQueryState: () => ["", mock(() => undefined)],
}));

mock.module("swr", () => ({
  default: (_key: string, _fetcher: unknown, options?: { fallbackData?: unknown }) => ({
    data: options?.fallbackData,
    mutate: mock(async () => undefined),
  }),
}));

mock.module("@/components/ui/button", () => ({
  Button: ({ children, asChild = false, variant: _variant, size: _size, ...props }: any) => {
    if (asChild) {
      return children;
    }

    return <button {...props}>{children}</button>;
  },
}));

mock.module("@/components/ui/badge", () => ({
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
}));

mock.module("@/i18n/routing", () => ({
  routing: {
    locales: ["id", "en"],
    defaultLocale: "id",
    localePrefix: "as-needed",
  },
  Link: ({ children, href, prefetch: _prefetch, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  redirect: (href: string) => {
    throw new Error(`Redirecting to ${href}`);
  },
  getLocalizedHref: (locale: string, href: string) =>
    locale === "id" || !href.startsWith("/") ? href : `/${locale}${href}`,
  usePathname: () => "/dashboard/class/demo-sandbox-course",
  useRouter: () => ({ push: pushMock }),
}));

mock.module("@/lib/demo/sandbox-client", () => ({
  getDemoAssignmentStatus: getDemoAssignmentStatusMock,
  getDemoCreatedAssignments: getDemoCreatedAssignmentsMock,
  getDemoSandboxClientSnapshot: getDemoSandboxClientSnapshotMock,
  getDemoSandboxClientState: getDemoSandboxClientStateMock,
  hasDemoSandboxClientState: hasDemoSandboxClientStateMock,
  mergeDemoAssignments: (
    serverAssignments: Array<{ id: string; status: string }>,
    localAssignments: Array<{ id: string; status: string }> = [],
  ) => {
    const localAssignmentIds = new Set(localAssignments.map((assignment) => assignment.id));

    return [
      ...localAssignments.map((assignment) => ({
        ...assignment,
        status: getDemoAssignmentStatusMock(assignment.id),
      })),
      ...serverAssignments
        .filter((assignment) => !localAssignmentIds.has(assignment.id))
        .map((assignment) => ({
          ...assignment,
          status: getDemoAssignmentStatusMock(assignment.id),
        })),
    ];
  },
}));

mock.module("@/lib/hooks/use-fuzzy-search", () => ({
  useFuzzySearch: function <T>({ data }: { data: T[] }) {
    return data;
  },
}));

mock.module("../search-input", () => ({
  SearchInput: () => <div data-testid="search-input" />,
}));

mock.module("../empty-assignment-state", () => ({
  EmptyAssignmentState: () => <div data-testid="empty-state" />,
}));

describe("ClassAssignments", () => {
  beforeEach(() => {
    pushMock.mockReset();
    getDemoAssignmentStatusMock.mockReset();
    getDemoCreatedAssignmentsMock.mockReset();
    getDemoSandboxClientSnapshotMock.mockReset();
    getDemoSandboxClientStateMock.mockReset();
    hasDemoSandboxClientStateMock.mockReset();

    getDemoAssignmentStatusMock.mockReturnValue("BELUM_ISI");
    getDemoCreatedAssignmentsMock.mockReturnValue([]);
    getDemoSandboxClientStateMock.mockReturnValue({ submittedAssignments: [] });
    hasDemoSandboxClientStateMock.mockReturnValue(true);
    getDemoSandboxClientSnapshotMock.mockImplementation(() => {
      const sandboxState = getDemoSandboxClientStateMock();

      return {
        exists: hasDemoSandboxClientStateMock(),
        state: {
          ...sandboxState,
          createdAssignments: getDemoCreatedAssignmentsMock(),
        },
      };
    });
  });

  afterAll(() => {
    mock.restore();
  });

  it("uses persisted demo submission state for local teacher progress counts", async () => {
    getDemoCreatedAssignmentsMock.mockReturnValue([
      {
        id: "demo-local-1",
        courseId: "demo-sandbox-course",
        title: "Local Demo Assignment",
        description: "Teacher-created assignment",
        startAt: "2026-03-04T08:00:00.000Z",
        createdAt: "2026-03-04T08:00:00.000Z",
        skills: ["Prompt Engineering"],
        topics: ["Campus Sustainability"],
        submissionsCount: 2,
      },
    ]);

    const { ClassAssignments } = await import("../class-assignments");

    render(
      <ClassAssignments
        classId="demo-sandbox-course"
        courseData={{
          id: "demo-sandbox-course",
          namaMataKuliah: "Machine Learning",
          kelas: "K01",
        }}
        studentCount={2}
        currentUserId="demo-sandbox-teacher"
        enrolledStudentIds={["demo-sandbox-student", "demo-sandbox-student-2"]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Local Demo Assignment")).toBeTruthy();
    });

    expect(screen.getByText("1/2")).toBeTruthy();
    expect(screen.queryByText("waiting")).toBeNull();
  });

  it("uses an empty enrolled roster snapshot for local teacher progress counts", async () => {
    getDemoCreatedAssignmentsMock.mockReturnValue([
      {
        id: "demo-local-empty-roster",
        courseId: "demo-sandbox-course",
        title: "Empty Roster Assignment",
        description: "Teacher-created assignment",
        startAt: "2026-03-04T08:00:00.000Z",
        createdAt: "2026-03-04T08:00:00.000Z",
        skills: ["Prompt Engineering"],
        topics: ["Campus Sustainability"],
        submissionsCount: 2,
      },
    ]);

    const { ClassAssignments } = await import("../class-assignments");

    render(
      <ClassAssignments
        classId="demo-sandbox-course"
        courseData={{
          id: "demo-sandbox-course",
          namaMataKuliah: "Machine Learning",
          kelas: "K01",
        }}
        studentCount={0}
        currentUserId="demo-sandbox-teacher"
        enrolledStudentIds={[]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Empty Roster Assignment")).toBeTruthy();
    });

    expect(screen.getByText("none")).toBeTruthy();
    expect(screen.queryByText("2/2")).toBeNull();
    expect(screen.queryByText("waiting")).toBeNull();
  });

  it("recomputes seeded demo assignment progress from persisted submission state", async () => {
    const { ClassAssignments } = await import("../class-assignments");

    render(
      <ClassAssignments
        classId="demo-sandbox-course"
        courseData={{
          id: "demo-sandbox-course",
          namaMataKuliah: "Machine Learning",
          kelas: "K01",
        }}
        initialAssignments={[
          {
            id: "demo-sandbox-assignment",
            courseId: "demo-sandbox-course",
            title: "Seeded Demo Assignment",
            description: JSON.stringify({ text: "Seeded demo assignment" }),
            startAt: new Date("2026-03-03T08:00:00.000Z"),
            createdAt: new Date("2026-03-03T08:00:00.000Z"),
            status: "MENUNGGU",
            skills: ["Prompt Engineering"],
            topics: ["Campus Sustainability"],
            submissionsCount: 2,
          },
        ]}
        studentCount={2}
        currentUserId="demo-sandbox-teacher"
        enrolledStudentIds={["demo-sandbox-student", "demo-sandbox-student-2"]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Seeded Demo Assignment")).toBeTruthy();
    });

    expect(screen.getByText("1/2")).toBeTruthy();
    expect(screen.queryByText("waiting")).toBeNull();
  });
});
