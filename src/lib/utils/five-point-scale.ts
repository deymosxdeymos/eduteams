const FIVE_POINT_SCALE_STEP_COUNT = 5;

export function getFivePointScaleIndex(value: number | null | undefined) {
  const normalizedValue = typeof value === "number" && Number.isFinite(value) ? value : 0;
  const clampedValue = Math.min(1, Math.max(0, normalizedValue));

  return Math.min(
    FIVE_POINT_SCALE_STEP_COUNT - 1,
    Math.floor(clampedValue * FIVE_POINT_SCALE_STEP_COUNT),
  );
}

export function toFivePointLikertValue(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return getFivePointScaleIndex(value) + 1;
}
