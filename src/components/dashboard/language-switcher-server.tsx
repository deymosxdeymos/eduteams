import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { getLanguageSwitcherTarget } from "@/components/dashboard/language-switcher-shared";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface LanguageSwitcherServerProps {
  className?: string;
}

export async function LanguageSwitcherServer({ className }: LanguageSwitcherServerProps) {
  const current = (await getLocale()) as "id" | "en";
  const t = await getTranslations("dashboard.languageSwitcher");
  const { nextLocale, switchLabel, flagSrc } = getLanguageSwitcherTarget(current, t);

  return (
    <Button
      variant="outline"
      size="sm"
      asChild
      className={cn(
        "px-2 py-3 sm:px-3 sm:py-4 lg:px-6 lg:py-7 rounded-full gap-x-1 sm:gap-x-2 lg:gap-x-4 min-w-fit cursor-pointer overflow-hidden",
        className,
      )}
    >
      <Link href="/" locale={nextLocale} aria-label={switchLabel} title={switchLabel}>
        <span className="text-sm sm:text-lg lg:text-2xl text-stone-950 font-semibold">
          {nextLocale.toUpperCase()}
        </span>
        <Image
          src={flagSrc}
          width={40}
          height={40}
          alt={switchLabel}
          className="w-4 h-4 sm:w-5 sm:h-5 lg:w-10 lg:h-10 shrink-0"
        />
      </Link>
    </Button>
  );
}
