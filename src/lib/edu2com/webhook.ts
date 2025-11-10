import crypto from 'node:crypto';

function getWebhookSecret(): string {
  const secret =
    process.env.EDU2COM_WEBHOOK_SECRET ?? process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error(
      'Set EDU2COM_WEBHOOK_SECRET (or BETTER_AUTH_SECRET) to secure Edu2com callbacks.'
    );
  }
  return secret;
}

function normalizeBaseUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/+$/, '');
  return `https://${trimmed.replace(/\/+$/, '')}`;
}

function getWebhookBaseUrl(): string {
  const base =
    normalizeBaseUrl(process.env.EDU2COM_WEBHOOK_BASE_URL) ??
    normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeBaseUrl(process.env.VERCEL_URL) ??
    'http://localhost:3000';
  if (!/^https?:\/\//i.test(base)) {
    throw new Error(
      'Edu2com webhook base URL must be absolute (set EDU2COM_WEBHOOK_BASE_URL or NEXT_PUBLIC_APP_URL).'
    );
  }
  return base;
}

function computeSignature(requestId: string): string {
  return crypto
    .createHmac('sha256', getWebhookSecret())
    .update(requestId)
    .digest('hex');
}

export function buildEdu2comReplyPostUrl(requestId: string): string {
  const base = getWebhookBaseUrl();
  const url = new URL('/api/edu2com/webhook', base);
  url.searchParams.set('requestId', requestId);
  url.searchParams.set('token', computeSignature(requestId));
  return url.toString();
}

export function verifyEdu2comWebhookToken(
  requestId: string,
  token: string | null
): boolean {
  if (!token) return false;
  try {
    const expected = computeSignature(requestId);
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(token.trim())
    );
  } catch {
    return false;
  }
}
