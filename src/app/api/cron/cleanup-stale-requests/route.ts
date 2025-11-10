import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STUCK_REQUEST_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

// Vercel Cron Job endpoint - runs every 10 minutes to clean up stale requests
export async function GET(req: Request) {
  // Verify cron secret for security
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[Cron] Unauthorized cleanup attempt - invalid CRON_SECRET');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const staleCutoff = new Date(now.getTime() - STUCK_REQUEST_TIMEOUT_MS);

    console.log(
      `[Cron] Starting cleanup of stale team formation requests older than ${staleCutoff.toISOString()}`
    );

    const result = await prisma.teamFormationRequest.updateMany({
      where: {
        status: { in: ['PENDING', 'PROCESSING'] },
        updatedAt: { lt: staleCutoff },
      },
      data: {
        status: 'FAILED',
        errorMessage:
          'Request timed out - no response from Edu2com within 10 minutes.',
        completedAt: now,
      },
    });

    const count = result.count;

    if (count > 0) {
      console.log(
        `[Cron] Marked ${count} stale team formation request(s) as FAILED`
      );
    } else {
      console.log('[Cron] No stale team formation requests found');
    }

    return NextResponse.json({
      success: true,
      cleaned: count,
      message: `Cleaned up ${count} stale request(s)`,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Cron] Failed to cleanup stale requests:', errorMsg);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cleanup stale requests',
        details: errorMsg,
      },
      { status: 500 }
    );
  }
}
