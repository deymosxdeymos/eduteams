import { describe, expect, it, mock } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import JoinClassModal from "@/components/dashboard/join-class-modal";

describe("JoinClassModal", () => {
  it("submits successfully and shows success message", async () => {
    const fetchMock = mock(async (_input: RequestInfo, _init?: RequestInit) => {
      return new Response(JSON.stringify({ message: "Successfully joined class!" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as any;
    (globalThis as any).fetch = fetchMock;

    render(<JoinClassModal onClassJoined={mock(() => {})} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Join Class/i,
      }),
    );

    const input = await screen.findByPlaceholderText("687ad8sa");
    fireEvent.change(input, { target: { value: "abc123" } });
    fireEvent.click(
      screen.getByRole("button", {
        name: /Join/i,
      }),
    );

    await screen.findByText("Successfully joined class!");
    expect(fetchMock).toHaveBeenCalledWith("/api/student/join-class", expect.any(Object));
  });

  it("shows error message on invalid token (404)", async () => {
    const fetchMock = mock(async (_input: RequestInfo, _init?: RequestInit) => {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }) as any;
    (globalThis as any).fetch = fetchMock;

    render(<JoinClassModal />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Join Class/i,
      }),
    );

    const input = await screen.findByPlaceholderText("687ad8sa");
    fireEvent.change(input, { target: { value: "badcode" } });
    fireEvent.click(
      screen.getByRole("button", {
        name: /Join/i,
      }),
    );

    await screen.findByText("The code you entered is incorrect. Please try again");
    const invalidInput = screen.getByPlaceholderText("687ad8sa");
    expect(invalidInput.getAttribute("aria-invalid")).toBe("true");
  });
});
