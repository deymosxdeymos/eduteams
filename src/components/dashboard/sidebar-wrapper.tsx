'use client';

import { useEffect, useState } from 'react';
import Sidebar from './sidebar';

export default function SidebarWrapper() {
  const [sidebarData, setSidebarData] = useState({
    user: null,
    notStartedCount: 0,
  });

  useEffect(() => {
    // Fetch data client-side for non-dashboard pages
    const fetchSidebarData = async () => {
      try {
        const [userResponse, countResponse] = await Promise.all([
          fetch('/api/user'),
          fetch('/api/student/not-started-count'),
        ]);

        const userData = await userResponse.json();
        const countData = countResponse.ok
          ? await countResponse.json()
          : { count: 0 };

        setSidebarData({
          user: userData.data,
          notStartedCount: countData.count,
        });
      } catch (error) {
        console.error('Failed to fetch sidebar data:', error);
      }
    };

    fetchSidebarData();
  }, []);

  return <Sidebar {...sidebarData} />;
}
