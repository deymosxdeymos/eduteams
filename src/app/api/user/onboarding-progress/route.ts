import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/api-utils';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { step } = await request.json();

    await prisma.user.update({
      where: { id: user.id },
      data: { onboardingStep: step },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating onboarding progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
