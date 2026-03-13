import { afterEach, describe, expect, it, mock } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MultiSelectComboboxBadges } from "../../../src/components/ui/multi-select-combobox-badges";

describe("MultiSelectComboboxBadges", () => {
  afterEach(() => {
    mock.restore();
  });

  it("fetches suggestions only after the popover opens and refetches on query change while open", async () => {
    const requestedUrls: string[] = [];
    const fetchMock = mock((input: string | URL | Request) => {
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      requestedUrls.push(url);

      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: ["React", "TypeScript", "Testing"],
        }),
      });
    });

    global.fetch = fetchMock as typeof fetch;

    render(
      <MultiSelectComboboxBadges
        value={[]}
        onChange={() => {}}
        placeholder="Search skills"
        suggestionsEndpoint="http://localhost/api/courses/course-1/skills"
      />,
    );

    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(fetchMock).not.toHaveBeenCalled();

    const input = screen.getByRole("combobox");
    fireEvent.focus(input);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    expect(requestedUrls[0]).toBe("http://localhost/api/courses/course-1/skills");

    fireEvent.change(input, { target: { value: "rea" } });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    const refetchUrl = new URL(requestedUrls[1]!);
    expect(refetchUrl.pathname).toBe("/api/courses/course-1/skills");
    expect(refetchUrl.searchParams.get("q")).toBe("rea");
  });
});
