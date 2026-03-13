import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

mock.module("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const pushMock = mock(() => undefined);
mock.module("@/i18n/routing", () => ({
  Link: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
  useRouter: () => ({ push: pushMock, refresh: mock(() => undefined) }),
}));

mock.module("swr", () => ({
  default: () => ({ data: null }),
}));

afterAll(() => {
  mock.restore();
});

describe("AssignmentActions", () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  it("routes seeded demo assignments to the demo quiz page", async () => {
    const { AssignmentActions } = await import("../assignment-actions");

    render(
      <AssignmentActions
        classId="demo-sandbox-course"
        assignmentId="demo-sandbox-assignment"
        assignmentTitle="Capstone Recommendation Sprint"
        demoSkills={["Python Programming"]}
        demoTopics={["Movie Recommendation"]}
        canManage={false}
        isStudent={true}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "viewMyAnswers" }));

    expect(pushMock).toHaveBeenCalledWith(
      "/dashboard/class/demo-sandbox-course/assignments/demo-sandbox-assignment/quiz",
    );
  });

  it("preserves local demo assignment metadata when routing to the quiz page", async () => {
    const { AssignmentActions } = await import("../assignment-actions");

    render(
      <AssignmentActions
        classId="demo-sandbox-course"
        assignmentId="demo-local-1"
        assignmentTitle="Custom Demo Assignment"
        demoSkills={["Data Analysis", "Presentation Design"]}
        demoTopics={["Retail Personalization"]}
        canManage={false}
        isStudent={true}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "viewMyAnswers" }));

    expect(pushMock).toHaveBeenCalledWith(
      "/dashboard/class/demo-sandbox-course/assignments/demo-local-1/quiz?demoTitle=Custom+Demo+Assignment&demoSkill=Data+Analysis&demoSkill=Presentation+Design&demoTopic=Retail+Personalization",
    );
  });

  it("keeps the persisted assignment answers CTA behavior", async () => {
    const { AssignmentActions } = await import("../assignment-actions");

    render(
      <AssignmentActions
        classId="course-1"
        assignmentId="assignment-1"
        canManage={false}
        isStudent={true}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "viewMyAnswers" }));

    expect(pushMock).toHaveBeenCalledWith(
      "/dashboard/class/course-1/assignments/assignment-1/quiz",
    );
  });
});
