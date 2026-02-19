import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const checks: Record<string, unknown> = {};

  try {
    const count = await prisma.tenant.count();
    checks.db = { ok: true, tenantCount: count };
  } catch (err) {
    checks.db = { ok: false, error: String(err) };
  }

  try {
    const session = await getSession();
    checks.session = session
      ? { ok: true, userId: session.userId, tenantId: session.tenantId }
      : { ok: false, reason: 'no session' };
  } catch (err) {
    checks.session = { ok: false, error: String(err) };
  }

  checks.env = {
    hasDbUrl: !!process.env.DATABASE_URL,
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasEncryptionKey: !!process.env.ENCRYPTION_KEY,
    nodeEnv: process.env.NODE_ENV,
  };

  return NextResponse.json(checks);
}
