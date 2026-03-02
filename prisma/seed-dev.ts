#!/usr/bin/env bun

import { randomInt } from 'node:crypto';

import { createId } from '@paralleldrive/cuid2';
import {
  generateBalancedMBTI,
  generateEmail,
  generateIndonesianName,
  generateMBTIResponses,
  generateNIM,
  generatePersonalityScores,
  generateRandomGender,
  generateRandomSkills,
  generateScoresForMBTI,
  getMBTIType,
} from '../__tests__/helpers/dev-data-generators';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const SUPPORTED_PERSONALITY_LOCALES = ['id-ID', 'en-US'] as const;

const argsSchema = z.object({
  count: z.number().int().min(0).default(20),
  courseId: z.string().optional(),
  courseName: z.string().optional(),
  courseClass: z.enum(['RA', 'RB', 'RC', 'RD', 'RE']).default('RA'),
  coursePeriod: z.enum(['ganjil', 'genap', 'pendek']).default('ganjil'),
  dosenEmail: z.string().email().optional(),
  mbtiBalanced: z.boolean().default(false),
  listCourses: z.boolean().default(false),
  listDosen: z.boolean().default(false),
  assignmentsOnly: z.boolean().default(false),
  skipPersonality: z.boolean().default(false),
  personalityLocale: z
    .enum(SUPPORTED_PERSONALITY_LOCALES)
    .default(SUPPORTED_PERSONALITY_LOCALES[0]),
});

type Args = z.infer<typeof argsSchema>;

interface CourseInfo {
  id: string;
  namaMataKuliah: string;
  kelas: string;
  tahunAwalPeriode: number;
  tahunAkhirPeriode: number;
  periode: string;
  dosenId: string;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const parsed: Record<string, string | boolean | number> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg
        .slice(2)
        .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        const value = args[i + 1];
        if (key === 'count') {
          parsed[key] = parseInt(value, 10);
        } else if (
          key === 'courseId' ||
          key === 'courseClass' ||
          key === 'coursePeriod' ||
          key === 'personalityLocale'
        ) {
          parsed[key] = value;
        } else if (key === 'courseName' || key === 'dosenEmail') {
          parsed[key] = value;
        } else if (
          key === 'mbtiBalanced' ||
          key === 'listCourses' ||
          key === 'listDosen' ||
          key === 'assignmentsOnly' ||
          key === 'skipPersonality'
        ) {
          parsed[key] = value === 'true';
        } else {
          parsed[key] = true;
        }
        i++; // Skip the value
      } else {
        parsed[key] = true;
      }
    }
  }

  return argsSchema.parse(parsed);
}

