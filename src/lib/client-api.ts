/**
 * Client-side API helpers to avoid duplicating fetch + error-handling logic.
 */

import type { ApiResponse, ClassCatalog } from "@/lib/types";

/** Generic SWR-compatible fetcher: fetch + throw on error + parse JSON. */
export const fetcher = async <T = unknown>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json() as Promise<T>;
};

/** Fetcher for the class catalog endpoint (unwraps ApiResponse). */
export const classCatalogFetcher = async (url: string): Promise<ClassCatalog[]> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch class catalog");
  const payload = (await response.json()) as ApiResponse<ClassCatalog[]>;
  return payload.data ?? [];
};

/** DELETE a student from a course enrolment. */
export async function removeCourseStudent(
  courseId: string,
  studentId: string,
  fallbackMessage: string,
): Promise<void> {
  const res = await fetch(`/api/courses/${courseId}/students/${studentId}`, {
    method: "DELETE",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error || fallbackMessage);
  }
}
