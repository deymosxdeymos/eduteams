import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/api-utils';
import { getRedirectPath, permissions } from '@/lib/authorization';
import type { ExtendedUser } from '@/lib/types';

async function requireAuth(): Promise<ExtendedUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  return user;
}

async function _requireOnboarded(): Promise<ExtendedUser> {
  const user = await requireAuth();

  if (!user.isOnboarded) {
    const redirectPath = getRedirectPath(user);
    redirect(redirectPath);
  }

  return user;
}

async function _requireRole(
  allowedRoles: string | string[]
): Promise<ExtendedUser> {
  const user = await requireAuth();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!user.role || !roles.includes(user.role)) {
    redirect('/dashboard');
  }

  return user;
}

export async function handleAuthRedirect(): Promise<ExtendedUser | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  // Check if user needs to complete onboarding
  if (permissions.needsOnboarding(user)) {
    const redirectPath = getRedirectPath(user);
    redirect(redirectPath);
  }

  return user;
}

export async function protectOnboardingPage(): Promise<ExtendedUser> {
  const user = await requireAuth();

  // If user is already onboarded, redirect to dashboard
  if (user.isOnboarded) {
    redirect('/dashboard');
  }

  return user;
}

export async function protectDashboard(): Promise<ExtendedUser> {
  const user = await requireAuth();

  // If user hasn't completed onboarding, redirect to onboarding
  if (!permissions.canAccessDashboard(user)) {
    const redirectPath = getRedirectPath(user);
    redirect(redirectPath);
  }

  return user;
}