async function listCourses(): Promise<void> {
  const courses = await prisma.course.findMany({
    select: {
      id: true,
      namaMataKuliah: true,
      kelas: true,
      tahunAwalPeriode: true,
      tahunAkhirPeriode: true,
      periode: true,
      dosen: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (courses.length === 0) {
    console.log('📚 No courses found in database.');
    return;
  }

  console.log('\n📚 Available Courses:');
  for (const [i, course] of courses.entries()) {
    console.log(
      `  [${i + 1}] ${course.id} | ${course.namaMataKuliah} | Kelas ${course.kelas} | ${course.dosen.name} (${course.dosen.email})`
    );
  }
}

async function listDosen(): Promise<void> {
  const dosen = await prisma.user.findMany({
    where: { role: 'dosen' },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: 'asc' },
  });

  if (dosen.length === 0) {
    console.log('👨‍🏫 No dosen accounts found in database.');
    return;
  }

  console.log('\n👨‍🏫 Available Dosen:');
  for (const [i, d] of dosen.entries()) {
    console.log(`  [${i + 1}] ${d.name} (${d.email})`);
  }
}

async function selectDosen(): Promise<string> {
  const dosen = await prisma.user.findMany({
    where: { role: 'dosen' },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: 'asc' },
  });

  if (dosen.length === 0) {
    throw new Error(
      'No dosen accounts found. Please create a dosen account first.'
    );
  }

  if (dosen.length === 1) {
    console.log(`✓ Auto-selected: ${dosen[0].name} (${dosen[0].email})`);
    return dosen[0].id;
  }

  console.log('\n👨‍🏫 Available Dosen:');
  for (const [i, d] of dosen.entries()) {
    console.log(`  [${i + 1}] ${d.name} (${d.email})`);
  }

  console.log(`Which dosen should own this course? [1-${dosen.length}]:`);
  const selection = await new Promise<string>(resolve => {
    process.stdin.once('data', data => {
      resolve(data.toString().trim());
    });
  });
  if (!selection) {
    throw new Error('No dosen selected');
  }

  const selectionIndex = parseInt(selection, 10) - 1;
  if (
    Number.isNaN(selectionIndex) ||
    selectionIndex < 0 ||
    selectionIndex >= dosen.length
  ) {
    throw new Error('Invalid dosen selection');
  }

  const selected = dosen[selectionIndex];
  console.log(`✓ Selected: ${selected.name} (${selected.email})`);
  return selected.id;
}

async function createCourse(args: Args): Promise<CourseInfo> {
  const dosenId = args.dosenEmail
    ? await getDosenByEmail(args.dosenEmail)
    : await selectDosen();

  const currentYear = new Date().getFullYear();
  const courseData = {
    id: createId(),
    namaMataKuliah: args.courseName || 'Algoritma Pemrograman',
    kelas: args.courseClass,
    tahunAwalPeriode: currentYear,
    tahunAkhirPeriode: currentYear + 1,
    periode: args.coursePeriod,
    dosenId,
  };

  const course = await prisma.course.create({
    data: courseData,
    select: {
      id: true,
      namaMataKuliah: true,
      kelas: true,
      tahunAwalPeriode: true,
      tahunAkhirPeriode: true,
      periode: true,
      dosenId: true,
    },
  });

  console.log(
    `✓ Created course: ${course.namaMataKuliah} (Kelas ${course.kelas})`
  );
  return course;
}

async function getDosenByEmail(email: string): Promise<string> {
  const dosen = await prisma.user.findUnique({
    where: { email, role: 'dosen' },
    select: { id: true },
  });

  if (!dosen) {
    throw new Error(`Dosen with email ${email} not found`);
  }

  console.log(`✓ Found dosen: ${email}`);
  return dosen.id;
}

async function getCourseById(courseId: string): Promise<CourseInfo> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      namaMataKuliah: true,
      kelas: true,
      tahunAwalPeriode: true,
      tahunAkhirPeriode: true,
      periode: true,
      dosenId: true,
    },
  });

  if (!course) {
    throw new Error(`Course with ID ${courseId} not found`);
  }

  console.log(
    `✓ Found course: ${course.namaMataKuliah} (Kelas ${course.kelas})`
  );
  return course;
}

