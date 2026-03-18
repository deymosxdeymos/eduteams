import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

const pushMock = mock(() => undefined);
const mutateMock = mock(async () => undefined);
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
const clearDemoSandboxClientStateMock = mock(() => undefined);
const mergeDemoAssignmentsMock = mock(
  (serverAssignments: unknown[], localAssignments: unknown[] = []) => [
    ...localAssignments,
    ...serverAssignments,
  ],
);

mock.module("next-intl", () => ({
  useLocale: () => "id",
  useTranslations: () => (key: string) => key,
}));

mock.module("@/i18n/routing", () => ({
  routing: {
    locales: ["id", "en"],
    defaultLocale: "id",
    localePrefix: "as-needed",
  },
  Link: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
  redirect: (href: string) => {
    throw new Error(`Redirecting to ${href}`);
  },
  getLocalizedHref: (locale: string, href: string) =>
    locale === "id" ? href : `/${locale}${href}`,
  usePathname: () => "/dashboard/class/demo-sandbox-course",
  useRouter: () => ({ push: pushMock }),
}));

mock.module("swr", () => ({
  default: (_key: string, _fetcher: unknown, options?: { fallbackData?: unknown }) => ({
    data: options?.fallbackData,
    mutate: mutateMock,
  }),
}));

mock.module("@/lib/demo/sandbox-client", () => ({
  getDemoAssignmentStatus: getDemoAssignmentStatusMock,
  getDemoCreatedAssignments: getDemoCreatedAssignmentsMock,
  getDemoSandboxClientSnapshot: getDemoSandboxClientSnapshotMock,
  getDemoSandboxClientState: getDemoSandboxClientStateMock,
  hasDemoSandboxClientState: hasDemoSandboxClientStateMock,
  clearDemoSandboxClientState: clearDemoSandboxClientStateMock,
  mergeDemoAssignments: mergeDemoAssignmentsMock,
}));

mock.module("@/lib/hooks/use-fuzzy-search", () => ({
  useFuzzySearch: function <T>({ data }: { data: T[] }) {
    return data;
  },
}));

afterAll(() => {
  mock.restore();
});

