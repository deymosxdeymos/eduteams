/**
 * Utility functions for handling academic period detection
 */

export interface AcademicYear {
  tahunAwalPeriode: number;
  tahunAkhirPeriode: number;
  label: string;
}

export interface AcademicPeriod {
  tahunAwalPeriode: number;
  tahunAkhirPeriode: number;
  periode: 'ganjil' | 'genap';
  label: string;
}

export function getCurrentAcademicYear(date: Date = new Date()): AcademicYear {
  const month = date.getMonth() + 1; // 1-12
  const year = date.getFullYear();

  let tahunAwalPeriode: number;
  let tahunAkhirPeriode: number;

  if (month >= 8) {
    // August - December: Current/next academic year
    // e.g., August 2025 = 2025/2026
    tahunAwalPeriode = year;
    tahunAkhirPeriode = year + 1;
  } else {
    // January - July: Previous/current academic year
    // e.g., March 2026 = 2025/2026
    tahunAwalPeriode = year - 1;
    tahunAkhirPeriode = year;
  }

  const label = `${tahunAwalPeriode}/${tahunAkhirPeriode}`;

  return {
    tahunAwalPeriode,
    tahunAkhirPeriode,
    label,
  };
}

export function getCurrentAcademicPeriod(
  date: Date = new Date()
): AcademicPeriod {
  const academicYear = getCurrentAcademicYear(date);
  const month = date.getMonth() + 1; // 1-12

  let periode: 'ganjil' | 'genap';

  if (month >= 8 || month === 1) {
    // August - January: Ganjil semester
    periode = 'ganjil';
  } else {
    // February - July: Genap semester
    periode = 'genap';
  }

  const label = `${academicYear.label} ${periode.charAt(0).toUpperCase() + periode.slice(1)}`;

  return {
    tahunAwalPeriode: academicYear.tahunAwalPeriode,
    tahunAkhirPeriode: academicYear.tahunAkhirPeriode,
    periode,
    label,
  };
}

export function formatAcademicPeriodLabel(
  tahunAwal: number,
  tahunAkhir: number,
  periode: 'ganjil' | 'genap'
): string {
  return `${tahunAwal}/${tahunAkhir} ${periode.charAt(0).toUpperCase() + periode.slice(1)}`;
}
