type DashboardLocale = "id" | "en";

type LanguageSwitcherTranslationKey = "switchToIndonesia" | "switchToEnglish";

type LanguageSwitcherTranslator = (key: LanguageSwitcherTranslationKey) => string;

export function getLanguageSwitcherTarget(
  currentLocale: DashboardLocale,
  t: LanguageSwitcherTranslator,
) {
  const nextLocale = currentLocale === "id" ? "en" : "id";

  return {
    nextLocale,
    currentLabel: currentLocale.toUpperCase(),
    switchLabel: nextLocale === "id" ? t("switchToIndonesia") : t("switchToEnglish"),
    currentFlagSrc: currentLocale === "id" ? "/indo.svg" : "/english.svg",
  } as const;
}
