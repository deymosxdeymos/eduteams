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
    switchLabel: nextLocale === "id" ? t("switchToIndonesia") : t("switchToEnglish"),
    flagSrc: nextLocale === "id" ? "/indo.svg" : "/english.svg",
  } as const;
}
