import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Deprecated: replaced by email domain verification
export default async function TokenVerificationPage() {
  redirect('/onboarding/role');
}
