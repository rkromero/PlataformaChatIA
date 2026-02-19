import { PrismaClient } from '../../node_modules/.prisma/ai-bot-client/index.js';

type AiBotPrismaClient = InstanceType<typeof PrismaClient>;

export const prisma: AiBotPrismaClient = new PrismaClient();
