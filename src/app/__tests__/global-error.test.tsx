import { afterAll, afterEach, describe, expect, it, mock } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

const usePathnameMock = mock(() => "/");

mock.module("next/navigation", () => ({
  useRouter: () => ({
    push: () => {},
    refresh: () => {},
    back: () => {},
  }),
  usePathname: usePathnameMock,
  useSearchParams: () => new URLSearchParams(),
  redirect: (url: string) => {
    throw new Error(`Redirecting to ${url}`);
  },
  permanentRedirect: (url: string) => {
    throw new Error(`Permanent redirect to ${url}`);
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

describe("GlobalError", () => {
  afterEach(() => {
    usePathnameMock.mockReset();
    usePathnameMock.mockReturnValue("/");
  });

  afterAll(() => {
    mock.restore();
  });

  it("renders English copy for /en routes without reading window.location", async () => {
    usePathnameMock.mockReturnValue("/en/dashboard");
    const { default: GlobalError } = await import("../global-error");

    const html = renderToStaticMarkup(
      <GlobalError error={new Error("boom")} reset={() => undefined} />,
    );

    expect(html).toContain('lang="en"');
    expect(html).toContain("Something went wrong!");
  });

  it("falls back to Indonesian for non-English routes", async () => {
    const { default: GlobalError } = await import("../global-error");

    const html = renderToStaticMarkup(
      <GlobalError error={new Error("boom")} reset={() => undefined} />,
    );

    expect(html).toContain('lang="id"');
    expect(html).toContain("Terjadi kesalahan!");
  });
});
