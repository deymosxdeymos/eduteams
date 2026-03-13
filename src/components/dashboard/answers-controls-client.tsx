"use client";

import { ArrowLeft, ChevronLeft, ChevronRight, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StudentLite {
  id: string;
  name: string;
}

interface AnswersControlsClientProps {
  backHref: string;
  students: StudentLite[];
  currentIndex: number;
  baseHref?: string; // optional explicit base path, else computed
}

export function AnswersControlsClient({
  backHref,
  students,
  currentIndex,
  baseHref,
}: AnswersControlsClientProps) {
  const t = useTranslations("dashboard.answers");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const total = students.length;
  const index = Math.max(0, Math.min(currentIndex, Math.max(0, total - 1)));
  const currentStudent = students[index];

  const hrefBase = baseHref || pathname || "";
  const searchParamsString = searchParams?.toString() || "";

  const makeHref = useCallback(
    (studentId: string) => {
      const sp = new URLSearchParams(searchParamsString);
      sp.set("studentId", studentId);
      return `${hrefBase}?${sp.toString()}`;
    },
    [hrefBase, searchParamsString],
  );

  const goPrev = () => {
    if (total === 0) return;
    const prevIndex = (index - 1 + total) % total;
    const href = makeHref(students[prevIndex].id);
    router.push(href);
  };
  const goNext = () => {
    if (total === 0) return;
    const nextIndex = (index + 1) % total;
    const href = makeHref(students[nextIndex].id);
    router.push(href);
  };

  return (
    <div className="flex items-center justify-between w-full px-2">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm text-neutral-700 hover:text-black"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-bold">{t("back")}</span>
      </Link>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={goPrev}
          disabled={total <= 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-sm text-neutral-700 min-w-[80px] text-center">
          {total > 0 ? `${index + 1} ${t("of")} ${total}` : `0 ${t("of")} 0`}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={goNext}
          disabled={total <= 1}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-2 pl-2">
          <UserIcon className="w-4 h-4 text-neutral-700" />
          <Select
            value={currentStudent?.id || ""}
            onValueChange={(v) => router.push(makeHref(v))}
            disabled={total === 0}
          >
            <SelectTrigger className="!h-9 !min-h-[2.25rem] w-[16rem] rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm focus:border-neutral-400 focus:ring-2 focus:ring-neutral-400/20">
              <SelectValue placeholder={t("studentSelect")} />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name || t("student")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
