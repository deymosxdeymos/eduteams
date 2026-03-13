"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { submitDemoPersonality } from "@/lib/actions/demo-personality";
import { cn } from "@/lib/utils";

const MBTI_TYPES = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
] as const;

const TYPE_COLORS: Record<string, string> = {
  INTJ: "bg-purple-100 border-purple-300 text-purple-900",
  INTP: "bg-purple-100 border-purple-300 text-purple-900",
  ENTJ: "bg-purple-100 border-purple-300 text-purple-900",
  ENTP: "bg-purple-100 border-purple-300 text-purple-900",
  INFJ: "bg-emerald-100 border-emerald-300 text-emerald-900",
  INFP: "bg-emerald-100 border-emerald-300 text-emerald-900",
  ENFJ: "bg-emerald-100 border-emerald-300 text-emerald-900",
  ENFP: "bg-emerald-100 border-emerald-300 text-emerald-900",
  ISTJ: "bg-sky-100 border-sky-300 text-sky-900",
  ISFJ: "bg-sky-100 border-sky-300 text-sky-900",
  ESTJ: "bg-sky-100 border-sky-300 text-sky-900",
  ESFJ: "bg-sky-100 border-sky-300 text-sky-900",
  ISTP: "bg-amber-100 border-amber-300 text-amber-900",
  ISFP: "bg-amber-100 border-amber-300 text-amber-900",
  ESTP: "bg-amber-100 border-amber-300 text-amber-900",
  ESFP: "bg-amber-100 border-amber-300 text-amber-900",
};

export function DemoPersonalityPicker() {
  const t = useTranslations("onboarding.kepribadian");
  const tDemo = useTranslations("onboarding.kepribadian.demo");
  const locale = useLocale() as "id" | "en";
  const [selected, setSelected] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!selected) return;
    startTransition(async () => {
      await submitDemoPersonality(selected, locale);
    });
  }

  return (
    <main className="bg-white min-h-screen px-12 py-14">
      <Logo color="black" className="justify-center" />

      <div className="flex items-center justify-center space-x-2 pt-20">
        <Image
          src="/emoji/monocle.svg"
          width={80}
          height={80}
          alt="monocle"
          className="w-20 h-20"
        />
        <h1 className="font-bold text-black text-6xl tracking-tighter">{t("title")}</h1>
      </div>

      <div className="flex items-center justify-center p-6">
        <p className="font-normal text-black text-xl text-center tracking-tight">
          {tDemo("description")}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 max-w-2xl mx-auto pt-8">
        {MBTI_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setSelected(type)}
            className={cn(
              "rounded-xl border-2 py-4 text-lg font-bold transition-all duration-150",
              TYPE_COLORS[type],
              selected === type
                ? "ring-4 ring-blue-400 scale-105"
                : "opacity-70 hover:opacity-100 hover:scale-102",
            )}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-x-6 pt-10">
        <Button
          variant="onboarding"
          size="long"
          onClick={handleSubmit}
          disabled={!selected || isPending}
        >
          {isPending ? (
            <LoadingSpinner size="sm" color="white" />
          ) : (
            <>
              {t("selesai")}
              <ArrowRight strokeWidth={3} className="font-bold text-white text-lg" />
            </>
          )}
        </Button>
      </div>
    </main>
  );
}
