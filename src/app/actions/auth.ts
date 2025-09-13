'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

// Example: Sign in with email/password from a Server Action.
// With nextCookies() plugin in auth config, Set-Cookie headers are applied automatically.
export async function signInEmail(params: { email: string; password: string }) {
  const { email, password } = params;
  return auth.api.signInEmail({
    body: { email, password },
  });
}

// Example: Sign out from a Server Action.
export async function signOut() {
  return auth.api.signOut({
    headers: await headers(),
  });
}

// Example: Fetch session info on the server (can be used in Server Actions or RSCs)
export async function getServerSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}
