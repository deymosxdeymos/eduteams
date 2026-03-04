/**
 * Client-side API helpers to avoid duplicating fetch + error-handling logic.
 */

/** DELETE a student from a course enrolment. */
export async function removeCourseStudent(
  courseId: string,
  studentId: string,
  fallbackMessage: string
): Promise<void> {
  const res = await fetch(`/api/courses/${courseId}/students/${studentId}`, {
    method: 'DELETE',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error || fallbackMessage);
  }
}
