"use client";

import { RotateCcw } from "lucide-react";
import { useLocale } from "next-intl";
import { useState, useTransition } from "react";
import { routing } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { clearDemoSandboxClientState } from "@/lib/demo/sandbox-client";

const RESET_ERROR_MESSAGE = "Failed to reset demo. Please try again.";

export function DemoResetButton() {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleReset() {
    startTransition(async () => {
      setError(null);

      try {
        const response = await fetch("/api/demo/reset", { method: "POST" });

        if (!response.ok) {
          setError(RESET_ERROR_MESSAGE);
          return;
        }

        clearDemoSandboxClientState();
        window.location.assign(locale === routing.defaultLocale ? "/" : `/${locale}`);
      } catch {
        setError(RESET_ERROR_MESSAGE);
      }
    });
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleReset}
        disabled={isPending}
        className="gap-2 rounded-full border-2 bg-white px-4 py-2 shadow-lg"
      >
        <RotateCcw className="size-4" />
        Reset Demo
      </Button>
      {error ? (
        <p
          role="alert"
          className="max-w-64 rounded-md bg-white/95 px-3 py-2 text-xs text-red-600 shadow-lg"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
