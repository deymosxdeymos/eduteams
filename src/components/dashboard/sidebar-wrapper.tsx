"use client";

import useSWR from "swr";
import Sidebar from "./sidebar";

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const swrOptions = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export default function SidebarWrapper() {
  const { data: userData } = useSWR("/api/user", fetcher, swrOptions);
  const { data: countData } = useSWR("/api/student/not-started-count", fetcher, swrOptions);

  return <Sidebar user={userData?.data ?? null} notStartedCount={countData?.count ?? 0} />;
}
