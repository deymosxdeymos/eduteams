"use client";

import { ArrowRightLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { routing } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { DemoRole } from "@/lib/demo/config";

interface DemoRoleSwitcherProps {
  currentRole: DemoRole;
}

export function DemoRoleSwitcher({ currentRole }: DemoRoleSwitcherProps) {
  const t = useTranslations("dashboard.demo.roleSwitcher");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const targetRole: DemoRole = currentRole === "TEACHER" ? "STUDENT" : "TEACHER";
  const label = targetRole === "TEACHER" ? t("switchToTeacher") : t("switchToStudent");
  function handleSwitch() {
    const href = locale === routing.defaultLocale ? "/dashboard" : `/${locale}/dashboard`;

    startTransition(async () => {
      const response = await fetch("/api/demo/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole }),
      });
      const data = await response.json();

      if (data.success) {
        window.location.assign(href);
      }
    });
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSwitch}
        disabled={isPending}
        className="rounded-full border-2 bg-white px-4 py-2 shadow-lg gap-2"
      >
        {isPending ? <LoadingSpinner size="sm" /> : <ArrowRightLeft className="size-4" />}
        {isPending ? t("switching") : label}
      </Button>
    </div>
  );
}
