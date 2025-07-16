import prisma from '../src/lib/prisma';

type MBTIQuestion = {
  text: string;
  skillName: string;
};

const mbtiQuestions: MBTIQuestion[] = [
  {
    text: 'You think judges should be merciful.',
    skillName: 'MBTI Question 1',
  },
  { text: 'You prefer open-ended activities.', skillName: 'MBTI Question 2' },
  { text: 'You prefer novel over traditional.', skillName: 'MBTI Question 3' },
  { text: 'You prefer groups to individuals.', skillName: 'MBTI Question 4' },
  { text: 'You tend to be tolerant.', skillName: 'MBTI Question 5' },
  { text: 'You work better under pressure.', skillName: 'MBTI Question 6' },
  { text: 'You are methodical.', skillName: 'MBTI Question 7' },
  { text: 'You prefer theoretical subjects.', skillName: 'MBTI Question 8' },
  { text: 'You are sociable.', skillName: 'MBTI Question 9' },
  { text: 'You prefer being curious.', skillName: 'MBTI Question 10' },
  { text: 'You are expressive.', skillName: 'MBTI Question 11' },
  { text: 'You tend to be diplomatic.', skillName: 'MBTI Question 12' },
  { text: 'You prefer abstract over specific.', skillName: 'MBTI Question 13' },
  { text: 'You are talkative.', skillName: 'MBTI Question 14' },
  { text: 'You learn better by listening.', skillName: 'MBTI Question 15' },
  { text: 'You prefer conceptual tasks.', skillName: 'MBTI Question 16' },
  { text: 'You rely on empathy when deciding.', skillName: 'MBTI Question 17' },
  {
    text: 'You prefer investigating over speculating.',
    skillName: 'MBTI Question 18',
  },
  {
    text: 'You are systematic in your routines.',
    skillName: 'MBTI Question 19',
  },
  { text: 'You prefer routine over variety.', skillName: 'MBTI Question 20' },
];

async function main() {
  console.log('🌱 Adding MBTI questions as skills...');

  try {
    await prisma.$transaction(async tx => {
      // Clear existing MBTI questions first
      await tx.skill.deleteMany({
        where: { name: { startsWith: 'MBTI Question' } },
      });
      console.log('✅ Cleared existing MBTI questions');

      // Create all MBTI skills in parallel using Promise.all
      const skillCreationPromises = mbtiQuestions.map(question =>
        tx.skill.upsert({
          where: { name: question.skillName },
          update: {
            description: question.text,
          },
          create: {
            name: question.skillName,
            description: question.text,
          },
          select: {
            id: true,
            name: true,
            description: true,
          },
        })
      );

      const createdSkills = await Promise.all(skillCreationPromises);

      // Log each created skill
      createdSkills.forEach(skill => {
        console.log(`✅ Added: ${skill.name}`);
      });

      console.log(
        `🎉 Successfully processed ${createdSkills.length} MBTI questions!`
      );
    });

    console.log('✅ Transaction completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch(error => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
