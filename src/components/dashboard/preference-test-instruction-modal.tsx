"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface PreferenceTestInstructionModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
}

export default function PreferenceTestInstructionModal({
  isOpen,
  onCloseAction,
}: PreferenceTestInstructionModalProps) {
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
    { icon: "Strongly-Disagree", label: t("topicLevels.stronglyDisagree") },
    { icon: "Disagree", label: t("topicLevels.disagree") },
    { icon: "Neutral", label: t("topicLevels.neutral") },
    { icon: "Agree", label: t("topicLevels.agree") },
    { icon: "Strongly-Agree", label: t("topicLevels.stronglyAgree") },
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
              src="/mbti-type/INFP.svg"
              width={120}
              height={120}
              alt="INFP"
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
                <h1 className="text-3xl font-bold text-black mb-6">{t("topicsTitle")}</h1>
                <div className="text-left space-y-4 text-black leading-relaxed font-medium text-xl">
                  <p>1. {t("topicsStep1")}</p>
                  <p>2. {t("topicsStep2")}</p>
                  <p>3. {t("topicsStep3")}</p>
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
                          src={`/mbti-test/${item.icon}.svg`}
                          width={48}
                          height={48}
                          alt={item.label}
                          className="object-contain"
                        />
                      </div>
                      <p className="text-xs text-black text-center max-w-24 leading-tight whitespace-pre-line font-medium">
                        {item.label}
                      </p>
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
