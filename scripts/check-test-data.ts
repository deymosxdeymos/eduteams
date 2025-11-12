#!/usr/bin/env bun
/**
 * Check test data in database
 */

import prisma from '../src/lib/prisma';

async function main() {
  console.log('🔍 Checking test data...\n');

  // Check test user
  const user = await prisma.user.findUnique({
    where: { email: 'test@example.com' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isOnboarded: true,
    },
  });
  console.log('Test User:', user || '❌ Not found');

  // Check test course
  const course = await prisma.course.findUnique({
    where: { id: 'test-course-id' },
    select: { id: true, namaMataKuliah: true, dosenId: true },
  });
  console.log('Test Course:', course || '❌ Not found');

  // Check skills
  const skills = await prisma.skill.findMany({
    take: 5,
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
  console.log('Skills (first 5):', skills);

  // Check course skills
  const courseSkills = await prisma.courseSkill.findMany({
    where: { courseId: 'test-course-id' },
    include: { skill: { select: { name: true } } },
  });
  console.log('\nCourse Skills:', courseSkills);

  // Check assignments with topics
  const assignments = await prisma.assignment.findMany({
    where: { courseId: 'test-course-id' },
    select: {
      id: true,
      title: true,
      description: true,
    },
  });
  console.log('\nAssignments:', assignments);

  // Check assignment topics separately
  const assignmentTopics = await prisma.assignmentTopic.findMany({
    where: {
      assignment: {
        courseId: 'test-course-id',
      },
    },
    select: { name: true, assignmentId: true },
  });
  console.log('Assignment Topics:', assignmentTopics);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
