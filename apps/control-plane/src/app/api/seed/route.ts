import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
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
        role: 'owner',
      },
    });

    return NextResponse.json({
      ok: true,
      message: 'Seed completed: admin@demo.com / admin123',
      tenantId: tenant.id,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 },
    );
  }
}
