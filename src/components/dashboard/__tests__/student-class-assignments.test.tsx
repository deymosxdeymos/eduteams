import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

const pushMock = mock(() => undefined);
const mutateMock = mock(async () => undefined);
const getDemoAssignmentStatusMock = mock(() => "BELUM_ISI");
const getDemoCreatedAssignmentsMock = mock(() => []);
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
  Link: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
  getLocalizedHref: (locale: string, href: string) =>
    locale === "id" ? href : `/${locale}${href}`,
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
  mergeDemoAssignments: mergeDemoAssignmentsMock,
  useDemoSandboxClientState: () => ({
    createdAssignments: [],
    formedTeams: {},
  }),
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
    mergeDemoAssignmentsMock.mockReset();

    getDemoAssignmentStatusMock.mockReturnValue("BELUM_ISI");
    getDemoCreatedAssignmentsMock.mockReturnValue([]);
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
});
