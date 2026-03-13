import prisma from "@/lib/prisma";
import type { ClassCatalog } from "@/lib/types";

type ClassCatalogFilters = {
  search?: string;
};

export async function getClassCatalog(filters: ClassCatalogFilters = {}): Promise<ClassCatalog[]> {
  const where = filters.search
    ? {
        code: { contains: filters.search, mode: "insensitive" as const },
      }
    : undefined;

  return prisma.classCatalog.findMany({
    where,
    orderBy: { code: "asc" },
  });
}

interface CreateClassCatalogInput {
  code: string;
}

export async function createClassCatalogEntry(
  input: CreateClassCatalogInput,
): Promise<ClassCatalog> {
  return prisma.classCatalog.create({
    data: {
      code: input.code,
    },
  });
}
