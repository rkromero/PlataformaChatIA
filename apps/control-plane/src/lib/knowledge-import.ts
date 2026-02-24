import * as XLSX from 'xlsx';

const MAX_CHUNK_CHARS = 4500;
const MAX_ENTRIES = 25;
const MAX_TOTAL_CHARS = 60_000;

interface ParsedEntry {
  title: string;
  content: string;
}

function safeUrlTitle(rawUrl: string): string {
  try {
    const { hostname } = new URL(rawUrl);
    return `Sitio web - ${hostname}`;
  } catch {
    return 'Sitio web importado';
  }
}

function normalizeText(raw: string): string {
  return raw
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

function splitTextIntoChunks(text: string): string[] {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  const paragraphs = normalized.split(/\n\n+/);
  const chunks: string[] = [];
  let current = '';

  for (const paragraph of paragraphs) {
    const next = current ? `${current}\n\n${paragraph}` : paragraph;
    if (next.length <= MAX_CHUNK_CHARS) {
      current = next;
      continue;
    }

    if (current) chunks.push(current);
    if (paragraph.length <= MAX_CHUNK_CHARS) {
      current = paragraph;
      continue;
    }

    // If a paragraph is too long, hard split to keep DB limits.
    for (let i = 0; i < paragraph.length; i += MAX_CHUNK_CHARS) {
      chunks.push(paragraph.slice(i, i + MAX_CHUNK_CHARS));
    }
    current = '';
  }

  if (current) chunks.push(current);
  return chunks.slice(0, MAX_ENTRIES);
}

function fileTitleBase(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '').trim() || 'Documento importado';
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function extractTextFromHtml(html: string): { title: string; text: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const titleRaw = titleMatch?.[1] || '';

  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');

  const bodyText = decodeHtmlEntities(
    withoutScripts
      .replace(/<\/(p|div|section|article|li|h1|h2|h3|h4|h5|h6|br)>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return {
    title: decodeHtmlEntities(titleRaw).trim(),
    text: bodyText,
  };
}

function parseExcelEntries(buffer: Buffer, fileName: string): ParsedEntry[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const base = fileTitleBase(fileName);
  const entries: ParsedEntry[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    const chunks = splitTextIntoChunks(csv);
    chunks.forEach((chunk, idx) => {
      entries.push({
        title: `${base} - ${sheetName}${chunks.length > 1 ? ` (parte ${idx + 1})` : ''}`,
        content: chunk,
      });
    });
    if (entries.length >= MAX_ENTRIES) break;
  }

  return entries.slice(0, MAX_ENTRIES);
}

async function parsePdfEntries(buffer: Buffer, fileName: string): Promise<ParsedEntry[]> {
  // Use the internal parser entrypoint to avoid pdf-parse debug mode in bundled runtimes.
  const pdfParseModule: any = await import('pdf-parse/lib/pdf-parse.js');
  const pdfParse = (pdfParseModule.default || pdfParseModule) as (
    data: Buffer,
    options?: Record<string, unknown>,
  ) => Promise<{ text: string }>;

  const parsedDefault = await pdfParse(buffer);
  let extractedText = parsedDefault?.text || '';

  if (!normalizeText(extractedText)) {
    const parsedFallback = await pdfParse(buffer, {
      pagerender: async (pageData: any) => {
        const textContent = await pageData.getTextContent({
          normalizeWhitespace: true,
          disableCombineTextItems: false,
        });
        return textContent.items
          .map((item: { str?: string }) => item?.str || '')
          .join(' ')
          .trim();
      },
    });
    extractedText = parsedFallback?.text || '';
  }

  if (!normalizeText(extractedText)) {
    throw new Error(
      'No se pudo extraer texto del PDF. Parece escaneado o sin texto seleccionable. Probá con un PDF con texto o importá el contenido en Excel/CSV.',
    );
  }

  const chunks = splitTextIntoChunks(extractedText);
  const base = fileTitleBase(fileName);

  return chunks.map((chunk, idx) => ({
    title: `${base}${chunks.length > 1 ? ` (parte ${idx + 1})` : ''}`,
    content: chunk,
  }));
}

export async function parseKnowledgeFile(file: File): Promise<ParsedEntry[]> {
  const ext = file.name.toLowerCase().split('.').pop() || '';
  const buffer = Buffer.from(await file.arrayBuffer());

  if (ext === 'pdf') {
    return parsePdfEntries(buffer, file.name);
  }

  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
    return parseExcelEntries(buffer, file.name);
  }

  throw new Error('Formato no soportado. Subí un PDF o Excel (.xlsx/.xls/.csv).');
}

export async function parseKnowledgeFromUrl(rawUrl: string): Promise<ParsedEntry[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let response: Response;
  try {
    response = await fetch(rawUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'ChatPlatformKnowledgeImporter/1.0',
      },
      cache: 'no-store',
    });
  } catch {
    throw new Error('No se pudo acceder a la URL indicada.');
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`La URL respondió con estado ${response.status}.`);
  }

  const contentType = response.headers.get('content-type') || '';
  const isTextResponse =
    contentType.includes('text/html') ||
    contentType.includes('text/plain') ||
    contentType.includes('application/xhtml+xml');
  if (!isTextResponse) {
    throw new Error('La URL no devuelve contenido de texto compatible.');
  }

  const rawBody = await response.text();
  const limitedBody = rawBody.slice(0, 1_200_000);

  let title = '';
  let text = limitedBody;
  if (contentType.includes('text/html') || contentType.includes('application/xhtml+xml')) {
    const extracted = extractTextFromHtml(limitedBody);
    title = extracted.title;
    text = extracted.text;
  }

  const chunks = splitTextIntoChunks(text);
  if (chunks.length === 0) {
    throw new Error('No se encontró contenido útil para importar desde la URL.');
  }

  const base = title || safeUrlTitle(rawUrl);
  return chunks.map((chunk, idx) => ({
    title: `${base}${chunks.length > 1 ? ` (parte ${idx + 1})` : ''}`,
    content: chunk,
  }));
}

export function capKnowledgeEntries(entries: ParsedEntry[]): ParsedEntry[] {
  const limited: ParsedEntry[] = [];
  let total = 0;

  for (const entry of entries.slice(0, MAX_ENTRIES)) {
    if (total >= MAX_TOTAL_CHARS) break;

    const available = MAX_TOTAL_CHARS - total;
    const nextContent = entry.content.slice(0, available);
    if (!nextContent.trim()) break;

    limited.push({
      title: entry.title,
      content: nextContent,
    });
    total += nextContent.length;
  }

  return limited;
}
