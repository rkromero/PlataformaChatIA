import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export const tenantSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones').optional().or(z.literal('')),
  status: z.enum(['active', 'paused']),
  plan: z.enum(['starter', 'pro', 'enterprise']),
  chatwootAccountId: z.coerce.number().int().positive('Debe ser un número positivo').optional().or(z.literal(0).transform(() => undefined)),
});

export const aiSettingsSchema = z.object({
  enabled: z.boolean(),
  model: z.string().min(1),
  systemPrompt: z.string().min(10, 'El prompt debe tener al menos 10 caracteres'),
  handoffKeywords: z.string().min(1, 'Agrega al menos una keyword'),
  handoffTag: z.string().min(1).default('human_handoff'),
});

export const channelSchema = z.object({
  type: z.enum(['whatsapp', 'webchat']),
  chatwootInboxId: z.coerce.number().int().positive(),
  phoneNumberId: z.string().min(1, 'Requerido'),
  wabaId: z.string().min(1, 'Requerido'),
  accessToken: z.string().min(1, 'Requerido'),
});

export const registerSchema = z.object({
  businessName: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'Mínimo 6 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type TenantInput = z.infer<typeof tenantSchema>;
export type AiSettingsInput = z.infer<typeof aiSettingsSchema>;
export type ChannelInput = z.infer<typeof channelSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
