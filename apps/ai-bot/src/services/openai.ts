import OpenAI from 'openai';
import { env } from '../lib/env.js';

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function generateReply(
  model: string,
  systemPrompt: string,
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
): Promise<string> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  for (const msg of conversationHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  if (!conversationHistory.some((m) => m.role === 'user' && m.content === userMessage)) {
    messages.push({ role: 'user', content: userMessage });
  }

  const response = await client.chat.completions.create({
    model,
    messages,
    max_tokens: 300,
  });

  return response.choices[0]?.message?.content ?? 'Lo siento, no pude generar una respuesta.';
}
