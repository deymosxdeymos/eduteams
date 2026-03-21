import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { cloneElement, isValidElement } from "react";

let currentLocale = "en";

function installManageRowActionMocks() {
  mock.module("next-intl", () => ({
    useLocale: () => currentLocale,
    useTranslations: (namespace?: string) => {
      const localeAtRender = currentLocale;
      return (key: string) => `${localeAtRender}:${namespace ?? "root"}.${key}`;
    },
  }));

  mock.module("nuqs", () => ({
    parseAsBoolean: {},
    parseAsStringLiteral: () => ({}),
    useQueryState: (key: string, options?: { defaultValue?: unknown }) => [
      key === "archived" ? true : (options?.defaultValue ?? ""),
      () => {},
    ],
  }));

  mock.module("next/link", () => ({
    default: ({ children, href, ...props }: any) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  }));

  mock.module("@/i18n/routing", () => ({
    routing: {
      locales: ["id", "en"],
      defaultLocale: "id",
      localePrefix: "as-needed",
    },
    Link: ({ children, href, ...props }: any) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
    redirect: (href: string) => {
      throw new Error(`Redirecting to ${href}`);
    },
    getLocalizedHref: (locale: string, href: string) =>
      locale === "id" || !href.startsWith("/") ? href : `/${locale}${href}`,
    usePathname: () => "/dashboard/manage",
    useRouter: () => ({
      push: () => undefined,
      replace: () => undefined,
      refresh: () => undefined,
    }),
  }));

  mock.module("@/components/ui/button", () => ({
    Button: ({ children, asChild = false, ...props }: any) => {
      if (asChild && isValidElement(children)) {
        return cloneElement(children, props);
      }

      return <button {...props}>{children}</button>;
    },
  }));

  mock.module("@/components/ui/dialog", () => ({
    Dialog: ({ children }: any) => <div>{children}</div>,
    DialogClose: ({ children, asChild = false, ...props }: any) => {
      if (asChild && isValidElement(children)) {
        return cloneElement(children, props);
      }

      return <button {...props}>{children}</button>;
    },
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogDescription: ({ children }: any) => <div>{children}</div>,
    DialogFooter: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <div>{children}</div>,
    DialogTrigger: ({ children, asChild = false, ...props }: any) => {
      if (asChild && isValidElement(children)) {
        return cloneElement(children, props);
      }

      return <button {...props}>{children}</button>;
    },
  }));
}

installManageRowActionMocks();

