import Content from '@/components/dashboard/content';
import { canAccessDosenFeatures } from '@/lib/authorization';
import {
  type DosenCourseSummary,
  getCoursesForDosen,
} from '@/lib/dashboard/courses';
import type { DashboardStatistics } from '@/lib/dashboard/statistics';
import type { ExtendedUser } from '@/lib/types';

interface DashboardCoursesAsyncProps {
  user: ExtendedUser;
  statistics: DashboardStatistics;
}

export async function DashboardCoursesAsync({
  user,
  statistics,
}: DashboardCoursesAsyncProps) {
  const isDosen = canAccessDosenFeatures(user);

  if (!isDosen) {
    return null;
  }

  const courses: DosenCourseSummary[] = await getCoursesForDosen(user.id);

  return <Content statistics={statistics} courses={courses} />;
}
