import { z } from 'zod';

const optionalString = z.preprocess(
  (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
  z.string().optional(),
);

export const controlPlaneEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  ENCRYPTION_KEY: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  BASE_URL: z.string().url().optional().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const aiBotEnvSchema = z.object({
  PORT: z.coerce.number().default(3001),
  CHATWOOT_WEBHOOK_SECRET: z.string().optional().default(''),
  CHATWOOT_BASE_URL: z.string().url(),
  CHATWOOT_API_TOKEN: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  CRM_BASE_URL: optionalString,
  CRM_API_KEY: optionalString,
  CONTROL_PLANE_DB_URL: z.string().url(),
  CONTROL_PLANE_URL: optionalString,
  INTERNAL_SECRET: optionalString,
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type ControlPlaneEnv = z.infer<typeof controlPlaneEnvSchema>;
export type AiBotEnv = z.infer<typeof aiBotEnvSchema>;
