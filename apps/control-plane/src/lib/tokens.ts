import crypto from 'crypto';
import { prisma } from '@/lib/db';
import type { TokenType } from '@prisma/client';

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createToken(
  email: string,
  type: TokenType,
  expiresInHours: number,
  payload?: Record<string, unknown>,
): Promise<string> {
  await prisma.token.deleteMany({ where: { email, type } });

  const token = generateToken();
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  await prisma.token.create({
    data: {
      email,
      type,
      token,
      expiresAt,
      payload: payload ? JSON.stringify(payload) : null,
    },
  });

  return token;
}

interface TokenResult {
  email: string;
  payload: Record<string, unknown> | null;
}

export async function verifyToken(
  token: string,
  type: TokenType,
): Promise<string | null> {
  const result = await verifyTokenFull(token, type);
  return result?.email ?? null;
}

export async function verifyTokenFull(
  token: string,
  type: TokenType,
): Promise<TokenResult | null> {
  const record = await prisma.token.findUnique({ where: { token } });

  if (!record || record.type !== type || record.expiresAt < new Date()) {
    return null;
  }

  await prisma.token.delete({ where: { id: record.id } });

  const payload = record.payload ? JSON.parse(record.payload) : null;
  return { email: record.email, payload };
}
