/** Stable empty Set reference — use as a default prop to avoid re-renders. */
export const EMPTY_SET = new Set<string>();

/** Stable empty array references — use as default props to avoid re-renders. */
export const EMPTY_ARRAY: readonly never[] = [];
export const EMPTY_STRING_ARRAY: readonly string[] = [];

/** Shared date/time formatters for assignment displays across dashboard. */
export const timeFormatterUTC = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export const dateFormatterUTC = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Format a Date or ISO string as "HH:mm, DD Month YYYY". */
export const formatIdTimeDate = (input: Date | string): string => {
  const d = new Date(input);
  return `${timeFormatterUTC.format(d)}, ${dateFormatterUTC.format(d)}`;
};
