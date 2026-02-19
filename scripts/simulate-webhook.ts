/**
 * Simula un webhook de Chatwoot para testear el ai-bot.
 *
 * Uso:
 *   npx tsx scripts/simulate-webhook.ts
 *
 * Variables de entorno necesarias:
 *   AI_BOT_URL (default: http://localhost:3001)
 *   CHATWOOT_WEBHOOK_SECRET
 */

const AI_BOT_URL = process.env.AI_BOT_URL ?? 'http://localhost:3001';
const SECRET = process.env.CHATWOOT_WEBHOOK_SECRET ?? 'test-secret';

const payload = {
  event: 'message_created',
  message_type: 'incoming',
  content: process.argv[2] ?? 'Hola, necesito información sobre sus servicios',
  account: { id: 1 },
  inbox: { id: 1 },
  conversation: {
    id: 101,
    labels: [],
    meta: {
      assignee: null,
      sender: {
        id: 5001,
        name: 'Juan Pérez',
        phone_number: '+5491155551234',
      },
    },
    contact: {
      id: 5001,
      name: 'Juan Pérez',
      phone_number: '+5491155551234',
    },
  },
  sender: { type: 'contact', id: 5001 },
};

async function main() {
  console.log(`Sending webhook to ${AI_BOT_URL}/webhooks/chatwoot`);
  console.log('Payload:', JSON.stringify(payload, null, 2));

  const res = await fetch(`${AI_BOT_URL}/webhooks/chatwoot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': SECRET,
    },
    body: JSON.stringify(payload),
  });

  console.log(`Response: ${res.status}`);
  const body = await res.json();
  console.log('Body:', body);
}

main().catch(console.error);
