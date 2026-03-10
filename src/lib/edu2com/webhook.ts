import crypto from 'node:crypto';

function computeSignature(requestId: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(requestId).digest('hex');
}

export function buildEdu2comReplyPostUrl(args: {
  requestId: string;
  baseUrl: string;
  secret: string;
}): string {
  const url = new URL('/api/edu2com/webhook', args.baseUrl);
  url.searchParams.set('requestId', args.requestId);
  url.searchParams.set('token', computeSignature(args.requestId, args.secret));
  return url.toString();
}

export function verifyEdu2comWebhookToken(args: {
  requestId: string;
  token: string | null;
  secret: string;
}): boolean {
  if (!args.token) return false;
  try {
    const expected = computeSignature(args.requestId, args.secret);
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(args.token.trim())
    );
  } catch {
    return false;
  }
}
