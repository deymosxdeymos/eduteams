import prisma from '@/lib/prisma';

export async function getCourseCatalogs() {
  try {
    const [courseCatalogs, classCatalogs] = await Promise.all([
      // Course catalog (mata kuliah)
      prisma.courseCatalog.findMany({
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          code: true,
        },
      }),
      // Class catalog (kelas)
      prisma.classCatalog.findMany({
        orderBy: { code: 'asc' },
        select: {
          id: true,
          code: true,
        },
      }),
    ]);

    return {
      courseCatalogs,
      classCatalogs,
    };
  } catch {
    return {
      courseCatalogs: [],
      classCatalogs: [],
    };
  }
}
