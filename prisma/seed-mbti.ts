import { Gender } from '../src/generated/prisma';
import prisma from '../src/lib/prisma';
import { randomUUID } from 'crypto';

type MBTIQuestionData = {
  text: string;
  dimension: string;
  order: number;
};

type UserData = {
  name: string;
  email: string;
  gender: Gender;
  mbti: {
    ei: number;
    sn: number;
    tf: number;
    pj: number;
  };
};

type TaskData = {
  name: string;
  description: string;
  teamSize: number;
};

type SimilarityData = {
  skill1Idx: number;
  skill2Idx: number;
  similarity: number;
};

const withTimestamps = <T extends object>(data: T) => ({
  ...data,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const mbtiQuestions: MBTIQuestionData[] = [
  {
    text: 'You think judges should be merciful.',
    dimension: 'tf',
    order: 0,
  },
  {
    text: 'You prefer open-ended activities.',
    dimension: 'pj',
    order: 1,
  },
  {
    text: 'You prefer novel over traditional.',
    dimension: 'sn',
    order: 2,
  },
  {
    text: 'You prefer groups to individuals.',
    dimension: 'ei',
    order: 3,
  },
  {
    text: 'You tend to be tolerant.',
    dimension: 'tf',
    order: 4,
  },
  {
    text: 'You work better under pressure.',
    dimension: 'pj',
    order: 5,
  },
  {
    text: 'You are methodical.',
    dimension: 'pj',
    order: 6,
  },
  {
    text: 'You prefer theoretical subjects.',
    dimension: 'sn',
    order: 7,
  },
  {
    text: 'You are sociable.',
    dimension: 'ei',
    order: 8,
  },
  {
    text: 'You prefer being curious.',
    dimension: 'sn',
    order: 9,
  },
  {
    text: 'You are expressive.',
    dimension: 'ei',
    order: 10,
  },
  {
    text: 'You tend to be diplomatic.',
    dimension: 'tf',
    order: 11,
  },
  {
    text: 'You prefer abstract over specific.',
    dimension: 'sn',
    order: 12,
  },
  {
    text: 'You are talkative.',
    dimension: 'ei',
    order: 13,
  },
  {
    text: 'You learn better by listening.',
    dimension: 'ei',
    order: 14,
  },
  {
    text: 'You prefer conceptual tasks.',
    dimension: 'sn',
    order: 15,
  },
  {
    text: 'You rely on empathy when deciding.',
    dimension: 'tf',
    order: 16,
  },
  {
    text: 'You prefer investigating over speculating.',
    dimension: 'sn',
    order: 17,
  },
  {
    text: 'You are systematic in your routines.',
    dimension: 'pj',
    order: 18,
  },
  {
    text: 'You prefer routine over variety.',
    dimension: 'pj',
    order: 19,
  },
];

const sampleTasks: TaskData[] = [
  {
    name: 'Team Leadership Task',
    description:
      'A task that requires strong leadership and interpersonal skills',
    teamSize: 4,
  },
  {
    name: 'Creative Innovation Project',
    description:
      'A project focused on generating new ideas and creative solutions',
    teamSize: 3,
  },
  {
    name: 'Analytical Problem Solving',
    description: 'A task requiring logical analysis and systematic thinking',
    teamSize: 5,
  },
  {
    name: 'Collaborative Planning Project',
    description:
      'A structured project requiring careful planning and coordination',
    teamSize: 4,
  },
];

const testUsers: UserData[] = [
  {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    gender: Gender.FEMALE,
    mbti: { ei: 0.7, sn: -0.3, tf: 0.5, pj: -0.2 },
  },
  {
    name: 'Bob Smith',
    email: 'bob@example.com',
    gender: Gender.MALE,
    mbti: { ei: -0.6, sn: 0.4, tf: -0.7, pj: 0.8 },
  },
  {
    name: 'Carol Davis',
    email: 'carol@example.com',
    gender: Gender.FEMALE,
    mbti: { ei: 0.2, sn: -0.5, tf: 0.6, pj: 0.3 },
  },
];

const similarities: SimilarityData[] = [
  { skill1Idx: 0, skill2Idx: 1, similarity: 0.8 },
  { skill1Idx: 0, skill2Idx: 2, similarity: 0.7 },
  { skill1Idx: 1, skill2Idx: 4, similarity: 0.75 },
  { skill1Idx: 6, skill2Idx: 7, similarity: 0.85 },
  { skill1Idx: 8, skill2Idx: 10, similarity: 0.8 },
  { skill1Idx: 13, skill2Idx: 16, similarity: 0.9 },
  { skill1Idx: 12, skill2Idx: 15, similarity: 0.85 },
  { skill1Idx: 18, skill2Idx: 19, similarity: 0.8 },
];

async function seedMBTIQuestions() {
  console.log('🌱 Starting MBTI questions seeding...');

  try {
    await prisma.$transaction(async tx => {
      // Clear existing MBTI questions first
      await tx.skill.deleteMany({
        where: { name: { startsWith: 'MBTI' } },
      });
      console.log('✅ Cleared existing MBTI questions');

      // Create MBTI skills for the 24 questions using parallel operations
      const skillCreationPromises = mbtiQuestions.map(questionData =>
        tx.skill.create({
          data: withTimestamps({
            id: randomUUID(),
            name: `MBTI Question ${questionData.order}`,
            description: `${questionData.text} (${questionData.dimension.toUpperCase()} dimension)`,
          }),
          select: {
            id: true,
            name: true,
            description: true,
          },
        })
      );

      const mbtiSkills = await Promise.all(skillCreationPromises);
      console.log(`✅ Created ${mbtiSkills.length} MBTI question skills`);

      // Create sample tasks in parallel
      const taskCreationPromises = sampleTasks.map(taskData =>
        tx.task.create({
          data: withTimestamps({
            id: randomUUID(),
            ...taskData,
          }),
          select: {
            id: true,
            name: true,
            teamSize: true,
          },
        })
      );

      const createdTasks = await Promise.all(taskCreationPromises);
      console.log(`✅ Created ${createdTasks.length} sample tasks`);

      // Link MBTI skills to tasks with importance weights
      const taskSkillPromises = createdTasks.flatMap(task => {
        const skillCount = Math.floor(Math.random() * 3) + 3;
        const selectedSkills = mbtiSkills
          .sort(() => 0.5 - Math.random())
          .slice(0, skillCount);

        return selectedSkills.map(skill =>
          tx.taskSkill.create({
            data: {
              id: randomUUID(),
              taskId: task.id,
              skillId: skill.id,
              level: parseFloat((Math.random() * 0.4 + 0.3).toFixed(2)),
              importance: parseFloat((Math.random() * 0.5 + 0.5).toFixed(2)),
              ...withTimestamps({}),
            },
          })
        );
      });

      await Promise.all(taskSkillPromises);
      console.log('✅ Linked MBTI skills to tasks');

      // Create test users in parallel
      const userCreationPromises = testUsers.map(userData =>
        tx.user.create({
          data: withTimestamps({
            id: randomUUID(),
            name: userData.name,
            email: userData.email,
            emailVerified: true,
            gender: userData.gender,
            ei: userData.mbti.ei,
            sn: userData.mbti.sn,
            tf: userData.mbti.tf,
            pj: userData.mbti.pj,
            isOnboarded: true,
            role: 'mahasiswa',
          }),
          select: {
            id: true,
            name: true,
            email: true,
          },
        })
      );

      const createdUsers = await Promise.all(userCreationPromises);
      console.log(
        `✅ Created ${createdUsers.length} test users with MBTI profiles`
      );

      // Create person skills and task preferences for each user
      const userSkillPromises = createdUsers.flatMap(user => {
        const userSkillCount = Math.floor(Math.random() * 8) + 5;
        const userSkills = mbtiSkills
          .sort(() => 0.5 - Math.random())
          .slice(0, userSkillCount);

        const skillPromises = userSkills.map(skill =>
          tx.personSkill.create({
            data: {
              id: randomUUID(),
              personId: user.id,
              skillId: skill.id,
              level: parseFloat((Math.random() * 0.8 + 0.2).toFixed(2)),
              ...withTimestamps({}),
            },
          })
        );

        const taskPreferencePromises = createdTasks.map(task =>
          tx.taskPreference.create({
            data: {
              id: randomUUID(),
              taskId: task.id,
              personId: user.id,
              preference: parseFloat((Math.random() * 0.8 + 0.2).toFixed(2)),
              ...withTimestamps({}),
            },
          })
        );

        return [...skillPromises, ...taskPreferencePromises];
      });

      await Promise.all(userSkillPromises);
      console.log('✅ Created person skills and task preferences');

      // Create skill similarities
      const similarityPromises = similarities.map(sim => {
        const skill1 = mbtiSkills[sim.skill1Idx];
        const skill2 = mbtiSkills[sim.skill2Idx];

        if (skill1 && skill2) {
          return tx.skillSimilarity.create({
            data: {
              id: randomUUID(),
              sourceId: skill1.id,
              targetId: skill2.id,
              similarity: sim.similarity,
              ...withTimestamps({}),
            },
          });
        }
        return Promise.resolve();
      });

      await Promise.all(similarityPromises);
      console.log(`✅ Created ${similarities.length} skill similarities`);
    });

    console.log('🎉 MBTI questions seeding completed successfully!');
    console.log('\n📊 Seeding Summary:');
    console.log(`   • ${mbtiQuestions.length} MBTI question skills created`);
    console.log(`   • ${sampleTasks.length} sample tasks created`);
    console.log(
      `   • ${testUsers.length} test users with MBTI profiles created`
    );
    console.log(`   • ${similarities.length} skill similarities created`);
    console.log(
      '\n💡 You can now use these MBTI questions in your personality test!'
    );
  } catch (error) {
    console.error('❌ Error seeding MBTI questions:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedMBTIQuestions();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { seedMBTIQuestions };
