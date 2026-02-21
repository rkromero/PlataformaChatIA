import { env } from '../lib/env.js';
import { logger } from '../lib/logger.js';

export interface Attachment {
  id: number;
  file_type: 'image' | 'audio' | 'video' | 'file';
  data_url: string;
  extension?: string;
}

export function extractAttachments(body: Record<string, unknown>): Attachment[] {
  const raw = body.attachments;
  if (!Array.isArray(raw) || raw.length === 0) return [];

  return raw
    .filter((a: Record<string, unknown>) => a.data_url && a.file_type)
    .map((a: Record<string, unknown>) => ({
      id: a.id as number,
      file_type: a.file_type as Attachment['file_type'],
      data_url: a.data_url as string,
      extension: (a.extension as string) ?? undefined,
    }));
}

export async function downloadMedia(dataUrl: string): Promise<{ buffer: Buffer; contentType: string }> {
  const url = dataUrl.startsWith('http') ? dataUrl : `${env.CHATWOOT_BASE_URL}${dataUrl}`;

  const res = await fetch(url, {
    headers: { api_access_token: env.CHATWOOT_API_TOKEN },
  });

  if (!res.ok) {
    throw new Error(`Failed to download media: ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const contentType = res.headers.get('content-type') ?? 'application/octet-stream';

  return { buffer: Buffer.from(arrayBuffer), contentType };
}

export function getAudioAttachment(attachments: Attachment[]): Attachment | null {
  return attachments.find((a) => a.file_type === 'audio') ?? null;
}

export function getImageAttachments(attachments: Attachment[]): Attachment[] {
  return attachments.filter((a) => a.file_type === 'image');
}

export function mediaToBase64Url(buffer: Buffer, contentType: string): string {
  const base64 = buffer.toString('base64');
  const mimeType = contentType.split(';')[0].trim();
  return `data:${mimeType};base64,${base64}`;
}

export function getAudioMimeType(contentType: string): string {
  const mime = contentType.split(';')[0].trim();
  const supported = ['audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/flac'];
  if (supported.includes(mime)) return mime;
  if (mime.includes('ogg') || mime.includes('opus')) return 'audio/ogg';
  return 'audio/mp4';
}

export function getAudioExtension(contentType: string): string {
  const mime = getAudioMimeType(contentType);
  const map: Record<string, string> = {
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'mp4',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'audio/webm': 'webm',
    'audio/flac': 'flac',
  };
  return map[mime] ?? 'mp4';
}
