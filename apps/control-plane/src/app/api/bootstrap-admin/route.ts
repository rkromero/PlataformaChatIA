import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const secret = request.headers.get('x-bootstrap-secret');
  if (secret !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const existing = await prisma.tenantUser.findFirst({
    where: { role: 'super_admin' },
  });

  if (existing) {
    return NextResponse.json({
      message: 'Super admin already exists',
      email: existing.email,
    });
  }

  const { email } = (await request.json()) as { email?: string };

  const user = email
    ? await prisma.tenantUser.findFirst({ where: { email } })
    : await prisma.tenantUser.findFirst({ orderBy: { createdAt: 'asc' } });

  if (!user) {
    return NextResponse.json({ error: 'No user found' }, { status: 404 });
  }

  await prisma.tenantUser.update({
    where: { id: user.id },
    data: { role: 'super_admin' },
  });

  return NextResponse.json({
    message: 'User promoted to super_admin',
    email: user.email,
  });
}
