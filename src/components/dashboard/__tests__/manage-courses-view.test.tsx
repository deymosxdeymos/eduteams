import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";

mock.module("nuqs", () => ({
  parseAsBoolean: {},
  parseAsStringLiteral: () => ({}),
  useQueryState: (_key: string, options?: { defaultValue?: unknown }) => [
    options?.defaultValue ?? "",
    () => {},
  ],
}));

describe("ManageCoursesView", () => {
  it("keeps the synthetic demo course read-only", async () => {
    const { ManageCoursesView } = await import("../manage-courses-view");

    render(
      <ManageCoursesView
        courses={[
          {
            id: "demo-sandbox-course",
            name: "Machine Learning",
            classCode: "K01",
            periodLabel: "2025/2026 Genap",
            startYear: 2025,
            endYear: 2026,
            semester: "genap",
            assignmentsCount: 1,
            studentsCount: 8,
            isArchived: false,
            isManuallyArchived: false,
            updatedAt: "2026-03-04T10:30:00.000Z",
          },
        ]}
        searchPlaceholder="Cari kelas"
        archivedLabel="Kelas yang diarsipkan"
        emptyActiveMessage="Belum ada kelas aktif."
        emptyArchivedMessage="Belum ada kelas yang diarsipkan."
      />,
    );

    expect(screen.getByLabelText("Lihat kelas demo")).toBeInTheDocument();
    expect(screen.queryByLabelText("Sembunyikan kelas")).toBeNull();
    expect(screen.queryByLabelText("Tampilkan kelas")).toBeNull();
    expect(screen.queryByLabelText("Edit class")).toBeNull();
    expect(screen.queryByLabelText("Delete class")).toBeNull();
  });
});