async function generateCompletePersonalitySession(
  userId: string,
  index: number,
  total: number,
  mbtiBalanced: boolean,
  questionIds: string[]
): Promise<void> {
  // When balanced mode, generate type first then create matching scores
  const mbtiType = mbtiBalanced ? generateBalancedMBTI(index, total) : null;

  // Generate scores: either matching the balanced type or random
  const scores =
    mbtiBalanced && mbtiType
      ? generateScoresForMBTI(mbtiType)
      : generatePersonalityScores();

  // Recalculate final type to ensure consistency
  const finalMbtiType = getMBTIType(scores);

  // Generate responses consistent with the scores
  const responses = generateMBTIResponses(scores, questionIds);

  // Realistic timing: 2-5 minutes
  const startedAt = new Date(Date.now() - randomInt(120_000, 300_000));
  const submittedAt = new Date();
  const durationMs = submittedAt.getTime() - startedAt.getTime();

  await prisma.$transaction(async (tx: typeof prisma) => {
    // Create personality session
    const session = await tx.personalitySession.create({
      data: {
        id: createId(),
        userId,
        bankVersion: 4,
        presentedOrder: Object.keys(responses) as string[],
        startedAt,
        submittedAt,
        durationMs,
        attentionPassed: true,
      },
    });

    // Create personality responses (41 questions)
    const responsePayload = Object.entries(responses).map(
      ([questionId, rawValue], index) => ({
        id: createId(),
        sessionId: session.id,
        questionId: questionId,
        rawValue: Number(rawValue),
        scoredValue: Number(rawValue) === 4 ? 4 : Number(rawValue), // Attention check not reversed
        position: index + 1,
      })
    );

    await tx.personalityResponse.createMany({
      data: responsePayload,
    });

    // Create personality score
    await tx.personalityScore.create({
      data: {
        sessionId: session.id,
        ei: scores.ei,
        sn: scores.sn,
        tf: scores.tf,
        pj: scores.pj,
      },
    });

    // Upsert personality profile snapshot
    await tx.personalityProfile.upsert({
      where: { userId },
      create: {
        userId,
        ei: scores.ei,
        sn: scores.sn,
        tf: scores.tf,
        pj: scores.pj,
        mbtiType: finalMbtiType,
        createdAt: submittedAt,
        updatedAt: submittedAt,
        personalityData: {
          answers: responses,
          scores: {
            ei: scores.ei,
            sn: scores.sn,
            tf: scores.tf,
            pj: scores.pj,
            mbtiType: finalMbtiType,
          },
          metadata: {
            sessionId: session.id,
            bankVersion: 4,
            submittedAt: submittedAt.toISOString(),
            durationMs,
            attentionPassed: true,
          },
        } satisfies Record<string, unknown>,
      },
      update: {
        ei: scores.ei,
        sn: scores.sn,
        tf: scores.tf,
        pj: scores.pj,
        mbtiType: finalMbtiType,
        personalityData: {
          answers: responses,
          scores: {
            ei: scores.ei,
            sn: scores.sn,
            tf: scores.tf,
            pj: scores.pj,
            mbtiType: finalMbtiType,
          },
          metadata: {
            sessionId: session.id,
            bankVersion: 4,
            submittedAt: submittedAt.toISOString(),
            durationMs,
            attentionPassed: true,
          },
        } satisfies Record<string, unknown>,
        updatedAt: submittedAt,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        isOnboarded: true,
        onboardingStep: null,
      },
    });
  });
}

async function generateStudent(index: number): Promise<string> {
  const gender = generateRandomGender();
  const name = generateIndonesianName(gender);
  const nim = generateNIM(index + 1);
  const email = generateEmail(name, index + 1);

  const user = await prisma.user.create({
    data: {
      id: createId(),
      name,
      email,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: 'mahasiswa',
      gender,
      nim: nim,
      isOnboarded: false, // Will be set to true after personality session
      hasSeenWelcomeSplash: false,
    },
  });

  console.log(`  ✓ Generated: ${name} (${email}) - NIM: ${nim}`);
  return user.id;
}

async function assignSkillsToStudent(userId: string): Promise<void> {
  const skillCount = 4; // 4 skills
  const skills = generateRandomSkills(skillCount);

  // Ensure skills exist before creating person skills
  const skillNames: Record<string, string> = {
    '9f030e3d-abab-4d99-aeae-823d5ef6959e': 'Rust',
    'eb5fdd35-8798-4930-85ec-74973e1bc70c': 'Linux',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890': 'JavaScript',
    'b2c3d4e5-f6a7-8901-bcde-f12345678901': 'Python',
  };

  for (const skill of skills) {
    const skillName = skillNames[skill.skillId] || `Skill ${skill.skillId}`;

    // Check if skill already exists by name
    let existingSkill = await prisma.skill.findUnique({
      where: { name: skillName },
    });

    if (!existingSkill) {
      // Create the skill if it doesn't exist
      existingSkill = await prisma.skill.create({
        data: {
          id: skill.skillId,
          name: skillName,
          description: `Auto-generated skill: ${skillName}`,
        },
      });
    }

    // Now create the person skill using the existing or created skill ID
    await prisma.personSkill.upsert({
      where: {
        personId_skillId: {
          personId: userId,
          skillId: existingSkill.id,
        },
      },
      update: {
        level: skill.level,
      },
      create: {
        id: createId(),
        personId: userId,
        skillId: existingSkill.id,
        level: skill.level,
      },
    });
  }
}

