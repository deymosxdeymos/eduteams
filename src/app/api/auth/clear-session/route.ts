import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Route handler to clear invalid session cookies.
 * This is called when a user has an expired/invalid session cookie
 * to prevent infinite redirect loops.
 */
export async function GET(request: NextRequest) {
  // Clear the invalid session cookies
  const cookieStore = await cookies();
  cookieStore.delete('better-auth.session_token');
  cookieStore.delete('session_token');

  // Get the redirect URL from query params or default to home
  const redirectTo = request.nextUrl.searchParams.get('redirect') || '/';

  // Redirect to the specified location
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
