const WHATSAPP_MAX_LENGTH = 4000;

export function removeOpeningSigns(text: string): string {
  return text.replace(/¿/g, '').replace(/¡/g, '');
}

export function splitMessage(text: string): string[] {
  if (text.length <= WHATSAPP_MAX_LENGTH) return [text];

  const paragraphs = text.split(/\n\n+/);
  const parts: string[] = [];
  let current = '';

  for (const paragraph of paragraphs) {
    if (current && (current + '\n\n' + paragraph).length > WHATSAPP_MAX_LENGTH) {
      parts.push(current.trim());
      current = paragraph;
    } else {
      current = current ? current + '\n\n' + paragraph : paragraph;
    }
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  if (parts.length === 0) parts.push(text);

  return parts;
}

interface TransformOptions {
  removeOpeningSigns: boolean;
  splitLongMessages: boolean;
}

export function transformReply(text: string, options: TransformOptions): string[] {
  let processed = text;

  if (options.removeOpeningSigns) {
    processed = removeOpeningSigns(processed);
  }

  if (options.splitLongMessages) {
    return splitMessage(processed);
  }

  return [processed];
}
