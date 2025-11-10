import prisma from '@/lib/prisma';
import type { CourseCatalog } from '@/lib/types';

type CourseCatalogFilters = {
  search?: string;
};

export async function getCourseCatalog(
  filters: CourseCatalogFilters = {}
): Promise<CourseCatalog[]> {
  const where = filters.search
    ? {
        OR: [
          { code: { contains: filters.search, mode: 'insensitive' as const } },
          { name: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }
    : undefined;

  return prisma.courseCatalog.findMany({
    where,
    orderBy: [{ code: 'asc' }, { name: 'asc' }],
  });
}

interface CreateCourseCatalogInput {
  code: string;
  name: string;
}

export async function createCourseCatalogEntry(
  input: CreateCourseCatalogInput
): Promise<CourseCatalog> {
  return prisma.courseCatalog.create({
    data: {
      code: input.code,
      name: input.name,
    },
  });
}
