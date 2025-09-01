import type { NextRequest } from 'next/server';

function normalize(url: string | null | undefined): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    // Strip trailing slash for stable comparisons
    return `${u.protocol}//${u.host}`;
  } catch {
    return String(url).replace(/\/$/, '');
  }
}

export function getAllowedOrigin(): string {
  return normalize(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
}

export function isSameOrigin(request: NextRequest): boolean {
  const origin = normalize(request.headers.get('origin'));
  const referer = normalize(request.headers.get('referer'));
  const allowed = getAllowedOrigin();

  // No origin/referer usually means non-browser or same-origin fetch; allow
  if (!origin && !referer) return true;

  return origin === allowed || referer.startsWith(allowed);
}
