import { jsPDF } from 'jspdf';
import type { AssignmentExportData } from '@/types/export';

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function addHeader(doc: jsPDF, data: AssignmentExportData): number {
  let y = 20;
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Team Formation Report', 105, y, { align: 'center' });
  y += 12;

  doc.setFontSize(16);
  doc.text(data.assignmentTitle, 105, y, { align: 'center' });
  y += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Course: ${data.courseName} - ${data.courseClass}`, 105, y, {
    align: 'center',
  });
  y += 6;
  doc.text(`Instructor: ${data.dosenName}`, 105, y, { align: 'center' });
  y += 6;
  doc.text(`Formation Date: ${formatDate(data.formationDate)}`, 105, y, {
    align: 'center',
  });
  y += 10;

  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, 190, y);
  y += 10;

  return y;
}

function addSummary(doc: jsPDF, data: AssignmentExportData, y: number): number {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary Statistics', 20, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Students: ${data.metadata.totalStudents}`, 20, y);
  y += 6;
  doc.text(`Total Teams: ${data.metadata.totalTeams}`, 20, y);
  y += 6;
  doc.text(
    `Average Team Size: ${data.metadata.averageTeamSize.toFixed(1)}`,
    20,
    y
  );
  y += 6;

  if (data.metadata.averageQuality !== null) {
    doc.text(
      `Average Quality: ${(data.metadata.averageQuality * 100).toFixed(1)}%`,
      20,
      y
    );
    y += 6;
  }

  y += 5;
  return y;
}

function addTeam(
  doc: jsPDF,
  data: AssignmentExportData,
  teamIndex: number,
  y: number
): number | null {
  const team = data.teams[teamIndex];
  const pageHeight = doc.internal.pageSize.height;

  if (y > pageHeight - 50) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const teamHeader = `${team.teamNumber}. ${team.teamName}`;
  doc.text(teamHeader, 20, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  if (team.topicName) {
    doc.text(`Topic: ${team.topicName}`, 20, y);
    y += 5;
  }

  if (team.quality !== null) {
    doc.text(`Quality: ${(team.quality * 100).toFixed(1)}%`, 20, y);
    y += 5;
  }

  y += 3;

  const tableStartY = y;
  const rowHeight = 6;
  const _colWidths = [10, 40, 25, 15, 15, 12, 12, 12, 12, 40];
  const colX = [20, 30, 70, 95, 110, 125, 137, 149, 161, 173];

  doc.setFillColor(79, 70, 229);
  doc.rect(20, y, 190, rowHeight, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);

  const headers = [
    'No',
    'Name',
    'NIM',
    'MBTI',
    'Gender',
    'EI',
    'SN',
    'TF',
    'PJ',
    'Skills',
  ];
  headers.forEach((header, i) => {
    doc.text(header, colX[i] + 1, y + 4);
  });

  y += rowHeight;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  team.members.forEach((member, idx) => {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;

      // Repeat table header on new page
      doc.setFillColor(79, 70, 229);
      doc.rect(20, y, 190, rowHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      headers.forEach((header, i) => {
        doc.text(header, colX[i] + 1, y + 4);
      });
      y += rowHeight;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
    }

    if (idx % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(20, y, 190, rowHeight, 'F');
    }

    const skillsList = member.skills
      .slice(0, 3)
      .map(s => s.skillName)
      .join(', ');
    const skillsDisplay =
      member.skills.length > 3 ? `${skillsList}...` : skillsList;

    const rowData = [
      String(idx + 1),
      member.name.length > 25
        ? `${member.name.substring(0, 22)}...`
        : member.name,
      member.nim || '-',
      member.mbtiType || '-',
      member.gender === 'MALE' ? 'M' : member.gender === 'FEMALE' ? 'F' : '-',
      member.personalityScores.ei?.toFixed(2) || '-',
      member.personalityScores.sn?.toFixed(2) || '-',
      member.personalityScores.tf?.toFixed(2) || '-',
      member.personalityScores.pj?.toFixed(2) || '-',
      skillsDisplay || '-',
    ];

    rowData.forEach((value, i) => {
      doc.text(value, colX[i] + 1, y + 4);
    });

    y += rowHeight;
  });

  doc.setDrawColor(200, 200, 200);
  doc.rect(20, tableStartY, 190, y - tableStartY);

  y += 8;
  return y;
}

function addPageNumbers(doc: jsPDF): void {
  const totalPages = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.height;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${totalPages}`, 105, pageHeight - 10, {
      align: 'center',
    });
    doc.text('Generated by EduTeams', 20, pageHeight - 10);
  }
}

export async function generateTeamFormationPDF(
  data: AssignmentExportData
): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let y = addHeader(doc, data);
  y = addSummary(doc, data, y);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Team Details', 20, y);
  y += 10;

  for (let i = 0; i < data.teams.length; i++) {
    const newY = addTeam(doc, data, i, y);
    if (newY === null) {
      y = 20; // New page was started
    } else {
      y = newY;
    }
  }

  addPageNumbers(doc);

  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}
