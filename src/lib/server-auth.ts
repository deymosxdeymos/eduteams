import 'server-only';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/api-utils';
import { getRedirectPath, permissions } from '@/lib/authorization';
import { clearAuthSessionCookies } from '@/lib/demo/auth';
import type { ExtendedUser } from '@/lib/types';

async function requireAuth(): Promise<ExtendedUser> {
  const user = await getCurrentUser();

  if (!user) {
    await clearAuthSessionCookies();
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

  if (permissions.needsOnboarding(user)) {
    const redirectPath = getRedirectPath(user);
    redirect(redirectPath);
  }

  return user;
}

export async function protectOnboardingPage(): Promise<ExtendedUser> {
  const user = await requireAuth();

  if (user.isOnboarded) {
    redirect('/dashboard');
  }

  return user;
}

export async function protectDashboard(): Promise<ExtendedUser> {
  const user = await requireAuth();

  if (!permissions.canAccessDashboard(user)) {
    const redirectPath = getRedirectPath(user);
    redirect(redirectPath);
  }

  return user;
}
