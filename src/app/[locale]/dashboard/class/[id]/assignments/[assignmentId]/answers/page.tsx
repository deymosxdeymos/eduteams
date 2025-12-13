import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AnswersControlsClient } from '@/components/dashboard/answers-controls-client';
import { AssignmentLayout } from '@/components/dashboard/assignment-layout';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { ProfileHeader } from '@/components/dashboard/profile-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { canAccessDosenFeatures } from '@/lib/authorization';
import { getMBTIQuestions } from '@/lib/mbti-questions-simple';
import prisma from '@/lib/prisma';
import { protectDashboard } from '@/lib/server-auth';
import type { Course, ExtendedUser } from '@/lib/types';
import { getMBTIColorScheme } from '@/lib/utils/mbti-colors';
import { getMBTIType } from '@/lib/utils/mbti-helpers';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string; assignmentId: string }>;
}): Promise<Metadata> {
  const { assignmentId } = await params;
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { title: true },
  });
  const title = assignment
    ? `${assignment.title} - Jawaban | EduTeams`
    : 'Jawaban - EduTeams';
  return { title, description: 'Lihat jawaban mahasiswa untuk tugas ini' };
}

async function getCourseForDosen(courseId: string, dosenId: string) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, dosenId },
    include: { dosen: { select: { id: true, name: true, email: true } } },
  });
  return course as unknown as Course | null;
}

async function getSubmittedStudents(assignmentId: string) {
  const submissions = await prisma.assignmentSubmission.findMany({
    where: { assignmentId },
    select: {
      studentId: true,
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          nim: true,
          role: true,
          image: true,
          gender: true,
          mbtiType: true,
          ei: true,
          sn: true,
          tf: true,
          pj: true,
          personalityData: true,
        },
      },
    },
    orderBy: { student: { name: 'asc' } },
  });
  return submissions.map((s: (typeof submissions)[number]) => s.student);
}

async function getAssignmentAnswersView(
  assignmentId: string,
  studentId: string
) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      title: true,
      description: true,
      AssignmentTopic: {
        select: {
          id: true,
          name: true,
          preferences: {
            where: { personId: studentId },
            select: { preference: true },
          },
        },
      },
    },
  });
  if (!assignment)
    return null as null | {
      title: string;
      skills: Array<{ name: string; level: number | null }>;
      topics: Array<{ name: string; preference: number | null }>;
    };

  let skills: string[] = [];
  try {
    if (assignment.description) {
      const parsed = JSON.parse(assignment.description);
      if (Array.isArray(parsed?.skills)) skills = parsed.skills as string[];
    }
  } catch {}
  if (skills.length === 0) {
    skills = ['UI/UX Design', 'Frontend Development', 'Backend Development'];
  }

  let skillAnswers: Array<{ name: string; level: number | null }> = [];
  if (skills.length > 0) {
    const skillRows = await prisma.skill.findMany({
      where: { name: { in: skills } },
      select: {
        name: true,
        personSkills: {
          where: { personId: studentId },
          select: { level: true },
        },
      },
    });
    const byName = new Map<string, number | null>(
      skillRows.map((r: (typeof skillRows)[number]) => [
        r.name,
        (r.personSkills[0]?.level ?? null) as number | null,
      ])
    );
    skillAnswers = skills.map((name: string) => ({
      name,
      level: byName.get(name) ?? null,
    }));
  }

  const topicAnswers = assignment.AssignmentTopic.map(
    (t: (typeof assignment.AssignmentTopic)[number]) => ({
      name: t.name,
      preference: t.preferences[0]?.preference ?? null,
    })
  );

  return {
    title: assignment.title,
    skills: skillAnswers,
    topics: topicAnswers,
  };
}

function toSkillLabel(v: number | null | undefined) {
  const n = Math.max(0, Math.min(1, v ?? 0));
  if (n < 0.2) return 'Pemula';
  if (n < 0.4) return 'Pemula Lanjut';
  if (n < 0.6) return 'Kompeten';
  if (n < 0.8) return 'Mahir';
  return 'Jago Banget';
}
function toPreferenceLabel(v: number | null | undefined) {
  const n = Math.max(0, Math.min(1, v ?? 0));
  if (n < 0.2) return 'Sangat tidak tertarik';
  if (n < 0.4) return 'Tidak tertarik';
  if (n < 0.6) return 'Netral';
  if (n < 0.8) return 'Tertarik';
  return 'Sangat tertarik';
}
function toLikert(n?: number | null) {
  switch (n) {
    case 1:
      return 'Sangat tidak setuju';
    case 2:
      return 'Tidak setuju';
    case 3:
      return 'Netral';
    case 4:
      return 'Setuju';
    case 5:
      return 'Sangat setuju';
    default:
      return '—';
  }
}

