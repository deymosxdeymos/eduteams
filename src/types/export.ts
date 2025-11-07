import type { Gender, MBTIType } from '@/generated/prisma';

export interface TeamMemberExportData {
  id: string;
  name: string;
  email: string;
  nim: string | null;
  mbtiType: MBTIType | null;
  gender: Gender | null;
  personalityScores: {
    ei: number | null;
    sn: number | null;
    tf: number | null;
    pj: number | null;
  };
  skills: Array<{
    skillId: string;
    skillName: string;
    level: number;
  }>;
  assignedSkillIds: string[];
}

export interface TeamExportData {
  teamNumber: number;
  teamName: string;
  topicName: string | null;
  quality: number | null;
  members: TeamMemberExportData[];
}

export interface AssignmentExportData {
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseName: string;
  courseClass: string;
  dosenName: string;
  formationDate: Date;
  teams: TeamExportData[];
  metadata: {
    totalStudents: number;
    totalTeams: number;
    averageTeamSize: number;
    averageQuality: number | null;
  };
}
