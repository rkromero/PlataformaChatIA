import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionContentPart } from 'openai/resources/chat/completions';
import { env } from '../lib/env.js';

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function generateReply(
  model: string,
  systemPrompt: string,
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  imageUrls: string[] = [],
): Promise<string> {
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
  ];

  for (const msg of conversationHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  const isAlreadyInHistory = conversationHistory.some(
    (m) => m.role === 'user' && m.content === userMessage,
  );

  if (imageUrls.length > 0) {
    const parts: ChatCompletionContentPart[] = [];

    if (userMessage && !isAlreadyInHistory) {
      parts.push({ type: 'text', text: userMessage });
    } else if (!userMessage) {
      parts.push({ type: 'text', text: 'El cliente envió esta imagen. Describila y respondé según el contexto de la conversación.' });
    }

    for (const url of imageUrls) {
      parts.push({
        type: 'image_url',
        image_url: { url, detail: 'low' },
      });
    }

    messages.push({ role: 'user', content: parts });
  } else if (!isAlreadyInHistory) {
    messages.push({ role: 'user', content: userMessage });
  }

  const visionModel = resolveVisionModel(model);

  const response = await client.chat.completions.create({
    model: visionModel,
    messages,
    max_tokens: 400,
  });

  return response.choices[0]?.message?.content ?? 'Lo siento, no pude generar una respuesta.';
}

function resolveVisionModel(model: string): string {
  const visionCapable = [
    'gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano',
    'gpt-4-turbo', 'gpt-4-vision-preview',
  ];

  if (visionCapable.some((m) => model.startsWith(m))) return model;
  return 'gpt-4.1-mini';
}
