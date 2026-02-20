import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { chatwootAccountId: 1 },
    update: {},
    create: {
      name: 'Demo Company',
      status: 'active',
      plan: 'pro',
      chatwootAccountId: 1,
    },
  });

  console.log('Tenant created:', tenant.id);

  await prisma.aiSettings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      enabled: true,
      model: 'gpt-4.1-mini',
      systemPrompt:
        'Eres un asistente de atención al cliente de Demo Company. Responde de forma breve, amable y profesional en español. Haz una sola pregunta por mensaje.',
      handoffRulesJson: {
        keywords: ['humano', 'asesor', 'agente', 'persona', 'hablar con alguien'],
        handoffTag: 'human_handoff',
      },
    },
  });

  console.log('AI settings created for tenant:', tenant.id);

  const passwordHash = await bcrypt.hash('admin123', 12);

  await prisma.tenantUser.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: 'admin@demo.com' },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@demo.com',
      passwordHash,
      role: 'super_admin',
    },
  });

  console.log('User created: admin@demo.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