async function enrollStudentInCourse(
  userId: string,
  courseId: string
): Promise<void> {
  await prisma.courseEnrollment.upsert({
    where: {
      courseId_studentId: {
        courseId,
        studentId: userId,
      },
    },
    update: {},
    create: {
      id: createId(),
      courseId,
      studentId: userId,
      enrolledAt: new Date(),
    },
  });
}

async function createSampleAssignments(
  courseId: string,
  dosenId: string
): Promise<string[]> {
  const sampleAssignments = [
    {
      title: 'Tugas Besar 1 - Struktur Data Linear',
      description: JSON.stringify({
        skills: ['Rust', 'Linux', 'JavaScript', 'Python'],
        topics: [
          'Array Implementation',
          'Linked List',
          'Stack Application',
          'Queue System',
        ],
      }),
    },
    {
      title: 'Tugas Besar 2 - Struktur Data Non-Linear',
      description: JSON.stringify({
        skills: ['Rust', 'Linux', 'JavaScript', 'Python'],
        topics: [
          'Binary Tree',
          'Graph Traversal',
          'Shortest Path',
          'Tree Balancing',
        ],
      }),
    },
    {
      title: 'Quiz 1 - Array dan Linked List',
      description: JSON.stringify({
        skills: ['Rust', 'Linux', 'JavaScript', 'Python'],
        topics: [
          'Array Concepts',
          'Linked List Operations',
          'Time Complexity',
          'Memory Management',
        ],
      }),
    },
  ];

  const assignmentIds: string[] = [];

  for (const assignment of sampleAssignments) {
    const assignmentId = createId();

    // Create assignment
    await prisma.assignment.create({
      data: {
        id: assignmentId,
        courseId,
        createdById: dosenId,
        title: assignment.title,
        description: assignment.description,
        startAt: new Date(),
        status: 'BELUM_ISI',
      },
    });

    // Create assignment topics
    let topics: string[] = [];
    try {
      const parsed = JSON.parse(assignment.description);
      topics = parsed.topics || [];
    } catch {
      // Fallback for non-JSON descriptions
      topics = [];
    }

    for (const topicName of topics) {
      await prisma.assignmentTopic.create({
        data: {
          id: createId(),
          assignmentId,
          name: topicName,
        },
      });
    }

    assignmentIds.push(assignmentId);
  }

  console.log(
    `  ✓ Created ${sampleAssignments.length} sample assignments with topics`
  );
  return assignmentIds;
}

async function createStudentSubmissions(
  studentIds: string[],
  assignmentIds: string[]
): Promise<void> {
  for (const assignmentId of assignmentIds) {
    // Get topics for this assignment
    const topics = await prisma.assignmentTopic.findMany({
      where: { assignmentId },
      select: { id: true, name: true },
    });

    for (const studentId of studentIds) {
      // Create assignment submission
      await prisma.assignmentSubmission.upsert({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId,
          },
        },
        update: {},
        create: {
          id: createId(),
          assignmentId,
          studentId,
          structureVersion: 1,
          needsUpdate: false,
        },
      });

      // Create topic preferences (random preferences 0.1 to 1.0)
      for (const topic of topics) {
        const preference = Math.random() * 0.9 + 0.1; // 0.1 to 1.0
        await prisma.assignmentTopicPreference.upsert({
          where: {
            assignmentTopicId_personId: {
              assignmentTopicId: topic.id,
              personId: studentId,
            },
          },
          update: { preference },
          create: {
            id: createId(),
            assignmentTopicId: topic.id,
            personId: studentId,
            preference,
          },
        });
      }
    }
  }

  console.log(
    `  ✓ Created submissions and topic preferences for ${studentIds.length} students`
  );
}

