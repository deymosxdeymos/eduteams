export const CACHE_TAGS = {
  coursesByDosen: (dosenId: string) => `courses-${dosenId}`,
  studentClasses: (studentId: string) => `student-classes-${studentId}`,
  classCatalogs: 'class-catalogs',
};
