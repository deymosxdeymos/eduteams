export interface ManageCourseRow {
  id: string;
  name: string;
  classCode: string;
  periodLabel: string;
  startYear: number;
  endYear: number;
  semester: 'ganjil' | 'genap';
  assignmentsCount: number;
  studentsCount: number;
  isArchived: boolean;
  isManuallyArchived: boolean;
  updatedAt: string;
}

export interface ManageAssignmentRow {
  id: string;
  title: string;
  description: string | null;
  status: 'BELUM_ISI' | 'MENUNGGU' | 'BERHASIL_PEMBAGIAN_GRUP';
  startAt: string;
  createdAt: string;
  isArchived: boolean;
  submissionsCount: number;
  totalStudents: number;
}