function getLikertValue(
  personalityAnswers: Record<string, unknown>,
  q: { id: string; orderHint?: number },
  i: number
): number | undefined {
  const byId = (personalityAnswers as Record<string, unknown>)[q.id];
  const byOrder = (personalityAnswers as Record<string, unknown>)[
    String(q.orderHint ?? i + 1)
  ];
  const raw = byId ?? byOrder;
  return typeof raw === 'string'
    ? Number.parseInt(raw, 10)
    : (raw as number | undefined);
}

interface AnswersPageProps {
  params: Promise<{ locale: string; id: string; assignmentId: string }>;
  searchParams: Promise<{ studentId?: string }>;
}

export default async function AssignmentAnswersPage({
  params,
  searchParams,
}: AnswersPageProps) {
  const user = await protectDashboard();
  const { locale, id: classId, assignmentId } = await params;
  const isDosen = canAccessDosenFeatures(user);
  if (!isDosen) notFound();

  const course = await getCourseForDosen(classId, user.id);
  if (!course) notFound();

  const students = await getSubmittedStudents(assignmentId);
  const studentsLite = students.map((s: (typeof students)[number]) => ({
    id: s.id,
    name: s.name ?? 'Mahasiswa',
  }));
  const sp = await searchParams;
  let currentIndex = 0;
  if (sp.studentId) {
    const idx = students.findIndex(
      (s: (typeof students)[number]) => s.id === sp.studentId
    );
    currentIndex = idx >= 0 ? idx : 0;
  }
  const selected = students[currentIndex];

  // Fetch assignment title for crumbs
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { title: true },
  });
  const assignmentTitle = assignment?.title ?? 'Tugas';

  // If there are no submissions yet, show an empty state
  if (!selected) {
    return (
      <DashboardClient
        user={user}
        shouldShowSplash={false}
        isFirstVisit={false}
      >
        <AssignmentLayout
          user={user}
          course={course}
          classId={classId}
          assignmentId={assignmentId}
          students={[]}
          canManage={true}
          hideStudentList
          assignmentTitle={assignmentTitle}
          answersCrumb
        >
          <div className='flex flex-col p-6 gap-6'>
            <AnswersControlsClient
              backHref={`/dashboard/class/${classId}/assignments/${assignmentId}`}
              students={studentsLite}
              currentIndex={0}
              baseHref={`/dashboard/class/${classId}/assignments/${assignmentId}/answers`}
            />
            <div className='flex-1 flex items-center justify-center p-6'>
              <div className='text-center text-neutral-600'>
                Belum ada jawaban mahasiswa untuk tugas ini.
              </div>
            </div>
          </div>
        </AssignmentLayout>
      </DashboardClient>
    );
  }

  // Build ExtendedUser-like object for ProfileHeader
  const selectedUser = selected as unknown as ExtendedUser;

  const answersView = await getAssignmentAnswersView(assignmentId, selected.id);
  const mbtiQuestions = await getMBTIQuestions(locale);
  const personalityJson = selected.personalityData as unknown as {
    answers?: Record<string, number>;
  } | null;
  const personalityAnswers = (personalityJson?.answers ?? {}) as Record<
    string,
    number
  >;

  const mbtiType = getMBTIType(selectedUser);
  const colorScheme = getMBTIColorScheme(mbtiType);
  const underlineClass = colorScheme.primaryBg;
  const textColor600 = colorScheme.gradientFrom.replace('from-', 'text-');
  const textActiveClass = `data-[state=active]:${textColor600}`;

  return (
    <DashboardClient user={user} shouldShowSplash={false} isFirstVisit={false}>
      <AssignmentLayout
        user={user}
        course={course}
        classId={classId}
        assignmentId={assignmentId}
        students={[]}
        canManage={true}
        hideStudentList
        assignmentTitle={assignmentTitle}
        answersCrumb
      >
        <div className='flex flex-col p-6 gap-6'>
          <AnswersControlsClient
            backHref={`/dashboard/class/${classId}/assignments/${assignmentId}`}
            students={studentsLite}
            currentIndex={currentIndex}
            baseHref={`/dashboard/class/${classId}/assignments/${assignmentId}/answers`}
          />
          <ProfileHeader user={selectedUser} hideEditButton />

          <div className='px-2'>
            <Tabs defaultValue='kepribadian' className='w-full'>
              <TabsList className='w-full bg-transparent rounded-none p-0 shadow-none text-neutral-700 justify-between'>
                <TabsTrigger
                  value='kepribadian'
                  className={`group flex-1 bg-transparent hover:bg-transparent border-none data-[state=active]:bg-transparent data-[state=active]:shadow-none text-neutral-700 hover:text-neutral-900 transition-colors flex flex-col items-center gap-1 ${textActiveClass}`}
                >
                  <span className='group-hover:underline'>Kepribadian</span>
                  <span
                    className={`hidden group-data-[state=active]:block ${underlineClass} h-3 w-full rounded-full`}
                  />
                </TabsTrigger>
                <TabsTrigger
                  value='skills'
                  className={`group flex-1 bg-transparent hover:bg-transparent border-none data-[state=active]:bg-transparent data-[state=active]:shadow-none text-neutral-700 hover:text-neutral-900 flex flex-col items-center gap-1 ${textActiveClass}`}
                >
                  <span className='group-hover:underline'>Skills</span>
                  <span
                    className={`hidden group-data-[state=active]:block ${underlineClass} h-3 w-full rounded-full`}
                  />
                </TabsTrigger>
                <TabsTrigger
                  value='preferences'
                  className={`group flex-1 bg-transparent hover:bg-transparent border-none data-[state=active]:bg-transparent data-[state=active]:shadow-none text-neutral-700 hover:text-neutral-900 flex flex-col items-center gap-1 ${textActiveClass}`}
                >
                  <span className='group-hover:underline'>Preferences</span>
                  <span
                    className={`hidden group-data-[state=active]:block ${underlineClass} h-3 w-full rounded-full`}
                  />
                </TabsTrigger>
              </TabsList>

              <TabsContent value='kepribadian' className='mt-4'>
                <div className='rounded-lg border overflow-hidden'>
                  <div className='max-h-[420px] overflow-y-auto'>
                    <table className='min-w-full text-left text-sm'>
                      <thead className='bg-gray-50 text-gray-600 sticky top-0 z-10'>
                        <tr>
                          <th className='px-4 py-3 w-16'>No</th>
                          <th className='px-4 py-3'>Pertanyaan</th>
                          <th className='px-4 py-3'>Jawaban</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y'>
                        {mbtiQuestions.map((q, i) => (
                          <tr key={q.id || i} className='hover:bg-gray-50'>
                            <td className='px-4 py-3'>{i + 1}</td>
                            <td className='px-4 py-3'>{q.text}</td>
                            <td className='px-4 py-3'>
                              {toLikert(
                                getLikertValue(
                                  personalityAnswers as Record<string, unknown>,
                                  q as { id: string; orderHint?: number },
                                  i
                                )
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value='skills' className='mt-4'>
                <div className='rounded-lg border overflow-hidden'>
                  <div className='max-h-[420px] overflow-y-auto'>
                    <table className='min-w-full text-left text-sm'>
                      <thead className='bg-gray-50 text-gray-600 sticky top-0 z-10'>
                        <tr>
                          <th className='px-4 py-3 w-16'>No</th>
                          <th className='px-4 py-3'>Pertanyaan</th>
                          <th className='px-4 py-3'>Jawaban</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y'>
                        {(answersView?.skills ?? []).map(
                          (
                            s: { name: string; level: number | null },
                            i: number
                          ) => (
                            <tr key={s.name} className='hover:bg-gray-50'>
                              <td className='px-4 py-3'>{i + 1}</td>
                              <td className='px-4 py-3'>
                                Seberapa mahir kamu dengan keahlian{' '}
                                <strong>{s.name}</strong>?
                              </td>
                              <td className='px-4 py-3'>
                                {toSkillLabel(s.level)}
                              </td>
                            </tr>
                          )
                        )}
                        {(!answersView?.skills ||
                          answersView.skills.length === 0) && (
                          <tr>
                            <td className='px-4 py-3' colSpan={3}>
                              Tidak ada data keahlian.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value='preferences' className='mt-4'>
                <div className='rounded-lg border overflow-hidden'>
                  <div className='max-h-[420px] overflow-y-auto'>
                    <table className='min-w-full text-left text-sm'>
                      <thead className='bg-gray-50 text-gray-600 sticky top-0 z-10'>
                        <tr>
                          <th className='px-4 py-3 w-16'>No</th>
                          <th className='px-4 py-3'>Pertanyaan</th>
                          <th className='px-4 py-3'>Jawaban</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y'>
                        {(answersView?.topics ?? []).map(
                          (
                            t: { name: string; preference: number | null },
                            i: number
                          ) => (
                            <tr key={t.name} className='hover:bg-gray-50'>
                              <td className='px-4 py-3'>{i + 1}</td>
                              <td className='px-4 py-3'>
                                Seberapa Tertarik Anda dengan topik{' '}
                                <strong>
                                  #{i + 1}: {t.name}
                                </strong>
                                ?
                              </td>
                              <td className='px-4 py-3'>
                                {toPreferenceLabel(t.preference)}
                              </td>
                            </tr>
                          )
                        )}
                        {(!answersView?.topics ||
                          answersView.topics.length === 0) && (
                          <tr>
                            <td className='px-4 py-3' colSpan={3}>
                              Tidak ada data preferensi topik.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </AssignmentLayout>
    </DashboardClient>
  );
}
