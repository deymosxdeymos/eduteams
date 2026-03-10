"use client";

import { Smile } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { ExtendedUser } from "@/lib/types";
import { MBTIDisplay } from "./mbti-display";
import { PersonalityDescription } from "./personality-description";
import { PersonalityMetrics } from "./personality-metrics";
import { ProfileHeader } from "./profile-header";

const MBTIOverviewLayout = dynamic(
  () =>
    import("./mbti-overview-layout").then((mod) => ({
      default: mod.MBTIOverviewLayout,
    })),
  { loading: () => <div className="min-h-[24rem]" /> },
);

interface ProfileContentProps {
  user: ExtendedUser;
}

export function ProfileContent({ user }: ProfileContentProps) {
  const [isMbtiOpen, setIsMbtiOpen] = useState(false);

  return (
    <div className="bg-white rounded-3xl h-full flex flex-col overflow-hidden p-4 gap-4">
      <ProfileHeader user={user} />
      <div className="flex justify-start items-stretch gap-2">
        <MBTIDisplay user={user} />
        <PersonalityMetrics user={user} />
        <PersonalityDescription user={user} />
      </div>
      <Button
        onClick={() => setIsMbtiOpen(true)}
        variant="outline"
        className="rounded-full self-start border-2 border-black w-[19rem] h-[3rem]"
      >
        <Smile strokeWidth={3} />
        <p className="text-md text-stone-900 font-semibold">Lihat Persebaran MBTI</p>
      </Button>

      <Dialog open={isMbtiOpen} onOpenChange={setIsMbtiOpen}>
        <DialogContent
          aria-describedby={undefined}
          className="w-[95vw] max-w-[1400px] rounded-3xl p-0 border-0 max-h-[90vh]"
          showCloseButton={false}
        >
          {/* Accessible title for screen readers */}
          <DialogTitle className="sr-only">Persebaran MBTI</DialogTitle>
          <MBTIOverviewLayout user={user} isModal onRequestClose={() => setIsMbtiOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
