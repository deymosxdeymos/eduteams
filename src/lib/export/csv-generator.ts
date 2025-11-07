import type { AssignmentExportData } from '@/types/export';

/**
 * Escapes a value for safe use in CSV format.
 * Handles quotes, commas, and newlines according to RFC 4180.
 *
 * @param value - The value to escape
 * @returns Escaped string safe for CSV
 */
function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const strValue = String(value);

  // If the value contains quotes, commas, or newlines, wrap it in quotes
  // and escape any quotes within by doubling them
  if (
    strValue.includes('"') ||
    strValue.includes(',') ||
    strValue.includes('\n') ||
    strValue.includes('\r')
  ) {
    return `"${strValue.replace(/"/g, '""')}"`;
  }

  return strValue;
}

/**
 * Formats a date to a readable string for CSV export.
 *
 * @param date - The date to format
 * @returns Formatted date string (YYYY-MM-DD HH:mm:ss)
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Generates a CSV file from team formation data.
 * The CSV includes a metadata header section followed by a flat data structure
 * with one row per team member.
 *
 * @param data - The assignment export data
 * @returns CSV string with UTF-8 BOM for Excel compatibility
 */
export function generateTeamFormationCSV(data: AssignmentExportData): string {
  const rows: string[] = [];

  // Add UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';

  // Metadata header section
  rows.push(escapeCsvValue('Team Formation Report'));
  rows.push('');
  rows.push(
    `${escapeCsvValue('Assignment:')},${escapeCsvValue(data.assignmentTitle)}`
  );
  rows.push(
    `${escapeCsvValue('Course:')},${escapeCsvValue(`${data.courseName} - ${data.courseClass}`)}`
  );
  rows.push(
    `${escapeCsvValue('Instructor:')},${escapeCsvValue(data.dosenName)}`
  );
  rows.push(
    `${escapeCsvValue('Formation Date:')},${escapeCsvValue(formatDate(data.formationDate))}`
  );
  rows.push('');

  // Summary statistics
  rows.push(
    `${escapeCsvValue('Total Students:')},${escapeCsvValue(data.metadata.totalStudents)}`
  );
  rows.push(
    `${escapeCsvValue('Total Teams:')},${escapeCsvValue(data.metadata.totalTeams)}`
  );
  rows.push(
    `${escapeCsvValue('Average Team Size:')},${escapeCsvValue(data.metadata.averageTeamSize.toFixed(1))}`
  );
  if (data.metadata.averageQuality !== null) {
    rows.push(
      `${escapeCsvValue('Average Quality:')},${escapeCsvValue(`${(data.metadata.averageQuality * 100).toFixed(1)}%`)}`
    );
  }
  rows.push('');
  rows.push('');

  // Data table header
  const headers = [
    'Team Number',
    'Team Name',
    'Topic',
    'Quality (%)',
    'Member Number',
    'Student Name',
    'NIM',
    'Email',
    'MBTI Type',
    'Gender',
    'EI Score',
    'SN Score',
    'TF Score',
    'PJ Score',
    'Skills',
    'Skill Levels',
    'Assigned Skill IDs',
  ];
  rows.push(headers.map(escapeCsvValue).join(','));

  // Data rows (one row per team member)
  for (const team of data.teams) {
    team.members.forEach((member, memberIndex) => {
      const qualityPercent =
        team.quality !== null ? (team.quality * 100).toFixed(1) : '';

      // Format skills as comma-separated list
      const skillNames = member.skills.map(s => s.skillName).join('; ');
      const skillLevels = member.skills.map(s => s.level.toFixed(2)).join('; ');
      const assignedSkills = member.assignedSkillIds.join('; ');

      const row = [
        team.teamNumber,
        team.teamName,
        team.topicName || '',
        qualityPercent,
        memberIndex + 1,
        member.name,
        member.nim || '',
        member.email,
        member.mbtiType || '',
        member.gender || '',
        member.personalityScores.ei?.toFixed(2) || '',
        member.personalityScores.sn?.toFixed(2) || '',
        member.personalityScores.tf?.toFixed(2) || '',
        member.personalityScores.pj?.toFixed(2) || '',
        skillNames,
        skillLevels,
        assignedSkills,
      ];

      rows.push(row.map(escapeCsvValue).join(','));
    });
  }

  // Join all rows with newlines and prepend BOM
  return BOM + rows.join('\n');
}
