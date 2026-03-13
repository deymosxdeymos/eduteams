import { afterEach, describe, expect, it, mock } from "bun:test";
import { render, waitFor } from "@testing-library/react";

mock.module("../student-profile-content", () => ({
  StudentProfileContent: () => null,
}));

const initialStudents = [
  {
    id: "student-1",
    name: "Alice",
    nim: "12345678",
    email: "alice@example.com",
    mbtiType: "INTJ",
    ei: 1,
    sn: 1,
    tf: 1,
    pj: 1,
  },
];

describe("StudentList", () => {
  afterEach(() => {
    mock.restore();
  });

  it("does not fetch on initial render when initialData is present for managers", async () => {
    const fetchMock = mock(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ data: [] }),
      }),
    );

    global.fetch = fetchMock as typeof fetch;
    const { StudentList } = await import("../student-list");

    render(
      <StudentList
        classId="course-1"
        canManage
        initialData={initialStudents}
        currentUserId="lecturer-1"
      />,
    );

    await waitFor(() => {
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