describe("StudentClassAssignments", () => {
  beforeEach(() => {
    pushMock.mockReset();
    mutateMock.mockReset();
    getDemoAssignmentStatusMock.mockReset();
    getDemoCreatedAssignmentsMock.mockReset();
    getDemoSandboxClientSnapshotMock.mockReset();
    getDemoSandboxClientStateMock.mockReset();
    hasDemoSandboxClientStateMock.mockReset();
    clearDemoSandboxClientStateMock.mockReset();
    mergeDemoAssignmentsMock.mockReset();

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
    mergeDemoAssignmentsMock.mockImplementation(
      (serverAssignments: unknown[], localAssignments: unknown[] = []) => [
        ...localAssignments,
        ...serverAssignments,
      ],
    );
  });

  it("preserves local demo assignment metadata when opening an unsubmitted quiz", async () => {
    const { StudentClassAssignments } = await import("../student-class-assignments");

    render(
      <StudentClassAssignments
        classId="demo-sandbox-course"
        initialAssignments={[
          {
            id: "demo-local-1",
            courseId: "demo-sandbox-course",
            title: "Custom Demo Assignment",
            description: "Local assignment",
            startAt: new Date("2026-03-03T08:00:00.000Z"),
            createdAt: new Date("2026-03-03T08:00:00.000Z"),
            status: "BELUM_ISI",
            skills: ["Data Analysis", "Presentation Design"],
            topics: ["Retail Personalization"],
            submissionsCount: 0,
            submittedByMe: false,
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Custom Demo Assignment/i }));

    expect(pushMock).toHaveBeenCalledWith(
      "/dashboard/class/demo-sandbox-course/assignments/demo-local-1/quiz?demoTitle=Custom+Demo+Assignment&demoSkill=Data+Analysis&demoSkill=Presentation+Design&demoTopic=Retail+Personalization",
    );
  });

  it("treats locally persisted demo assignments as submitted before teams are formed", async () => {
    getDemoAssignmentStatusMock.mockReturnValue("MENUNGGU");
    getDemoSandboxClientStateMock.mockReturnValue({
      submittedAssignments: ["demo-local-2"],
    });
    getDemoCreatedAssignmentsMock.mockReturnValue([
      {
        id: "demo-local-2",
        courseId: "demo-sandbox-course",
        title: "Sandbox Local Assignment",
        description: "Teacher-created assignment",
        startAt: "2026-03-04T08:00:00.000Z",
        createdAt: "2026-03-04T08:00:00.000Z",
        skills: ["Prompt Engineering"],
        topics: ["Campus Sustainability"],
        submissionsCount: 0,
      },
    ]);

    const { StudentClassAssignments } = await import("../student-class-assignments");

    render(<StudentClassAssignments classId="demo-sandbox-course" />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Sandbox Local Assignment/i })).toBeDefined();
    });

    expect(screen.queryByText("Anda belum mengisi")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Sandbox Local Assignment/i }));

    expect(pushMock).toHaveBeenCalledWith(
      "/dashboard/class/demo-sandbox-course/assignments/demo-local-2?demoTitle=Sandbox+Local+Assignment&demoSkill=Prompt+Engineering&demoTopic=Campus+Sustainability",
    );
  });

  it("treats legacy persisted local demo assignments as submitted until submission state is migrated", async () => {
    getDemoAssignmentStatusMock.mockReturnValue("BELUM_ISI");
    hasDemoSandboxClientStateMock.mockReturnValue(false);
    getDemoSandboxClientStateMock.mockReturnValue({
      createdAssignments: [],
      formedTeams: {},
    });
    getDemoCreatedAssignmentsMock.mockReturnValue([
      {
        id: "demo-local-legacy",
        courseId: "demo-sandbox-course",
        title: "Legacy Local Assignment",
        description: "Teacher-created assignment",
        startAt: "2026-03-04T08:00:00.000Z",
        createdAt: "2026-03-04T08:00:00.000Z",
        skills: ["Prompt Engineering"],
        topics: ["Campus Sustainability"],
        submissionsCount: 2,
      },
    ]);

    const { StudentClassAssignments } = await import("../student-class-assignments");

    render(<StudentClassAssignments classId="demo-sandbox-course" studentCount={2} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Legacy Local Assignment/i })).toBeDefined();
    });

    expect(screen.getByText("statusWaiting")).toBeDefined();
    expect(screen.queryByText("Anda belum mengisi")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Legacy Local Assignment/i }));

    expect(pushMock).toHaveBeenCalledWith(
      "/dashboard/class/demo-sandbox-course/assignments/demo-local-legacy?demoTitle=Legacy+Local+Assignment&demoSkill=Prompt+Engineering&demoTopic=Campus+Sustainability",
    );
  });

  it("keeps the server-submitted demo assignment submitted when no local sandbox state exists yet", async () => {
    hasDemoSandboxClientStateMock.mockReturnValue(false);

    const { StudentClassAssignments } = await import("../student-class-assignments");

    render(
      <StudentClassAssignments
        classId="demo-sandbox-course"
        initialAssignments={[
          {
            id: "demo-sandbox-assignment",
            courseId: "demo-sandbox-course",
            title: "Seeded Demo Assignment",
            description: "Seeded assignment",
            startAt: new Date("2026-03-03T08:00:00.000Z"),
            createdAt: new Date("2026-03-03T08:00:00.000Z"),
            status: "MENUNGGU",
            skills: ["Data Analysis"],
            topics: ["Retail Personalization"],
            submissionsCount: 1,
            submittedByMe: true,
          },
        ]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("statusWaiting")).toBeDefined();
    });
    expect(screen.queryByText("Anda belum mengisi")).toBeNull();
  });

  it("preserves seeded submitted state when legacy sandbox storage has no submitted assignments field", async () => {
    hasDemoSandboxClientStateMock.mockReturnValue(false);
    getDemoSandboxClientStateMock.mockReturnValue({
      createdAssignments: [],
      formedTeams: {},
    });

    const { StudentClassAssignments } = await import("../student-class-assignments");

    render(
      <StudentClassAssignments
        classId="demo-sandbox-course"
        initialAssignments={[
          {
            id: "demo-sandbox-assignment",
            courseId: "demo-sandbox-course",
            title: "Seeded Demo Assignment",
            description: "Seeded assignment",
            startAt: new Date("2026-03-03T08:00:00.000Z"),
            createdAt: new Date("2026-03-03T08:00:00.000Z"),
            status: "MENUNGGU",
            skills: ["Data Analysis"],
            topics: ["Retail Personalization"],
            submissionsCount: 1,
            submittedByMe: true,
          },
        ]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("statusWaiting")).toBeDefined();
    });
    expect(screen.queryByText("Anda belum mengisi")).toBeNull();
  });

  it("treats the seeded demo assignment as submitted after local demo submission state is recorded", async () => {
    getDemoSandboxClientStateMock.mockReturnValue({
      submittedAssignments: ["demo-sandbox-assignment"],
    });

    const { StudentClassAssignments } = await import("../student-class-assignments");

    render(
      <StudentClassAssignments
        classId="demo-sandbox-course"
        initialAssignments={[
          {
            id: "demo-sandbox-assignment",
            courseId: "demo-sandbox-course",
            title: "Seeded Demo Assignment",
            description: "Seeded assignment",
            startAt: new Date("2026-03-03T08:00:00.000Z"),
            createdAt: new Date("2026-03-03T08:00:00.000Z"),
            status: "MENUNGGU",
            skills: ["Data Analysis"],
            topics: ["Retail Personalization"],
            submissionsCount: 1,
            submittedByMe: false,
          },
        ]}
      />,
    );

    expect(screen.queryByText("Anda belum mengisi")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Seeded Demo Assignment/i }));

    expect(pushMock).toHaveBeenCalledWith(
      "/dashboard/class/demo-sandbox-course/assignments/demo-sandbox-assignment",
    );
  });

  it("updates demo submission progress counts from local submission state", async () => {
    getDemoSandboxClientStateMock.mockReturnValue({
      submittedAssignments: ["demo-sandbox-assignment"],
    });

    const { StudentClassAssignments } = await import("../student-class-assignments");

    render(
      <StudentClassAssignments
        classId="demo-sandbox-course"
        studentCount={3}
        initialAssignments={[
          {
            id: "demo-sandbox-assignment",
            courseId: "demo-sandbox-course",
            title: "Seeded Demo Assignment",
            description: "Seeded assignment",
            startAt: new Date("2026-03-03T08:00:00.000Z"),
            createdAt: new Date("2026-03-03T08:00:00.000Z"),
            status: "BELUM_ISI",
            skills: ["Data Analysis"],
            topics: ["Retail Personalization"],
            submissionsCount: 2,
            submittedByMe: false,
          },
        ]}
      />,
    );

    expect(screen.getByText("statusWaiting")).toBeDefined();
    expect(screen.queryByText("statusProgress")).toBeNull();
  });
});
