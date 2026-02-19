import OpenAI from 'openai';
import { env } from '../lib/env.js';

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function generateReply(
  model: string,
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  const response = await client.responses.create({
    model,
    instructions: systemPrompt,
    input: userMessage,
    max_output_tokens: 300,
  });

  return response.output_text ?? 'Lo siento, no pude generar una respuesta.';
}
