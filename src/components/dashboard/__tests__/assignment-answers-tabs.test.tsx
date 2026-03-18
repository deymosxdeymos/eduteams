import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { AssignmentAnswersTabs } from "../assignment-answers-tabs";

describe("AssignmentAnswersTabs", () => {
  it("renders hydrated answer rows for the default personality tab", () => {
    render(
      <AssignmentAnswersTabs
        personalityRows={[
          {
            id: "q1",
            text: "Saya tidak suka menjadi pusat perhatian",
            answerValue: 2,
          },
        ]}
        skills={[{ name: "Python Programming", level: 0.75 }]}
        topics={[{ name: "Retail Personalization", preference: 0.75 }]}
        mbtiType="ENFP"
      />,
    );

    expect(screen.getByText("Saya tidak suka menjadi pusat perhatian")).toBeTruthy();
    expect(screen.getByText(/disagree|tidak setuju/i)).toBeTruthy();
    expect(screen.getByRole("tab", { name: /personality/i }).getAttribute("data-state")).toBe(
      "active",
    );
  });
});
