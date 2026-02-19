import { aiBotEnvSchema } from '@chat-platform/shared/env';

function loadEnv() {
  const result = aiBotEnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.format());
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
