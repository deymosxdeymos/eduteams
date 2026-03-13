"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { authClient } from "@/lib/auth-client";

interface CookieStoreAPI {
  getAll(): Promise<Array<{ name: string; value: string }>>;
  delete(name: string): Promise<void>;
}

const CLEAR_SESSION_REDIRECT = "/api/auth/clear-session?redirect=/";

export default function SessionClearClient() {
  const router = useRouter();

  useEffect(() => {
    const clearSession = async () => {
      try {
        await authClient.signOut();
      } catch (error) {
        console.error("Error clearing session:", error);
        try {
          if (
            "cookieStore" in window &&
            (window as unknown as { cookieStore?: CookieStoreAPI }).cookieStore
          ) {
            const cookieStore = (window as unknown as { cookieStore: CookieStoreAPI }).cookieStore;
            const cookies = await cookieStore.getAll();
            for (const cookie of cookies) {
              await cookieStore.delete(cookie.name);
            }
          } else {
            document.cookie.split(";").forEach((c) => {
              const name = c.replace(/^ +/, "").split("=")[0];
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            });
          }
        } catch (cookieError) {
          console.error("Error clearing cookies:", cookieError);
        }
      }

      try {
        const response = await fetch(CLEAR_SESSION_REDIRECT, { method: "POST" });
        if (response.redirected) {
          const redirectUrl = new URL(response.url);
          router.replace(`${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`);
        } else {
          router.replace("/");
        }
        return;
      } catch (error) {
        console.error("Error clearing demo data:", error);
      }

      router.replace(CLEAR_SESSION_REDIRECT);
    };

    clearSession();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <LoadingSpinner size="lg" color="#4b5563" className="mx-auto" />
        <p className="mt-4 text-gray-600">Clearing session...</p>
      </div>
    </div>
  );
}
