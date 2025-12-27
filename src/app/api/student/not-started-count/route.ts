import { NextResponse } from 'next/server';
import { getSidebarData } from '@/lib/dashboard/sidebar-data';

export async function GET() {
  try {
    const { notStartedCount } = await getSidebarData();
    return NextResponse.json({ count: notStartedCount });
  } catch (error) {
    console.error('Failed to get not-started count:', error);
    return NextResponse.json({ count: 0 });
  }
}
