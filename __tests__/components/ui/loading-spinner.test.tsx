import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";
import { LoadingPage, LoadingSpinner } from "@/components/ui/loading-spinner";

describe("LoadingSpinner", () => {
  it("renders with default sizing and styling", () => {
    const { container } = render(<LoadingSpinner />);

    const spinner = container.querySelector('svg[role="status"]') as SVGElement;

    expect(spinner).toBeTruthy();
    expect(spinner.getAttribute("aria-label")).toBe("Loading");
    expect(spinner.classList.toString()).toContain("animate-spin");
  });

  it("honors size variants for sm, md, and lg", () => {
    const variants: Array<{ size: "sm" | "md" | "lg"; sizeClass: string }> = [
      { size: "sm", sizeClass: "size-4" },
      { size: "md", sizeClass: "size-5" },
      { size: "lg", sizeClass: "size-7" },
    ];

    for (const { size, sizeClass } of variants) {
      const { container, unmount } = render(<LoadingSpinner size={size} />);
      const spinner = container.querySelector('svg[role="status"]') as SVGElement;

      expect(spinner.classList.toString()).toContain(sizeClass);
      unmount();
    }
  });

  it("applies custom class names", () => {
    const { container } = render(<LoadingSpinner className="text-gray-500" />);

    const spinner = container.querySelector('svg[role="status"]') as SVGElement;

    expect(spinner.classList.toString()).toContain("text-gray-500");
  });
});

describe("LoadingPage", () => {
  it("renders a spinner with loading text", () => {
    const { container, getByText } = render(<LoadingPage />);

    const spinner = container.querySelector('svg[role="status"]');
    const loadingText = getByText("Loading...");

    expect(spinner).toBeTruthy();
    expect(loadingText).toBeTruthy();
  });
});
