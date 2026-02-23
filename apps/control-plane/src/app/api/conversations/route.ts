import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { agentLeadFilter } from '@/lib/agent-filter';

function getChatwootConfig() {
  const url = process.env[String('CW_PLATFORM_URL')] || process.env[String('CHATWOOT_BASE_URL')] || '';
  const token = process.env[String('CW_PLATFORM_KEY')] || '';
  return { url, token };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json([], { status: 401 });

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  const filter = agentLeadFilter(session);

  const conversations = await prisma.conversationLink.findMany({
    where: {
      tenantId: session.tenantId,
      ...filter,
      ...(q
        ? {
            OR: [
              { phone: { contains: q, mode: 'insensitive' as const } },
              { contactName: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { chatwootAccountId: true },
  });

  const { url, token } = getChatwootConfig();
  const accountId = tenant?.chatwootAccountId;

  const enriched = await Promise.all(
    conversations.map(async (conv) => {
      const isLocal = conv.source !== 'chatwoot';
      let labels: string[] = [];
      let status: 'bot' | 'human' = 'bot';

      if (isLocal) {
        status = conv.handoffActive ? 'human' : 'bot';
        labels = conv.handoffActive ? ['human_handoff'] : [];
      } else if (url && token && accountId) {
        try {
          const res = await fetch(
            `${url}/api/v1/accounts/${accountId}/conversations/${conv.chatwootConversationId}`,
            { headers: { api_access_token: token }, next: { revalidate: 0 } },
          );
          if (res.ok) {
            const data = await res.json();
            labels = data.labels ?? [];
          }
        } catch {}

        if (labels.includes('human_handoff')) {
          status = 'human';
        }
      }

      return {
        id: conv.id,
        chatwootConversationId: conv.chatwootConversationId,
        contactName: conv.contactName,
        phone: conv.phone,
        lastMessage: conv.lastMessage,
        stage: conv.stage,
        updatedAt: conv.updatedAt.toISOString(),
        labels,
        status,
        source: conv.source,
      };
    }),
  );

  return NextResponse.json(enriched);
}