async function seedStudents(args: Args): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot run dev seeding in production!');
  }

  let courseInfo: CourseInfo;

  if (args.courseId) {
    courseInfo = await getCourseById(args.courseId);
  } else if (args.courseName) {
    courseInfo = await createCourse(args);
  } else {
    throw new Error('Either --courseId or --courseName must be provided');
  }

  if (args.assignmentsOnly) {
    console.log('\n📝 Creating sample assignments only...');
    await createSampleAssignments(courseInfo.id, courseInfo.dosenId);
    console.log(
      `\n🎉 Successfully added assignments to course: ${courseInfo.namaMataKuliah} (Kelas ${courseInfo.kelas})`
    );
    console.log('\n📊 Summary:');
    console.log(`  • Course: ${courseInfo.namaMataKuliah}`);
    console.log(`  • Class: ${courseInfo.kelas}`);
    console.log(`  • Assignments: 3 sample assignments created`);
    console.log('\n✅ Assignments are ready for team formation!');
    return;
  }

  console.log(`🌱 Starting dev seeding for ${args.count} students...`);

  console.log(`\n👨‍🎓 Generating ${args.count} students...`);

  const studentIds: string[] = [];
  for (let i = 0; i < args.count; i++) {
    const userId = await generateStudent(i);
    studentIds.push(userId);
  }

  if (!args.skipPersonality) {
    console.log('\n🧠 Generating personality test data...');
    console.log(`   Locale: ${args.personalityLocale}`);

    // Fetch question IDs from database
    const questions = await prisma.personalityQuestion.findMany({
      where: { locale: args.personalityLocale },
      orderBy: { orderHint: 'asc' },
      select: { id: true },
    });

    if (questions.length === 0) {
      console.log(
        '⚠️  No personality questions found in database. Skipping personality data.'
      );
    } else {
      const questionIds = questions.map((q: { id: string }) => q.id);

      for (let i = 0; i < studentIds.length; i++) {
        await generateCompletePersonalitySession(
          studentIds[i],
          i,
          args.count,
          args.mbtiBalanced,
          questionIds
        );
        if ((i + 1) % 5 === 0) {
          console.log(`  ✓ Completed ${i + 1}/${args.count} personality tests`);
        }
      }
    }
  } else {
    console.log(
      '\n⏭️  Skipping personality test data (--skipPersonality enabled)'
    );
  }

  console.log('\n🛠️  Assigning skills...');
  for (let i = 0; i < studentIds.length; i++) {
    await assignSkillsToStudent(studentIds[i]);
    if ((i + 1) % 5 === 0) {
      console.log(`  ✓ Assigned skills to ${i + 1}/${args.count} students`);
    }
  }

  console.log('\n📚 Enrolling students in course...');
  for (let i = 0; i < studentIds.length; i++) {
    await enrollStudentInCourse(studentIds[i], courseInfo.id);
    if ((i + 1) % 5 === 0) {
      console.log(`  ✓ Enrolled ${i + 1}/${args.count} students`);
    }
  }

  console.log('\n📝 Creating sample assignments...');
  const assignmentIds = await createSampleAssignments(
    courseInfo.id,
    courseInfo.dosenId
  );

  console.log('\n📋 Creating student submissions and topic preferences...');
  await createStudentSubmissions(studentIds, assignmentIds);

  console.log(
    `\n🎉 Successfully seeded ${args.count} students into course: ${courseInfo.namaMataKuliah} (Kelas ${courseInfo.kelas})`
  );
  console.log('\n📊 Summary:');
  console.log(`  • Students: ${args.count}`);
  console.log(`  • Course: ${courseInfo.namaMataKuliah}`);
  console.log(`  • Class: ${courseInfo.kelas}`);
  console.log(
    `  • Period: ${courseInfo.periode} ${courseInfo.tahunAwalPeriode}/${courseInfo.tahunAkhirPeriode}`
  );
  console.log(
    `  • Assignments: ${assignmentIds.length} sample assignments created`
  );
  console.log(
    `  • Submissions: ${args.count * assignmentIds.length} student submissions created`
  );
  console.log(`  • Topic Preferences: Generated for all students`);
  console.log(
    '\n✅ Everything is ready for team formation! Dosen can now click "Buat Kelompok"!'
  );
}

async function main(): Promise<void> {
  try {
    const args = parseArgs();

    if (args.listCourses) {
      await listCourses();
      return;
    }

    if (args.listDosen) {
      await listDosen();
      return;
    }

    await seedStudents(args);
  } catch (error) {
    console.error(
      '❌ Error during seeding:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Only run if this file is executed directly
const isDirectExecution = import.meta.main;
if (isDirectExecution) {
  void main();
}
