"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { authClient } from "@/lib/auth-client";

export function LoginButton({ className }: { className?: string }) {
  const t = useTranslations("auth");
  const [isPending, startTransition] = useTransition();

  function handleGoogleSignIn() {
    startTransition(async () => {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className={className}
      onClick={handleGoogleSignIn}
      disabled={isPending}
    >
      {isPending ? (
        <LoadingSpinner size="sm" />
      ) : (
        <Image src="/google.svg" alt="Google Logo" width={24} height={24} className="size-6" />
      )}
      {isPending ? t("signingIn") : t("signInWithGoogle")}
    </Button>
  );
}
