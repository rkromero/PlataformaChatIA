import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getBodyText } from '@/lib/meta-templates';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json([], { status: 401 });

  const templates = await prisma.whatsAppTemplate.findMany({
    where: { tenantId: session.tenantId, status: 'APPROVED' },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      language: true,
      category: true,
      components: true,
    },
  });

  const result = templates.map((t) => ({
    id: t.id,
    name: t.name,
    language: t.language,
    category: t.category,
    bodyText: getBodyText(t.components as unknown[]),
    varCount: (getBodyText(t.components as unknown[]).match(/\{\{\d+\}\}/g) ?? []).length,
  }));

  return NextResponse.json(result);
}
