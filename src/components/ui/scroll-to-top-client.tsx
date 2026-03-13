"use client";

import dynamic from "next/dynamic";

export const ScrollToTopClient = dynamic(
  () =>
    import("@/components/ui/scroll-to-top-button").then((mod) => ({
      default: mod.ScrollToTopButton,
    })),
  { ssr: false },
);
