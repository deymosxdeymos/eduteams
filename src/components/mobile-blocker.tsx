"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useAnimatedMascot } from "./use-animated-mascot";

const moodFloatClass = {
  idle: "mascot-float",
  annoyed: "",
  furious: "",
  defeated: "",
} as const;

const moodTextClass = {
  idle: "",
  annoyed: "",
  furious: "animate-[shake-subtle_300ms_ease-out]",
  defeated: "animate-[shake-subtle_300ms_ease-out]",
} as const;

const DESKTOP_QUERY = "(min-width: 1024px)";

const AnimatedMascot = dynamic(
  () =>
    import("./animated-mascot").then((mod) => ({
      default: mod.AnimatedMascot,
    })),
  {
    ssr: false,
    loading: () => <div aria-hidden="true" className="h-[234px] w-[242px]" />,
  },
);

type MobileBlockedScreenProps = {
  hideOnDesktop?: boolean;
};

export function MobileBlockedScreen({ hideOnDesktop = false }: MobileBlockedScreenProps = {}) {
  const t = useTranslations("mobileBlocker");
  const { mood, returning, svgRef, handlePoke } = useAnimatedMascot();
  const [showMascot, setShowMascot] = useState(!hideOnDesktop);

  useEffect(() => {
    if (!hideOnDesktop) {
      setShowMascot(true);
      return;
    }

    const mql = window.matchMedia(DESKTOP_QUERY);
    setShowMascot(!mql.matches);

    function onChange(e: MediaQueryListEvent) {
      setShowMascot(!e.matches);
    }

    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [hideOnDesktop]);

  const containerClassName = hideOnDesktop
    ? "fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-muted p-6 lg:hidden"
    : "fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-muted p-6";

  return (
    <div
      className={containerClassName}
      onClick={handlePoke}
      onKeyDown={handlePoke}
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
      tabIndex={0}
    >
      <div className="flex max-w-sm flex-col items-center text-center overflow-visible">
        <div className={`overflow-visible ${moodFloatClass[mood]}`}>
          {showMascot ? (
            <AnimatedMascot mood={mood} returning={returning} svgRef={svgRef} />
          ) : (
            <div aria-hidden="true" className="h-[234px] w-[242px]" />
          )}
        </div>

        <div className={`mt-6 space-y-3 ${moodTextClass[mood]}`}>
          <h1 className="text-xl font-bold tracking-tight text-foreground">{t("title")}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("description")}</p>
        </div>

        <div className="mt-8 flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
          <Image src="/window.svg" alt="" width={16} height={16} className="opacity-60" />
          {t("badge")}
        </div>
      </div>
    </div>
  );
}

export function MobileBlocker({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MobileBlockedScreen hideOnDesktop />
      <div className="hidden lg:block">{children}</div>
    </>
  );
}
