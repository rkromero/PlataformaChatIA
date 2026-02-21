import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { sendUsageLimitEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-internal-secret');
  const expectedSecret = process.env[String('AUTH_SECRET')] ?? '';

  if (!secret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { tenantId, percent } = body as { tenantId: string; percent: number };

  if (!tenantId || !percent) {
    return NextResponse.json({ error: 'missing params' }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });
  if (!tenant) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const owner = await prisma.tenantUser.findFirst({
    where: { tenantId, role: 'owner' },
    select: { email: true },
  });
  if (!owner) return NextResponse.json({ ok: false });

  await sendUsageLimitEmail(owner.email, tenant.name, percent);

  return NextResponse.json({ ok: true });
}
