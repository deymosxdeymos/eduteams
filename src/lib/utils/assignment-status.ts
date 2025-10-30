type AssignmentStatus = 'BELUM_ISI' | 'MENUNGGU' | 'BERHASIL_PEMBAGIAN_GRUP';

export interface StatusBadge {
  text: string;
  className: string;
}

export function getAssignmentStatusBadge(
  status: AssignmentStatus,
  submittedCount: number,
  totalStudents: number
): StatusBadge {
  const safeTotalStudents = Math.max(0, totalStudents);
  const safeSubmittedCount = Math.max(0, submittedCount);
  const clampedSubmittedCount =
    safeTotalStudents > 0
      ? Math.min(safeSubmittedCount, safeTotalStudents)
      : safeSubmittedCount;
  const allStudentsSubmitted =
    safeTotalStudents > 0 && clampedSubmittedCount === safeTotalStudents;

  if (status === 'BERHASIL_PEMBAGIAN_GRUP') {
    return {
      text: 'Pembagian grup berhasil',
      className: 'bg-emerald-50 text-emerald-900',
    };
  }

  if (status === 'MENUNGGU' || allStudentsSubmitted) {
    return {
      text: 'Menunggu pembagian grup',
      className: 'bg-sky-50 text-sky-900',
    };
  }

  if (safeSubmittedCount === 0) {
    return {
      text: 'Belum ada yang mengisi',
      className: 'bg-red-50 text-red-900',
    };
  }

  const totalForMessage =
    safeTotalStudents > 0 ? safeTotalStudents : clampedSubmittedCount;

  return {
    text: `${clampedSubmittedCount}/${totalForMessage} Mahasiswa`,
    className: 'bg-amber-50 text-orange-900',
  };
}
