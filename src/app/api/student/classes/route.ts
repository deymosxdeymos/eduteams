import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-utils';
import { canAccessMahasiswaFeatures } from '@/lib/authorization';
import type { ExtendedUser } from '@/lib/types';

async function getStudentClasses(
  _request: NextRequest,
  { user }: { user: ExtendedUser }
) {
  if (!canAccessMahasiswaFeatures(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // For now, return empty array since enrollment is not implemented
  return NextResponse.json({
    success: true,
    data: [],
  });
}

async function joinClass(
  request: NextRequest,
  { user }: { user: ExtendedUser }
) {
  if (!canAccessMahasiswaFeatures(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { token } = await request.json();

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  // For now, just return success - enrollment will be implemented later
  return NextResponse.json({
    success: true,
    message: 'Successfully joined class',
  });
}

export const GET = withAuth(getStudentClasses);
export const POST = withAuth(joinClass);
