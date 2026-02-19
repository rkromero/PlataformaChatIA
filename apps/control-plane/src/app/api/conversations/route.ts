import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json([], { status: 401 });
  }

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';

  const conversations = await prisma.conversationLink.findMany({
    where: {
      tenantId: session.tenantId,
      ...(q
        ? {
            OR: [
              { phone: { contains: q, mode: 'insensitive' } },
              { crmLeadId: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json(conversations);
}
