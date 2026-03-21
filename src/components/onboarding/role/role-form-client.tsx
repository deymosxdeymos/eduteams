"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import RoleSelect from "@/components/onboarding/role/role-select";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { submitRole } from "@/lib/actions/role";
import { cn } from "@/lib/utils";

interface RoleFormClientProps {
  initialRole?: "dosen" | "mahasiswa";
  canChooseTeacher?: boolean;
  initialShowDosenInvalid?: boolean;
}

export default function RoleFormClient({
  initialRole,
  canChooseTeacher = true,
  initialShowDosenInvalid = false,
}: RoleFormClientProps) {
  const t = useTranslations("onboarding.role");
  const [selectedRole, setSelectedRole] = useState<"dosen" | "mahasiswa" | undefined>(initialRole);
  const [isPending, startTransition] = useTransition();
  const [shakeKey, setShakeKey] = useState(0);
  const [showDosenInvalid, setShowDosenInvalid] = useState(initialShowDosenInvalid);

  const isBlocked = !selectedRole;

  const handleRoleSelect = (role: "dosen" | "mahasiswa") => {
    if (role === "dosen" && !canChooseTeacher) {
      setShowDosenInvalid(true);
      return;
    }

    setShowDosenInvalid(false);
    setSelectedRole(role);
  };

  const handleSubmit = async (formData: FormData) => {
    if (isPending) {
      return;
    }

    if (isBlocked) {
      setShakeKey((prev) => prev + 1);
      return;
    }

    startTransition(async () => {
      await submitRole(formData);
    });
  };

  const handleBlockedClick = (e: React.MouseEvent) => {
    if (isPending || !isBlocked) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    setShakeKey((prev) => prev + 1);
  };

  return (
    <form action={handleSubmit}>
      <div className="flex flex-col items-center justify-center space-y-6 py-20">
        <RoleSelect
          onRoleSelect={handleRoleSelect}
          selectedRole={selectedRole}
          showDosenInvalid={showDosenInvalid}
        />
      </div>
      <div className="flex items-center justify-center gap-x-2">
        <input type="hidden" name="role" value={selectedRole || ""} readOnly />
        <motion.div
          key={shakeKey}
          animate={
            shakeKey > 0
              ? {
                  x: [-4, 4, -3, 3, -2, 2, 0],
                  transition: { duration: 0.18, ease: "easeInOut" },
                }
              : {}
          }
          className="w-[700px]"
        >
          <Button
            type="submit"
            variant="onboarding"
            size="long"
            disabled={isPending}
            aria-disabled={isBlocked || isPending}
            onClick={handleBlockedClick}
            className={cn(
              "w-full",
              isBlocked &&
                !isPending &&
                "bg-neutral-200 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-400 cursor-not-allowed",
            )}
          >
            {isPending && <LoadingSpinner size="sm" color="white" />}
            {isPending ? t("loading") : t("continue")}
            <ArrowRight strokeWidth={3} className="font-bold text-neutral-400 text-lg" />
          </Button>
        </motion.div>
      </div>
    </form>
  );
}
