import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const toggleCourseArchiveMock = mock(async () => ({ success: true as const }));

mock.module("@/lib/actions/manage-courses", () => ({
  toggleCourseArchive: toggleCourseArchiveMock,
}));

mock.module("../manage-courses-view", () => ({
  ManageCoursesView: ({ courses, onArchiveToggle }: any) => (
    <button type="button" onClick={() => void onArchiveToggle?.(courses[0])}>
      toggle
    </button>
  ),
}));

describe("DosenManageContent", () => {
  beforeEach(() => {
    toggleCourseArchiveMock.mockReset();
    toggleCourseArchiveMock.mockResolvedValue({ success: true });
  });

  afterAll(() => {
    mock.restore();
  });

  it("toggles auto-archived courses from their effective archived state", async () => {
    const { DosenManageContent } = await import("../dosen-manage-content");

    render(
      <DosenManageContent
        courses={[
          {
            id: "00000000-0000-0000-0000-000000000001",
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

    fireEvent.click(screen.getByRole("button", { name: "toggle" }));

    await waitFor(() => {
      expect(toggleCourseArchiveMock).toHaveBeenCalledWith({
        courseId: "00000000-0000-0000-0000-000000000001",
        archive: false,
      });
    });
  });
});
