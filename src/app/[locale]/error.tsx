"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("dashboard.errorBoundary");

  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("title")}</h2>
          <p className="text-gray-600 mb-6">{t("generic")}</p>
          <button
            type="button"
            onClick={reset}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {t("retry")}
          </button>
        </div>
      </div>
    </div>
  );
}
