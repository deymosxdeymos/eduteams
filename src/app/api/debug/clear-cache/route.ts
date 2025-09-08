import { revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/api-utils';

// Restrict to admins to prevent arbitrary cache invalidation
export const POST = withRole('admin', async (request: NextRequest) => {
  try {
    const { tag } = await request.json();

    if (!tag || typeof tag !== 'string') {
      return NextResponse.json({ error: 'Tag is required' }, { status: 400 });
    }

    revalidateTag(tag);

    return NextResponse.json({
      success: true,
      message: `Cache cleared for tag: ${tag}`,
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
});
