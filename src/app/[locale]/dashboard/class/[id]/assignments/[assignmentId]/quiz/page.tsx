import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AssignmentLayout } from '@/components/dashboard/assignment-layout';
import { AssignmentQuizClient } from '@/components/dashboard/assignment-quiz-client';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { ProfileHeader } from '@/components/dashboard/profile-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { canAccessMahasiswaFeatures } from '@/lib/authorization';
import {
  getStudentCompetencyPrefills,
  normalizeTopicKey,
} from '@/lib/data/student-competency-profiles';
import { getMBTIQuestions } from '@/lib/mbti-questions-simple';
import prisma from '@/lib/prisma';
import { protectDashboard } from '@/lib/server-auth';
import type { Course, ExtendedUser } from '@/lib/types';
import { getMBTICategory } from '@/lib/utils/mbti-colors';

type SubmittedView = {
  title: string;
  skills: Array<{ name: string; level: number | null }>;
  topics: Array<{ name: string; preference: number | null }>;
};
type SubmittedData = { hasSubmitted: true; view: SubmittedView };
type UnsubmittedData = {
  hasSubmitted: false;
  assignment: {
    id: string;
    title: string;
    skills: string[];
    topics: string[];
    hasTopics: boolean;
    skillPrefills: Array<{
      name: string;
      level: number | null;
      profileId?: string | null;
      profileUpdatedAt?: string | null;
      sourceAssignmentId?: string | null;
    }>;
    topicPrefills: Array<{
      name: string;
      preference: number | null;
      profileId?: string | null;
      profileUpdatedAt?: string | null;
      sourceAssignmentId?: string | null;
    }>;
  };
};
type AssignmentData = SubmittedData | UnsubmittedData;

export const dynamic = 'force-dynamic';

async function getAssignmentData(
  assignmentId: string,
  user: ExtendedUser
): Promise<AssignmentData | null> {
  const isMahasiswa = canAccessMahasiswaFeatures(user);

  if (!isMahasiswa) return null;

  // Check if user has already submitted
  const existingSubmission = await prisma.assignmentSubmission.findUnique({
    where: {
      assignmentId_studentId: { assignmentId, studentId: user.id },
    },
  });

  if (existingSubmission) {
    // For submitted users, fetch assignment topics + their preferences, and skill levels
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
              where: { personId: user.id },
              select: { preference: true },
            },
          },
        },
      },
    });

    if (!assignment) return null;

    // Parse skills names from assignment description (if available)
    let skills: string[] = [];
    try {
      if (assignment.description) {
        const parsed = JSON.parse(assignment.description);
        if (Array.isArray(parsed?.skills)) skills = parsed.skills as string[];
      }
    } catch {
      // ignore parsing errors
    }

    // Fallback to same defaults used in quiz client if description has no skills
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
            where: { personId: user.id },
            select: { level: true },
          },
        },
      });
      const byName = new Map<string, number | null>(
        skillRows.map(
          (r: { name: string; personSkills: Array<{ level: number }> }) =>
            [r.name, r.personSkills[0]?.level ?? null] as const
        )
      );
      skillAnswers = skills.map(name => ({
        name,
        level: byName.get(name) ?? null,
      }));
    }

    const topicAnswers = assignment.AssignmentTopic.map(
      (t: { name: string; preferences: Array<{ preference: number }> }) => ({
        name: t.name,
        preference: t.preferences[0]?.preference ?? null,
      })
    );

    return {
      hasSubmitted: true as const,
      view: {
        title: assignment.title,
        skills: skillAnswers,
        topics: topicAnswers,
      },
    };
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
  let hasTopics = false;

  try {
    if (assignment.description) {
      const parsed = JSON.parse(assignment.description);
      if (Array.isArray(parsed.skills)) skills = parsed.skills;
      if (Array.isArray(parsed.topics)) topics = parsed.topics;
    }
  } catch {
    // If parsing fails, use empty arrays
  }

  // Temporary fallback for testing - seed sample skills if none are provided
  if (skills.length === 0) {
    skills = ['UI/UX Design', 'Frontend Development', 'Backend Development'];
  }
  hasTopics = topics.length > 0;

  const prefills = await getStudentCompetencyPrefills({
    studentId: user.id,
    skillNames: skills,
    topicNames: topics,
  });

  const skillPrefillMap = new Map(
    prefills.skills.map(prefill => [prefill.name.trim().toLowerCase(), prefill])
  );
  const topicPrefillMap = new Map(
    prefills.topics.map(prefill => [normalizeTopicKey(prefill.name), prefill])
  );

  const skillPrefills = skills.map(name => {
    const match = skillPrefillMap.get(name.trim().toLowerCase());
    return {
      name,
      level: match?.level ?? null,
      profileId: match?.profileId ?? null,
      profileUpdatedAt: match?.profileUpdatedAt
        ? match.profileUpdatedAt.toISOString()
        : null,
      sourceAssignmentId: match?.sourceAssignmentId ?? null,
    };
  });
  const topicPrefills = topics.map(name => {
    const match = topicPrefillMap.get(normalizeTopicKey(name));
    return {
      name,
      preference: match?.preference ?? null,
      profileId: match?.profileId ?? null,
      profileUpdatedAt: match?.profileUpdatedAt
        ? match.profileUpdatedAt.toISOString()
        : null,
      sourceAssignmentId: match?.sourceAssignmentId ?? null,
    };
  });

  return {
    hasSubmitted: false as const,
    assignment: {
      id: assignment.id,
      title: assignment.title,
      skills,
      topics,
      hasTopics,
      skillPrefills,
      topicPrefills,
    },
  };
}

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
    ? `${assignment.title} - Quiz | EduTeams`
    : 'Quiz - EduTeams';

  return { title, description: 'Jawab quiz untuk melanjutkan ke tugas' };
}

