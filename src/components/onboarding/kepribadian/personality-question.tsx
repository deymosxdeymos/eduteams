"use client";

import { motion } from "framer-motion";
import { MessageSquareWarning } from "lucide-react";
import Image from "next/image";
import { useId } from "react";

interface PersonalityQuestionProps {
  question: string;
  onAnswerAction: (value: number) => void;
  hasError?: boolean;
  questionId?: number | string;
  initialValue?: number;
  likertScale?: {
    stronglyDisagree: string;
    disagree: string;
    neutral: string;
    agree: string;
    stronglyAgree: string;
  };
  requiredMessage?: string;
}

export default function PersonalityQuestion({
  question,
  onAnswerAction,
  hasError = false,
  questionId,
  initialValue,
  likertScale,
  requiredMessage,
}: PersonalityQuestionProps) {
  const idPrefix = useId();
  const selectedValue = typeof initialValue === "number" ? initialValue : null;

  const likertLabels = likertScale ?? {
    stronglyDisagree: "Sangat Tidak\nSetuju",
    disagree: "Tidak Setuju",
    neutral: "Netral",
    agree: "Setuju",
    stronglyAgree: "Sangat Setuju",
  };

  const likertOptions = [
    {
      icon: "Strongly-Disagree",
      label: likertLabels.stronglyDisagree,
      value: 1,
      size: 64,
    },
    { icon: "Disagree", label: likertLabels.disagree, value: 2, size: 56 },
    { icon: "Neutral", label: likertLabels.neutral, value: 3, size: 48 },
    { icon: "Agree", label: likertLabels.agree, value: 4, size: 56 },
    {
      icon: "Strongly-Agree",
      label: likertLabels.stronglyAgree,
      value: 5,
      size: 64,
    },
  ];
  const optionIdPrefix = questionId ? `question-${questionId}` : idPrefix;
  const selectedIndex = Math.max(
    0,
    likertOptions.findIndex((option) => option.value === selectedValue),
  );

  const handleSelection = (value: number) => onAnswerAction(value);
  const handleArrowNavigation = (direction: -1 | 1) => {
    const nextIndex = (selectedIndex + direction + likertOptions.length) % likertOptions.length;
    onAnswerAction(likertOptions[nextIndex].value);
  };

  return (
    <div
      role="radiogroup"
      aria-invalid={hasError}
      aria-labelledby={`${optionIdPrefix}-label`}
      className="space-y-6"
      id={questionId ? `question-${questionId}` : undefined}
    >
      <div className="mb-2">
        <div
          className={`rounded-lg px-6 py-4 ${hasError ? "border border-red-700" : "border border-transparent"}`}
        >
          <div className="text-center mb-6">
            <p id={`${optionIdPrefix}-label`} className="text-md font-normal text-black">
              {question}
            </p>
          </div>

          <div className="flex items-center justify-center max-w-5xl mx-auto">
            {likertOptions.map((item, index) => (
              <div key={item.value} className="flex items-center">
                <motion.button
                  type="button"
                  role="radio"
                  aria-checked={selectedValue === item.value}
                  tabIndex={
                    selectedValue === item.value || (!selectedValue && index === 0) ? 0 : -1
                  }
                  aria-labelledby={`${optionIdPrefix}-option-${item.value}`}
                  className="flex flex-col items-center space-y-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 rounded-sm"
                  onClick={() => handleSelection(item.value)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                      event.preventDefault();
                      handleArrowNavigation(1);
                    }
                    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                      event.preventDefault();
                      handleArrowNavigation(-1);
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    scale: selectedValue === item.value ? 1.1 : 1,
                    y: selectedValue === item.value ? -5 : 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                >
                  <Image
                    src={`/mbti-test/${item.icon}${selectedValue === item.value ? "" : "-not-active"}.svg`}
                    width={item.size}
                    height={item.size}
                    alt={item.label}
                    className="object-contain"
                    style={{ width: "auto", height: "auto" }}
                  />
                  <div className="text-xs font-medium text-gray-700 whitespace-pre-line text-center">
                    <span id={`${optionIdPrefix}-option-${item.value}`}>{item.label}</span>
                  </div>
                </motion.button>
                {index < likertOptions.length - 1 && <div className="h-1 w-16 bg-gray-300 mx-4" />}
              </div>
            ))}
          </div>

          <motion.div
            key={hasError ? "error" : "no-error"}
            initial={{ opacity: 0, y: -10 }}
            animate={{
              opacity: hasError ? 1 : 0,
              y: hasError ? 0 : -10,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-start px-30 mt-4 text-red-700">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                }}
              >
                <MessageSquareWarning className="w-4 h-4 mr-2" />
              </motion.div>
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                }}
                className="text-sm font-normal"
              >
                {requiredMessage ?? "Pertanyaan ini wajib diisi"}
              </motion.span>
            </div>
          </motion.div>
        </div>
      </div>

      {!hasError && <div className="border-b border-gray-300 w-full"></div>}
    </div>
  );
}
