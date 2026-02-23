import { PrismaClient } from '../../node_modules/.prisma/ai-bot-client/index.js';

const SOFT_DELETE_MODELS = new Set([
  'Tenant', 'TenantUser', 'ConversationLink', 'TenantChannel',
  'KnowledgeEntry', 'WhatsAppTemplate',
]);

function createClient() {
  return new PrismaClient().$extends({
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (SOFT_DELETE_MODELS.has(model)) {
            args.where = { deletedAt: null, ...args.where };
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (SOFT_DELETE_MODELS.has(model)) {
            args.where = { deletedAt: null, ...args.where };
          }
          return query(args);
        },
        async count({ model, args, query }) {
          if (SOFT_DELETE_MODELS.has(model)) {
            args.where = { deletedAt: null, ...args.where };
          }
          return query(args);
        },
      },
    },
  });
}

export const prisma = createClient();
