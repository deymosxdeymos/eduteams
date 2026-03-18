"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const translations = {
  en: {
    title: "Something went wrong!",
    message: "A critical error occurred. Please refresh the page.",
    retry: "Try again",
  },
  id: {
    title: "Terjadi kesalahan!",
    message: "Terjadi kesalahan kritis. Silakan muat ulang halaman.",
    retry: "Coba lagi",
  },
};

function detectLocale(pathname: string | null): "en" | "id" {
  if (pathname?.startsWith("/en")) {
    return "en";
  }

  return "id";
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const locale = detectLocale(pathname);

  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  const t = translations[locale];

  return (
    <html lang={locale}>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.title}</h2>
              <p className="text-gray-600 mb-6">{t.message}</p>
              <button
                type="button"
                onClick={reset}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {t.retry}
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
