/** Convert DB gender enum to Indonesian UI label. */
export function genderToLabel(gender: string | null | undefined): string {
  if (gender === "MALE") return "laki-laki";
  if (gender === "FEMALE") return "perempuan";
  return "";
}

/** Convert Indonesian UI label to DB gender enum. */
export function labelToGender(label: string): "MALE" | "FEMALE" {
  return label === "laki-laki" ? "MALE" : "FEMALE";
}
