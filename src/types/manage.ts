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
