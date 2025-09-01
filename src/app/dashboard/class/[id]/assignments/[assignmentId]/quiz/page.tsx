import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AssignmentQuizClient } from '@/components/dashboard/assignment-quiz-client';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { canAccessMahasiswaFeatures } from '@/lib/authorization';
import prisma from '@/lib/prisma';
import { protectDashboard } from '@/lib/server-auth';
import type { ExtendedUser } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getAssignmentData(assignmentId: string, user: ExtendedUser) {
  const isMahasiswa = canAccessMahasiswaFeatures(user);

  if (!isMahasiswa) return null;

  // Check if user has already submitted
  const existingSubmission = await prisma.assignmentSubmission.findUnique({
    where: {
      assignmentId_studentId: { assignmentId, studentId: user.id },
    },
  });

  if (existingSubmission) {
    return { hasSubmitted: true };
  }

  // Get assignment with skills and topics
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      title: true,
      description: true,
    },
  });

  if (!assignment) return null;

  // For now, parse skills and topics from description or use defaults
  let skills: string[] = [];
  let topics: string[] = [];

  try {
    if (assignment.description) {
      const parsed = JSON.parse(assignment.description);
      if (parsed.skills) skills = parsed.skills;
      if (parsed.topics) topics = parsed.topics;
    }
  } catch {
    // If parsing fails, use empty arrays
  }

  // Temporary fallback for testing - use sample data if no skills/topics
  if (skills.length === 0) {
    skills = ['UI/UX Design', 'Frontend Development', 'Backend Development'];
  }
  if (topics.length === 0) {
    topics = ['Kesehatan', 'Politik', 'Makanan'];
  }

  return {
    hasSubmitted: false,
    assignment: {
      id: assignment.id,
      title: assignment.title,
      skills,
      topics,
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
}): Promise<Metadata> {
  const { assignmentId } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { title: true },
  });

  const title = assignment
    ? `${assignment.title} - Quiz | EduTeams`
    : 'Quiz - EduTeams';

  return { title, description: 'Jawab quiz untuk melanjutkan ke tugas' };
}

interface AssignmentQuizPageProps {
  params: Promise<{ id: string; assignmentId: string }>;
}

export default async function AssignmentQuizPage({
  params,
}: AssignmentQuizPageProps) {
  const user = await protectDashboard();
  const { id: classId, assignmentId } = await params;

  const isMahasiswa = canAccessMahasiswaFeatures(user);
  if (!isMahasiswa) notFound();

  const data = await getAssignmentData(assignmentId, user);
  if (!data) notFound();

  if (data.hasSubmitted) {
    // Redirect to task page if already submitted
    return (
      <DashboardClient
        user={user}
        shouldShowSplash={false}
        isFirstVisit={false}
      >
        <div className='flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold mb-4'>Anda sudah mengisi quiz</h1>
            <p className='text-gray-600 mb-4'>
              Mengalihkan ke halaman tugas...
            </p>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  setTimeout(() => {
                    window.location.href = '/dashboard/class/${classId}/assignments/${assignmentId}';
                  }, 2000);
                `,
              }}
            />
          </div>
        </div>
      </DashboardClient>
    );
  }

  if (!data.assignment) {
    notFound();
  }

  return (
    <DashboardClient user={user} shouldShowSplash={false} isFirstVisit={false}>
      <AssignmentQuizClient
        classId={classId}
        assignmentId={assignmentId}
        assignment={data.assignment}
      />
    </DashboardClient>
  );
}
