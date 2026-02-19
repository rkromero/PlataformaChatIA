import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino/file', options: { destination: 1 } }
      : undefined,
  redact: ['*.accessToken', '*.access_token', '*.password', '*.token'],
});

export function tenantLogger(tenantId: string) {
  return logger.child({ tenantId });
}
