import OpenAI, { toFile } from 'openai';
import { env } from '../lib/env.js';
import { logger } from '../lib/logger.js';
import { downloadMedia, getAudioExtension } from './media.js';

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function transcribeAudio(dataUrl: string): Promise<string | null> {
  try {
    const { buffer, contentType } = await downloadMedia(dataUrl);

    if (buffer.length > 25 * 1024 * 1024) {
      logger.warn({ size: buffer.length }, 'Audio file too large for Whisper (>25MB)');
      return null;
    }

    const ext = getAudioExtension(contentType);
    const file = await toFile(buffer, `audio.${ext}`);

    const transcription = await client.audio.transcriptions.create({
      model: 'whisper-1',
      file,
      language: 'es',
    });

    const text = transcription.text?.trim();
    if (!text) return null;

    logger.info({ chars: text.length }, 'Audio transcribed successfully');
    return text;
  } catch (err) {
    logger.error({ err }, 'Audio transcription failed');
    return null;
  }
}
