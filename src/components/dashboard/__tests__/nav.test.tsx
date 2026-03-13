import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import Nav from "@/components/dashboard/nav";

const baseUser: any = {
  id: "u1",
  name: "Dosen",
  email: "d@example.com",
  role: "TEACHER",
  isOnboarded: true,
};

describe("Nav", () => {
  it("renders breadcrumb for class and assignment, highlights current crumb", async () => {
    const classObj: any = {
      id: "c1",
      namaMataKuliah: "Algoritma",
      kelas: "RA",
    };

    render(
      <Nav user={baseUser} className={classObj} assignmentTitle="Tugas 1" answersCrumb="Jawaban" />,
    );

    const classHeading = await screen.findByRole("heading", {
      level: 1,
      name: "Algoritma - RA",
    });
    expect(classHeading).toBeTruthy();

    const assignmentHeading = screen.getByRole("heading", {
      level: 2,
      name: "Tugas 1",
    });
    expect(assignmentHeading).toBeTruthy();

    const answersHeading = screen.getByRole("heading", {
      level: 3,
      name: "Jawaban",
    });
    expect(answersHeading).toBeTruthy();
  });
});
