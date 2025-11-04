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

export type SortKey = 'name' | 'year';

export interface TeamMemberUser {
  id: string;
  name: string | null;
  mbtiType?: string | null;
}

export interface TeamMemberItem {
  id: string;
  user: TeamMemberUser;
}

export interface GroupListItem {
  id: string;
  courseId: string;
  taskTitle: string;
  className: string;
  academicYear: string;
  status: 'my-group' | 'waiting' | 'not-started';
  dueAt?: Date | string;
  teamMembers?: TeamMemberItem[];
  teamName?: string;
  teamQuality?: number;
  topicName?: string;
  startAt?: Date | string;
  description?: string | null;
}
