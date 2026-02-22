import { prisma } from '@/lib/db';
import { decryptJson } from '@chat-platform/shared/crypto';

interface ChannelConfig {
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
}

export async function getChannelConfig(tenantId: string): Promise<ChannelConfig | null> {
  const channel = await prisma.tenantChannel.findFirst({
    where: { tenantId, type: 'whatsapp' },
    select: { configEncryptedJson: true },
  });

  if (!channel) return null;

  try {
    return decryptJson<ChannelConfig>(channel.configEncryptedJson);
  } catch {
    return null;
  }
}

interface MetaTemplate {
  id: string;
  name: string;
  language: string;
  category: string;
  status: string;
  components: MetaComponent[];
}

interface MetaComponent {
  type: string;
  format?: string;
  text?: string;
  buttons?: Array<{ type: string; text: string; url?: string; phone_number?: string }>;
  example?: { body_text?: string[][] };
}

export async function fetchMetaTemplates(config: ChannelConfig): Promise<MetaTemplate[]> {
  const url = `https://graph.facebook.com/v21.0/${config.wabaId}/message_templates?limit=100`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${config.accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meta API error (${res.status}): ${text}`);
  }

  const data = await res.json();
  return (data.data ?? []) as MetaTemplate[];
}

export async function syncTemplatesFromMeta(tenantId: string): Promise<number> {
  const config = await getChannelConfig(tenantId);
  if (!config) throw new Error('No hay canal WhatsApp configurado');

  const metaTemplates = await fetchMetaTemplates(config);

  let synced = 0;
  for (const tpl of metaTemplates) {
    await prisma.whatsAppTemplate.upsert({
      where: {
        tenantId_name_language: {
          tenantId,
          name: tpl.name,
          language: tpl.language,
        },
      },
      create: {
        tenantId,
        metaId: tpl.id,
        name: tpl.name,
        language: tpl.language,
        category: tpl.category,
        status: tpl.status,
        components: JSON.parse(JSON.stringify(tpl.components)),
      },
      update: {
        metaId: tpl.id,
        category: tpl.category,
        status: tpl.status,
        components: JSON.parse(JSON.stringify(tpl.components)),
      },
    });
    synced++;
  }

  return synced;
}

export async function createMetaTemplate(
  config: ChannelConfig,
  name: string,
  category: string,
  language: string,
  bodyText: string,
): Promise<MetaTemplate> {
  const url = `https://graph.facebook.com/v21.0/${config.wabaId}/message_templates`;

  const components: MetaComponent[] = [
    { type: 'BODY', text: bodyText },
  ];

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.accessToken}`,
    },
    body: JSON.stringify({
      name,
      category: category.toUpperCase(),
      language,
      components,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meta API error (${res.status}): ${text}`);
  }

  return res.json() as Promise<MetaTemplate>;
}

export async function sendTemplateMessage(
  config: ChannelConfig,
  toPhone: string,
  templateName: string,
  language: string,
  bodyParams: string[] = [],
): Promise<boolean> {
  const url = `https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`;

  const components: Array<Record<string, unknown>> = [];
  if (bodyParams.length > 0) {
    components.push({
      type: 'body',
      parameters: bodyParams.map((p) => ({ type: 'text', text: p })),
    });
  }

  const body: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    to: toPhone.replace(/[^0-9]/g, ''),
    type: 'template',
    template: {
      name: templateName,
      language: { code: language },
      ...(components.length > 0 ? { components } : {}),
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meta send template error (${res.status}): ${text}`);
  }

  return true;
}

export function extractBodyVariables(components: MetaComponent[]): number {
  const body = components.find((c) => c.type === 'BODY');
  if (!body?.text) return 0;
  const matches = body.text.match(/\{\{\d+\}\}/g);
  return matches?.length ?? 0;
}

export function getBodyText(components: unknown[]): string {
  const body = (components as MetaComponent[]).find((c) => c.type === 'BODY');
  return body?.text ?? '';
}
