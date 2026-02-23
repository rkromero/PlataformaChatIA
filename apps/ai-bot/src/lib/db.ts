import { PrismaClient } from '../../node_modules/.prisma/ai-bot-client/index.js';

const SOFT_DELETE_MODELS = new Set([
  'Tenant', 'TenantUser', 'ConversationLink', 'TenantChannel',
  'KnowledgeEntry', 'WhatsAppTemplate',
]);

function addSoftDeleteFilter(model: string, args: Record<string, unknown>) {
  if (SOFT_DELETE_MODELS.has(model)) {
    const where = (args.where ?? {}) as Record<string, unknown>;
    args.where = { deletedAt: null, ...where };
  }
  return args;
}

const basePrisma = new PrismaClient();

export const prisma: PrismaClient = basePrisma.$extends({
  query: {
    $allModels: {
      async findMany({ model, args, query }) {
        return query(addSoftDeleteFilter(model, args));
      },
      async findFirst({ model, args, query }) {
        return query(addSoftDeleteFilter(model, args));
      },
      async count({ model, args, query }) {
        return query(addSoftDeleteFilter(model, args));
      },
    },
  },
}) as unknown as PrismaClient;
