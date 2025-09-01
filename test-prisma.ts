import prisma from './src/lib/prisma';

async function testPrismaConnection() {
  console.log('🔍 Testing Prisma connection...');

  console.log('Environment variables:');
  const dbUrlSet = Boolean(process.env.DATABASE_URL);
  console.log('  DATABASE_URL set:', dbUrlSet);
  console.log('  NODE_ENV:', process.env.NODE_ENV);

  try {
    console.log('\n🔌 Attempting to connect to database...');
    await prisma.$connect();
    console.log('✅ Successfully connected to database');

    console.log('\n📊 Testing simple query...');
    const userCount = await prisma.user.count();
    console.log(`✅ User count: ${userCount}`);

    console.log('\n🎯 Testing skill table...');
    const skillCount = await prisma.skill.count();
    console.log(`✅ Skill count: ${skillCount}`);
  } catch (error) {
    console.error('❌ Error testing Prisma connection:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Disconnected from database');
  }
}

testPrismaConnection();
