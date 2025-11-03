#!/usr/bin/env bun

import prisma from '@/lib/prisma';

async function main() {
  const dosen = await prisma.user.findMany({
    where: { role: 'dosen' },
    select: { id: true, name: true, email: true },
  });

  console.log('Dosen accounts:');
  dosen.forEach(d => {
    console.log(`- ${d.name} (${d.email})`);
  });

  const courses = await prisma.course.findMany({
    include: {
      _count: { select: { enrollments: true } },
      dosen: { select: { name: true, email: true } },
    },
  });

  console.log('\nAll courses:');
  courses.forEach(c => {
    console.log(
      `- ${c.namaMataKuliah} (${c.kelas}) [Dosen: ${c.dosen.name}]: ${c._count.enrollments} students`
    );
  });

  // Check bukangalin specifically
  console.log('\nCourses for bukangalin:');
  const bukangalinCourses = await prisma.course.findMany({
    where: {
      dosen: {
        email: 'bukangalin@example.com',
      },
    },
    include: {
      _count: {
        select: { enrollments: true },
      },
      dosen: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (bukangalinCourses.length === 0) {
    console.log('  No courses found for bukangalin@example.com');
  } else {
    bukangalinCourses.forEach(c => {
      console.log(
        `- ${c.namaMataKuliah} (${c.kelas}): ${c._count.enrollments} students`
      );
    });
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
