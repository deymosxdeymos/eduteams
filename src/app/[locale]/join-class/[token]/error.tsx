"use client";

import { useTranslations } from "next-intl";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function JoinClassError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("dashboard.errorBoundary");

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Logo color="black" className="justify-center mb-8" />
          <h2 className="mt-6 text-3xl font-extrabold text-accent-foreground">{t("title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("joinClass")}</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error.message || t("generic")}</p>
          </div>

          <div className="space-y-4">
            <Button onClick={reset} variant="onboarding" className="w-full" size="lg">
              {t("retry")}
            </Button>

            <Button
              onClick={() => {
                window.location.href = "/dashboard";
              }}
              variant="outline"
              className="w-full"
              size="lg"
            >
              {t("goToDashboard")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