describe("manage row action locale updates", () => {
  beforeEach(() => {
    currentLocale = "en";
  });

  afterAll(() => {
    mock.restore();
  });

  it("updates assignment row action labels after a locale change", async () => {
    const { ManageAssignmentsView } = await import("../manage-assignments-view");

    const props = {
      assignments: [
        {
          id: "assignment-1",
          title: "Assignment 1",
          description: null,
          status: "MENUNGGU" as const,
          startAt: "2026-03-01T10:00:00.000Z",
          createdAt: "2026-03-01T10:00:00.000Z",
          isArchived: false,
          submissionsCount: 2,
          totalStudents: 10,
          skills: [],
          topics: [],
        },
      ],
      courseId: "course-1",
      totalStudents: 10,
    };

    const { rerender } = render(<ManageAssignmentsView {...props} />);

    const openAssignmentLinkEn = screen.getByLabelText(
      "en:dashboard.dosenManage.assignments.row.openAssignment",
    );
    expect(openAssignmentLinkEn).toBeInTheDocument();
    expect(openAssignmentLinkEn).toHaveAttribute(
      "href",
      "/dashboard/class/course-1/assignments/assignment-1",
    );
    expect(
      screen.getAllByLabelText("en:dashboard.dosenManage.archive.hideAssignment").length,
    ).toBeGreaterThan(0);

    currentLocale = "id";
    rerender(<ManageAssignmentsView key="id" {...props} />);

    const openAssignmentLinkId = screen.getByLabelText(
      "id:dashboard.dosenManage.assignments.row.openAssignment",
    );
    expect(openAssignmentLinkId).toBeInTheDocument();
    expect(openAssignmentLinkId).toHaveAttribute(
      "href",
      "/dashboard/class/course-1/assignments/assignment-1",
    );
    expect(
      screen.queryByLabelText("en:dashboard.dosenManage.assignments.row.openAssignment"),
    ).toBeNull();
    expect(
      screen.getAllByLabelText("id:dashboard.dosenManage.archive.hideAssignment").length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryAllByLabelText("en:dashboard.dosenManage.archive.hideAssignment"),
    ).toHaveLength(0);
  });

  it("updates course row action labels after a locale change", async () => {
    const { ManageCoursesView } = await import("../manage-courses-view");

    const props = {
      courses: [
        {
          id: "course-1",
          name: "Machine Learning",
          classCode: "K01",
          periodLabel: "2025/2026 Genap",
          startYear: 2025,
          endYear: 2026,
          semester: "genap" as const,
          assignmentsCount: 1,
          studentsCount: 8,
          isArchived: false,
          isManuallyArchived: false,
          updatedAt: "2026-03-04T10:30:00.000Z",
        },
      ],
    };

    const { rerender } = render(<ManageCoursesView {...props} />);

    expect(screen.getByLabelText("en:dashboard.dosenManage.row.openClass")).toBeInTheDocument();
    expect(
      screen.getAllByLabelText("en:dashboard.dosenManage.archive.hideClass").length,
    ).toBeGreaterThan(0);

    currentLocale = "id";
    rerender(<ManageCoursesView {...props} />);

    expect(screen.getByLabelText("id:dashboard.dosenManage.row.openClass")).toBeInTheDocument();
    expect(screen.queryByLabelText("en:dashboard.dosenManage.row.openClass")).toBeNull();
    expect(
      screen.getAllByLabelText("id:dashboard.dosenManage.archive.hideClass").length,
    ).toBeGreaterThan(0);
    expect(screen.queryAllByLabelText("en:dashboard.dosenManage.archive.hideClass")).toHaveLength(
      0,
    );
  });

  it("uses the effective archived state for auto-archived course row actions", async () => {
    const { ManageCoursesView } = await import("../manage-courses-view");

    render(
      <ManageCoursesView
        courses={[
          {
            id: "course-2",
            name: "Algorithms",
            classCode: "K02",
            periodLabel: "2024/2025 Ganjil",
            startYear: 2024,
            endYear: 2025,
            semester: "ganjil",
            assignmentsCount: 1,
            studentsCount: 8,
            isArchived: true,
            isManuallyArchived: false,
            updatedAt: "2026-03-04T10:30:00.000Z",
          },
        ]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "en:dashboard.dosenManage.archive.archivedClasses",
      }),
    );

    expect(
      screen.getAllByLabelText("en:dashboard.dosenManage.archive.showClass").length,
    ).toBeGreaterThan(0);
    expect(screen.queryAllByLabelText("en:dashboard.dosenManage.archive.hideClass")).toHaveLength(
      0,
    );
  });

  it("keeps a restored past course visible after an optimistic edit", async () => {
    const { ManageCoursesView } = await import("../manage-courses-view");

    const fetchMock = mock(async (_input: RequestInfo, _init?: RequestInit) => {
      return new Response(
        JSON.stringify({
          data: {
            namaMataKuliah: "Algorithms II",
            kelas: "K02",
            periode: "genap",
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }) as typeof fetch;
    const originalFetch = globalThis.fetch;
    (globalThis as any).fetch = fetchMock;

    let resolveArchiveToggle: (() => void) | undefined;
    const archiveTogglePromise = new Promise<void>((resolve) => {
      resolveArchiveToggle = resolve;
    });

    try {
      render(
        <ManageCoursesView
          courses={[
            {
              id: "course-3",
              name: "Algorithms",
              classCode: "K02",
              periodLabel: "2024/2025 Ganjil",
              startYear: 2024,
              endYear: 2025,
              semester: "ganjil",
              assignmentsCount: 1,
              studentsCount: 8,
              isArchived: true,
              isManuallyArchived: false,
              updatedAt: "2026-03-04T10:30:00.000Z",
            },
          ]}
          onArchiveToggle={() => archiveTogglePromise}
        />,
      );

      const confirmRestoreButton = screen
        .getAllByRole("button", {
          name: "en:dashboard.dosenManage.archive.showClass",
        })
        .find((button) =>
          button.textContent?.includes("en:dashboard.dosenManage.archive.showClass"),
        );

      expect(confirmRestoreButton).toBeDefined();
      fireEvent.click(confirmRestoreButton!);

      await waitFor(() => {
        expect(screen.getByText("Algorithms")).toBeInTheDocument();
        expect(
          screen.getByText("en:dashboard.dosenManage.empty.noArchivedClasses"),
        ).toBeInTheDocument();
      });

      fireEvent.change(screen.getByDisplayValue("Algorithms"), {
        target: { value: "Algorithms II" },
      });

      const [, semesterSelect] = screen.getAllByRole("combobox");
      fireEvent.change(semesterSelect, { target: { value: "genap" } });
      fireEvent.click(screen.getByRole("button", { name: "en:dashboard.modals.editClass.button" }));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith("/api/courses/course-3", expect.any(Object));
        expect(screen.getByText("Algorithms II")).toBeInTheDocument();
        expect(
          screen.getByText("en:dashboard.dosenManage.empty.noArchivedClasses"),
        ).toBeInTheDocument();
      });
    } finally {
      resolveArchiveToggle?.();
      (globalThis as any).fetch = originalFetch;
    }
  });
});
