"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { getLanguageSwitcherTarget } from "@/components/dashboard/language-switcher-shared";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const current = useLocale() as "id" | "en";
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("dashboard.languageSwitcher");
  const { nextLocale, currentLabel, switchLabel, currentFlagSrc } = getLanguageSwitcherTarget(
    current,
    t,
  );

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "px-2 py-3 sm:px-3 sm:py-4 lg:px-6 lg:py-7 rounded-full gap-x-1 sm:gap-x-2 lg:gap-x-4 min-w-fit cursor-pointer overflow-hidden",
        className,
      )}
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          router.replace(pathname, { locale: nextLocale });
        });
      }}
      aria-label={switchLabel}
      title={switchLabel}
    >
      <span className="text-sm sm:text-lg lg:text-2xl text-stone-950 font-semibold">
        {currentLabel}
      </span>
      {isPending ? (
        <LoadingSpinner
          size="sm"
          className="w-4 h-4 sm:w-5 sm:h-5 lg:w-10 lg:h-10 shrink-0"
          color="currentColor"
        />
      ) : (
        <Image
          src={currentFlagSrc}
          width={40}
          height={40}
          alt={switchLabel}
          className="w-4 h-4 sm:w-5 sm:h-5 lg:w-10 lg:h-10 shrink-0"
        />
      )}
    </Button>
  );
}