interface AssignmentQuizPageProps {
  params: Promise<{ locale: string; id: string; assignmentId: string }>;
}

export default async function AssignmentQuizPage({
  params,
}: AssignmentQuizPageProps) {
  const user = await protectDashboard();
  const { locale, id: classId, assignmentId } = await params;

  const isMahasiswa = canAccessMahasiswaFeatures(user);
  if (!isMahasiswa) notFound();

  const data = await getAssignmentData(assignmentId, user);
  if (!data) notFound();

  if (data.hasSubmitted) {
    const answers = data.view;

    // Fetch course for layout (student context) and hide student list
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { courseId_studentId: { courseId: classId, studentId: user.id } },
      include: {
        course: {
          include: {
            dosen: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    if (!enrollment) notFound();
    const course = enrollment.course as unknown as Course;

    const toSkillLabel = (v: number | null | undefined) => {
      const n = Math.max(0, Math.min(1, v ?? 0));
      if (n < 0.2) return 'Pemula';
      if (n < 0.4) return 'Pemula Lanjut';
      if (n < 0.6) return 'Kompeten';
      if (n < 0.8) return 'Mahir';
      return 'Jago Banget';
    };
    const toPreferenceLabel = (v: number | null | undefined) => {
      const n = Math.max(0, Math.min(1, v ?? 0));
      if (n < 0.2) return 'Sangat tidak tertarik';
      if (n < 0.4) return 'Tidak tertarik';
      if (n < 0.6) return 'Netral';
      if (n < 0.8) return 'Tertarik';
      return 'Sangat tertarik';
    };
    const toLikert = (n?: number | null) => {
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
    };
    const getLikertValue = (
      answersById: Record<string, unknown>,
      q: { id: string; order?: number },
      i: number
    ): number | undefined => {
      const byId = (answersById as Record<string, unknown>)[q.id];
      const byOrder = (answersById as Record<string, unknown>)[
        String((q as { orderHint?: number }).orderHint ?? i + 1)
      ];
      const raw = byId ?? byOrder;
      return typeof raw === 'string'
        ? Number.parseInt(raw, 10)
        : (raw as number | undefined);
    };

    // Personality QA: fetch questions + user answers
    const mbtiQuestions = await getMBTIQuestions(locale);
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        personalityProfile: { select: { personalityData: true } },
      },
    });
    const personalityJson = userRecord?.personalityProfile
      ?.personalityData as unknown as {
      answers?: Record<string, number>;
    } | null;
    const personalityAnswers = (personalityJson?.answers ?? {}) as Record<
      string,
      number
    >;

    // Debug logs to inspect answers mapping in dev server
    try {
      const keys = Object.keys(personalityAnswers);
      console.log(
        '[LihatJawaban][kepribadian] userId=%s keys=%d sample=%o',
        user.id,
        keys.length,
        keys.slice(0, 5)
      );
      console.log(
        '[LihatJawaban][kepribadian] q0=%o',
        mbtiQuestions[0]
          ? {
              id: mbtiQuestions[0].id,
              orderHint: mbtiQuestions[0].orderHint,
              text: mbtiQuestions[0].text,
            }
          : null
      );
    } catch {}

    const category = getMBTICategory(user.mbtiType);
    const underlineClass =
      category === 'diplomats'
        ? 'bg-emerald-500'
        : category === 'analysts'
          ? 'bg-violet-500'
          : category === 'explorers'
            ? 'bg-orange-500'
            : 'bg-blue-500';
    const textActiveClass =
      category === 'diplomats'
        ? 'data-[state=active]:text-emerald-600'
        : category === 'analysts'
          ? 'data-[state=active]:text-violet-600'
          : category === 'explorers'
            ? 'data-[state=active]:text-orange-600'
            : 'data-[state=active]:text-blue-600';

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
          canManage={false}
          hideStudentList
          assignmentTitle={answers.title}
          answersCrumb
        >
          <div className='flex flex-col p-6 gap-6'>
            <div className='flex items-center'>
              <a
                href={`/dashboard/class/${classId}/assignments/${assignmentId}`}
                className='inline-flex items-center gap-2 text-sm text-neutral-700 hover:text-black'
              >
                <ArrowLeft className='w-4 h-4' />
                <span className='font-bold'>Kembali</span>
              </a>
            </div>
            <ProfileHeader user={user} hideEditButton />
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
                            <tr key={q.id} className='hover:bg-gray-50'>
                              <td className='px-4 py-3'>{i + 1}</td>
                              <td className='px-4 py-3'>{q.text}</td>
                              <td className='px-4 py-3'>
                                {toLikert(
                                  getLikertValue(
                                    personalityAnswers as Record<
                                      string,
                                      unknown
                                    >,
                                    q as { id: string; order?: number },
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
                          {(answers?.skills ?? []).map((s, i) => (
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
                          ))}
                          {(!answers?.skills ||
                            answers.skills.length === 0) && (
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
                          {(answers?.topics ?? []).map((t, i) => (
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
                          ))}
                          {(!answers?.topics ||
                            answers.topics.length === 0) && (
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
