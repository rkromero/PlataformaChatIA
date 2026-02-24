import * as XLSX from 'xlsx';

const MAX_CHUNK_CHARS = 4500;
const MAX_ENTRIES = 25;
const MAX_TOTAL_CHARS = 60_000;

interface ParsedEntry {
  title: string;
  content: string;
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
  const pdfParseModule: any = await import('pdf-parse');
  const Parser = pdfParseModule.PDFParse as
    | (new (options: { data: Buffer }) => {
        getText: () => Promise<{ text: string }>;
        destroy: () => Promise<void>;
      })
    | undefined;

  if (!Parser) {
    throw new Error('No se pudo inicializar el parser de PDF');
  }

  const parser = new Parser({ data: buffer });
  let parsed: { text: string };
  try {
    parsed = await parser.getText();
  } finally {
    await parser.destroy().catch(() => {});
  }
  const chunks = splitTextIntoChunks(parsed.text || '');
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
