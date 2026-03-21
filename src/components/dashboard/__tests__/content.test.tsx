import { afterAll, afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import type { DosenCourseSummary } from "@/lib/dashboard/courses";
import { EMPTY_DASHBOARD_STATISTICS } from "@/lib/dashboard/statistics";

// Stub SearchInput to avoid next/dynamic loading CreateClassModal,
// whose dependency tree reaches server-only modules.
mock.module("@/components/dashboard/search-input", () => ({
  SearchInput: (props: any) =>
    React.createElement("input", {
      type: "search",
      placeholder: "Search for something?",
      value: props.searchValue ?? "",
      onChange: (e: any) => props.onSearchChange?.(e.target.value),
    }),
}));
mock.module("@/components/dashboard/empty-class-state", () => ({
  EmptyClassState: () => React.createElement("div", null, "Empty"),
}));

import Content from "../content";

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
  afterAll(() => {
    mock.restore();
  });

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders provided courses as class cards", () => {
    render(<Content statistics={EMPTY_DASHBOARD_STATISTICS} courses={MOCK_COURSES} />);

    expect(screen.getByText("Algoritma")).toBeTruthy();
    expect(screen.getByText("Basis Data")).toBeTruthy();
    expect(screen.getByText("30 students")).toBeTruthy();
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
