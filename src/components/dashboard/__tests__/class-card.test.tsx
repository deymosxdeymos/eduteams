import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { ClassCard } from "@/components/dashboard/class-card";

describe("ClassCard", () => {
  it("renders props and links to class page", () => {
    const classId = `class-${Math.random().toString(36).slice(2)}`;

    render(
      <ClassCard
        id={classId}
        title="Algoritma"
        academicYear="2024/2025"
        studentCount={12}
        classCode="RA"
      />,
    );

    expect(screen.getByText("Algoritma")).toBeTruthy();
    expect(screen.getByText("2024/2025")).toBeTruthy();
    expect(screen.getByText("12 students")).toBeTruthy();
    expect(screen.getByText("RA")).toBeTruthy();

    const card = screen.getByRole("link");
    expect(card.getAttribute("href")).toBe(`/dashboard/class/${classId}`);

    // Snapshot removed to avoid interactive updates in CI
  });

  it("supports keyboard activation via native link semantics", () => {
    const classId = `class-${Math.random().toString(36).slice(2)}`;

    render(
      <ClassCard
        id={classId}
        title="Algoritma"
        academicYear="2024/2025"
        studentCount={12}
        classCode="RA"
      />,
    );

    const card = screen.getByRole("link");
    expect(card.tagName).toBe("A");
    expect(card.getAttribute("href")).toBe(`/dashboard/class/${classId}`);
  });
});
