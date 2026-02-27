import OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionContentPart,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';
import { env } from '../lib/env.js';

const client = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  timeout: 30_000,
  maxRetries: 2,
});

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface GenerateReplyResult {
  text: string;
  toolCalls: ToolCall[];
}

export async function generateReply(
  model: string,
  systemPrompt: string,
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  imageUrls: string[] = [],
  tools?: ChatCompletionTool[],
): Promise<GenerateReplyResult> {
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
    ...(tools && tools.length > 0 ? { tools, tool_choice: 'auto' } : {}),
  });

  const choice = response.choices[0];
  if (!choice) {
    return { text: 'Lo siento, no pude generar una respuesta.', toolCalls: [] };
  }

  const toolCallsRaw = choice.message?.tool_calls ?? [];
  const parsedToolCalls: ToolCall[] = toolCallsRaw.map((tc) => ({
    id: tc.id,
    name: tc.function.name,
    arguments: JSON.parse(tc.function.arguments || '{}'),
  }));

  if (parsedToolCalls.length > 0) {
    return { text: '', toolCalls: parsedToolCalls };
  }

  return {
    text: choice.message?.content ?? 'Lo siento, no pude generar una respuesta.',
    toolCalls: [],
  };
}

export async function generateReplyWithToolResults(
  model: string,
  systemPrompt: string,
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  toolCalls: ToolCall[],
  toolResults: Array<{ tool_call_id: string; content: string }>,
  tools: ChatCompletionTool[],
): Promise<GenerateReplyResult> {
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
  ];

  for (const msg of conversationHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  const isAlreadyInHistory = conversationHistory.some(
    (m) => m.role === 'user' && m.content === userMessage,
  );

  if (!isAlreadyInHistory) {
    messages.push({ role: 'user', content: userMessage });
  }

  messages.push({
    role: 'assistant',
    tool_calls: toolCalls.map((tc) => ({
      id: tc.id,
      type: 'function' as const,
      function: {
        name: tc.name,
        arguments: JSON.stringify(tc.arguments),
      },
    })),
  });

  for (const tr of toolResults) {
    messages.push({
      role: 'tool',
      tool_call_id: tr.tool_call_id,
      content: tr.content,
    });
  }

  const visionModel = resolveVisionModel(model);

  const response = await client.chat.completions.create({
    model: visionModel,
    messages,
    max_tokens: 400,
    tools,
    tool_choice: 'auto',
  });

  const choice = response.choices[0];
  if (!choice) {
    return { text: 'Lo siento, no pude generar una respuesta.', toolCalls: [] };
  }

  const newToolCalls = (choice.message?.tool_calls ?? []).map((tc) => ({
    id: tc.id,
    name: tc.function.name,
    arguments: JSON.parse(tc.function.arguments || '{}'),
  }));

  if (newToolCalls.length > 0) {
    return { text: '', toolCalls: newToolCalls };
  }

  return {
    text: choice.message?.content ?? 'Lo siento, no pude generar una respuesta.',
    toolCalls: [],
  };
}

function resolveVisionModel(model: string): string {
  const visionCapable = [
    'gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano',
    'gpt-4-turbo', 'gpt-4-vision-preview',
  ];

  if (visionCapable.some((m) => model.startsWith(m))) return model;
  return 'gpt-4.1-mini';
}
