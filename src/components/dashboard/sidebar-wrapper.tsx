'use client';

import useSWR from 'swr';
import Sidebar from './sidebar';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SidebarWrapper() {
  const { data: userData } = useSWR('/api/user', fetcher);
  const { data: countData } = useSWR('/api/student/not-started-count', fetcher);

  return (
    <Sidebar
      user={userData?.data ?? null}
      notStartedCount={countData?.count ?? 0}
    />
  );
}
