"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface SkillTestInstructionModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
}

export default function SkillTestInstructionModal({
  isOpen,
  onCloseAction,
}: SkillTestInstructionModalProps) {
  const t = useTranslations("dashboard.assignments.quiz.instructions");
  const shouldReduceMotion = useReducedMotion();

  const backdropTransition = shouldReduceMotion
    ? { duration: 0.01 }
    : { duration: 0.2, ease: "easeOut" as const };
  const containerInitial = shouldReduceMotion ? { opacity: 0 } : { y: -32, opacity: 0 };
  const containerAnimate = { y: 0, opacity: 1 };
  const containerExit = shouldReduceMotion ? { opacity: 0 } : { y: -24, opacity: 0 };
  const containerTransition = shouldReduceMotion
    ? { duration: 0.01 }
    : { duration: 0.24, ease: [0.215, 0.61, 0.355, 1] as const };
  const contentInitial = shouldReduceMotion ? { opacity: 0 } : { scale: 0.98, opacity: 0 };
  const contentExit = shouldReduceMotion ? { opacity: 0 } : { scale: 0.98, opacity: 0 };
  const contentTransition = shouldReduceMotion
    ? { duration: 0.01 }
    : {
        duration: 0.2,
        delay: 0.04,
        ease: [0.215, 0.61, 0.355, 1] as const,
      };

  const likertScale = [
    { icon: "Novice", label: t("skillLevels.novice") },
    { icon: "Advanced-Beginner", label: t("skillLevels.advancedBeginner") },
    { icon: "Competent", label: t("skillLevels.competent") },
    { icon: "Proficient", label: t("skillLevels.proficient") },
    { icon: "Expert", label: t("skillLevels.expert") },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={backdropTransition}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={containerInitial}
            animate={containerAnimate}
            exit={containerExit}
            transition={containerTransition}
            className="relative"
          >
            <Image
              src="/mbti-type/ISTJ.svg"
              width={120}
              height={120}
              alt="ISTJ"
              className="absolute -top-20 left-1/2 transform -translate-x-1/2 z-10"
              priority
            />
            <motion.div
              initial={contentInitial}
              animate={{ scale: 1, opacity: 1 }}
              exit={contentExit}
              transition={contentTransition}
              className="bg-white rounded-4xl max-w-4xl w-full pt-12 px-12 pb-12 shadow-2xl"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-black mb-6">{t("skillsTitle")}</h1>
                <div className="text-left space-y-4 text-black leading-relaxed font-medium text-xl">
                  <p>1. {t("skillsStep1")}</p>
                  <p>2. {t("skillsStep2")}</p>
                  <p>3. {t("skillsStep3")}</p>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-start justify-between relative px-4">
                  {likertScale.map((item) => (
                    <div
                      key={item.icon}
                      className="flex flex-col items-center space-y-3 relative z-10"
                    >
                      <div className="bg-white flex items-center justify-center w-16 h-16">
                        <Image
                          src={`/quiz/skills/${item.icon}.svg`}
                          width={48}
                          height={48}
                          alt={item.label}
                          className="object-contain"
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-black max-w-20 leading-tight whitespace-pre-line font-medium">
                          {item.label}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="absolute top-8 left-12 right-12 h-1 bg-gray-300 z-0"></div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="onboarding"
                  size="long"
                  onClick={onCloseAction}
                  className="text-lg font-semibold"
                >
                  {t("startNow")}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
