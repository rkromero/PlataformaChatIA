import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { createToken } from '@/lib/tokens';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const email = body.email as string;

  if (email !== session.email) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const token = await createToken(email, 'email_verification', 24);
  await sendVerificationEmail(email, token);

  return NextResponse.json({ ok: true });
}
