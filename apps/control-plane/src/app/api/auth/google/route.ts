import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/auth';
import {
    createChatwootAccount,
    createChatwootUser,
    linkUserToAccount,
} from '@/lib/chatwoot-platform';
import crypto from 'crypto';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60);
}

export async function POST(req: NextRequest) {
    try {
        const { idToken } = await req.json();

        if (!idToken) {
            return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
        }

        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return NextResponse.json({ error: 'Invalid token payload' }, { status: 400 });
        }

        const { sub: googleId, email, name, picture } = payload;

        // 1. Check if user exists by googleId or email
        let user = await prisma.tenantUser.findFirst({
            where: {
                OR: [
                    { googleId },
                    { email },
                ],
            },
        });

        if (user) {
            // Update googleId if it was missing
            if (!user.googleId) {
                user = await prisma.tenantUser.update({
                    where: { id: user.id },
                    data: { googleId },
                });
            }

            await createSession({
                userId: user.id,
                tenantId: user.tenantId,
                email: user.email,
                role: user.role,
            });

            return NextResponse.json({ success: true });
        }

        // 2. User doesn't exist, create account (Frictionless flow)
        const businessName = name || email.split('@')[0];
        let baseSlug = generateSlug(businessName);
        let slug = baseSlug;
        let attempt = 0;
        while (await prisma.tenant.findUnique({ where: { slug } })) {
            attempt++;
            slug = `${baseSlug}-${attempt}`;
        }

        // Chatwoot Setup (Optional but following registerAction pattern)
        let chatwootAccountId: number | null = null;
        try {
            const account = await createChatwootAccount(businessName);
            chatwootAccountId = account.id;

            // For social login, we generate a random password for the Chatwoot user
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const cwUser = await createChatwootUser(email, businessName, randomPassword);
            await linkUserToAccount(chatwootAccountId, cwUser.id);
        } catch (err) {
            console.error('Chatwoot Platform API error (non-blocking):', err);
        }

        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);

        const tenant = await prisma.tenant.create({
            data: {
                name: businessName,
                slug,
                status: 'active',
                plan: 'trial',
                trialEndsAt,
                chatwootAccountId,
            },
        });

        const newUser = await prisma.tenantUser.create({
            data: {
                tenantId: tenant.id,
                email,
                name: name || '',
                googleId,
                role: 'owner',
                emailVerified: true, // Google emails are already verified
            },
        });

        await prisma.aiSettings.create({
            data: {
                tenantId: tenant.id,
                enabled: true,
                model: 'gpt-4.1-mini',
                systemPrompt: `Eres el asistente virtual de ${businessName}. Tu rol es atender consultas de clientes por WhatsApp de forma amable, profesional y concisa.\n\nReglas estrictas:\n- Respondé siempre en español, con tono cercano pero profesional.\n- Hacé UNA sola pregunta por mensaje para no abrumar al cliente, pero no pongas preguntas en todos los mensajes\n- Si no tenés la información para responder algo (precios, horarios, disponibilidad, direcciones, datos técnicos), NO inventes. Decí: "No tengo esa información disponible ahora, pero te puedo conectar con alguien del equipo que te ayude. ¿Querés que lo haga?"\n- Si el cliente quiere comprar, reservar, o hacer algo que requiere intervención humana, ofrecé transferirlo.\n- Si el cliente saluda, respondé con un saludo breve y preguntá en qué podés ayudarlo.\n- Nunca menciones que sos una inteligencia artificial a menos que te lo pregunten directamente.\n- Mantené las respuestas cortas (2-3 oraciones máximo).`,
                handoffRulesJson: {
                    keywords: ['humano', 'asesor', 'agente', 'persona', 'hablar con alguien', 'queja', 'reclamo', 'encargado', 'supervisor', 'gerente'],
                    handoffTag: 'human_handoff',
                },
            },
        });

        await createSession({
            userId: newUser.id,
            tenantId: tenant.id,
            email: newUser.email,
            role: newUser.role,
        });

        return NextResponse.json({ success: true, isNewUser: true });

    } catch (error) {
        console.error('Google Login Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
