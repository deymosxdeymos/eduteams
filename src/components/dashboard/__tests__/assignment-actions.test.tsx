import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

mock.module("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

const pushMock = mock(() => undefined);
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
    locale === "id" || !href.startsWith("/") ? href : `/${locale}${href}`,
  usePathname: () => "/dashboard/class/test-course-1",
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

  it("routes seeded assignments to the quiz page", async () => {
    const { AssignmentActions } = await import("../assignment-actions");

    render(
      <AssignmentActions
        classId="test-course-1"
        assignmentId="test-assignment-1"
        assignmentTitle="Capstone Recommendation Sprint"
        canManage={false}
        isStudent={true}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "viewMyAnswers" }));

    expect(pushMock).toHaveBeenCalledWith(
      "/dashboard/class/test-course-1/assignments/test-assignment-1/quiz",
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
