# Chat Platform — SaaS Multi-tenant (Chatwoot + AI Bot)

Plataforma multi-tenant para atención por WhatsApp con IA, handoff humano y sincronización a CRM.

## Arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│                     Railway Project                          │
│                                                              │
│  ┌──────────────┐   webhook    ┌──────────────┐             │
│  │   Chatwoot   │ ──────────▶  │   AI Bot     │             │
│  │  (app)       │ ◀────────── │  (Fastify)    │             │
│  │              │  API reply   │              │             │
│  └──────┬───────┘              └──────┬───────┘             │
│         │                             │                      │
│  ┌──────┴───────┐              ┌──────┴───────┐             │
│  │  Postgres    │              │  OpenAI API  │             │
│  │  (Chatwoot)  │              │  CRM API     │             │
│  └──────────────┘              └──────────────┘             │
│                                       │                      │
│  ┌──────────────┐              ┌──────┴───────┐             │
│  │ Control      │◀─── DB ────▶│  Postgres    │             │
│  │ Plane (Next) │   (Prisma)  │ (Control)    │             │
│  └──────────────┘              └──────────────┘             │
└──────────────────────────────────────────────────────────────┘
```

## Estructura del monorepo

```
/
├── apps/
│   ├── control-plane/    # Next.js (panel SaaS)
│   └── ai-bot/           # Fastify (webhook + AI)
├── packages/
│   └── shared/           # Types, crypto, env schemas
├── scripts/              # Helpers (simulate webhook, gen key)
├── docs/                 # Documentación adicional
└── pnpm-workspace.yaml
```

## Stack

| Componente | Tecnología |
|---|---|
| Control-plane | Next.js 15, App Router, TypeScript, Tailwind, Prisma |
| AI Bot | Fastify, TypeScript, OpenAI SDK, Prisma (read) |
| DB | PostgreSQL (2 instancias separadas) |
| Auth | JWT + httpOnly cookies (jose) |
| Cifrado | AES-256-GCM (config channels) |
| Validación | Zod |
| Monorepo | pnpm workspaces |

## Variables de entorno

### Control-plane

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `ENCRYPTION_KEY` | 32 bytes en base64 (para AES-256-GCM) |
| `AUTH_SECRET` | Mínimo 32 chars para firmar JWT |
| `BASE_URL` | URL pública del control-plane |

### AI Bot

| Variable | Descripción |
|---|---|
| `PORT` | Puerto (default 3001) |
| `CHATWOOT_WEBHOOK_SECRET` | Secret compartido con Chatwoot |
| `CHATWOOT_BASE_URL` | URL de tu instancia Chatwoot |
| `CHATWOOT_API_TOKEN` | Token admin de Chatwoot |
| `OPENAI_API_KEY` | API key de OpenAI |
| `CRM_BASE_URL` | URL del CRM (opcional) |
| `CRM_API_KEY` | API key del CRM (opcional) |
| `CONTROL_PLANE_DB_URL` | Connection string al Postgres del control-plane |

## Setup local

```bash
# 1. Instalar dependencias
pnpm install

# 2. Generar ENCRYPTION_KEY
npx tsx scripts/generate-encryption-key.ts

# 3. Copiar y configurar variables
cp .env.example .env
# Editar .env con tus valores

# 4. Build del shared package
pnpm --filter @chat-platform/shared build

# 5. Generar Prisma client + migrar DB
cd apps/control-plane
cp ../../.env .env
npx prisma db push
npx prisma generate
cd ../..

# 6. Seed de datos demo
pnpm db:seed

# 7. Generar Prisma client del ai-bot
cd apps/ai-bot
cp ../../.env .env
npx prisma generate
cd ../..

# 8. Dev
pnpm dev
```

## Deploy en Railway

### Paso 1: Crear proyecto

En Railway, crear un nuevo proyecto llamado `chat-platform`.

### Paso 2: Servicios de base de datos

1. **postgres_control_plane**: Agregar Postgres. Copiar la `DATABASE_URL`.
2. **redis_chatwoot**: Agregar Redis (para Chatwoot).
3. **postgres_chatwoot**: Agregar otro Postgres (para Chatwoot).

### Paso 3: Deploy Chatwoot

Deployar Chatwoot como servicio usando su imagen Docker oficial.
Configurar las variables de entorno apuntando a `postgres_chatwoot` y `redis_chatwoot`.

### Paso 4: Deploy control-plane

1. Conectar el repo de GitHub.
2. Root directory: `apps/control-plane`
3. Build command: `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @chat-platform/shared build && pnpm --filter @chat-platform/control-plane build`
4. Start command: `cd apps/control-plane && npx prisma migrate deploy && node .next/standalone/apps/control-plane/server.js`
5. Variables de entorno:
   - `DATABASE_URL` → referencia al postgres_control_plane
   - `ENCRYPTION_KEY`, `AUTH_SECRET`, `BASE_URL`

### Paso 5: Deploy ai-bot

1. Conectar el mismo repo.
2. Root directory: `apps/ai-bot`
3. Build command: `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @chat-platform/shared build && pnpm --filter @chat-platform/ai-bot build`
4. Start command: `node apps/ai-bot/dist/index.js`
5. Variables de entorno:
   - `CONTROL_PLANE_DB_URL` → referencia al postgres_control_plane
   - `CHATWOOT_*`, `OPENAI_API_KEY`, `CRM_*`

### Paso 6: Configurar Chatwoot webhook

En Chatwoot → Settings → Integrations → Webhooks:
- URL: `https://<ai-bot-url>/webhooks/chatwoot`
- Secret: valor de `CHATWOOT_WEBHOOK_SECRET`

## Probar end-to-end

1. Crear tenant en el control-plane con el `chatwoot_account_id` correcto.
2. Configurar AI Settings (prompt, keywords).
3. Crear channel con el `chatwoot_inbox_id`.
4. Enviar mensaje a WhatsApp → Chatwoot recibe → webhook al bot → IA responde.
5. Si el usuario dice "quiero hablar con un humano" → handoff.

### Test con mock webhook

```bash
# Mensaje normal
CHATWOOT_WEBHOOK_SECRET=test-secret npx tsx scripts/simulate-webhook.ts "Hola, quiero más información"

# Trigger handoff
CHATWOOT_WEBHOOK_SECRET=test-secret npx tsx scripts/simulate-webhook.ts "Quiero hablar con un humano"
```

## Health checks

- Control-plane: `GET /api/health`
- AI Bot: `GET /health`

## Multi-tenant

- Todo dato lleva `tenant_id`.
- El bot resuelve el tenant por `chatwoot_account_id` o `chatwoot_inbox_id`.
- Channels se guardan con cifrado AES-256-GCM.
- Cada tenant tiene su propio system prompt y reglas de handoff.

## Seed demo

El seed crea:
- **Tenant**: "Demo Company" (chatwoot_account_id: 1, plan: pro)
- **User**: admin@demo.com / admin123 (role: owner)
- **AI Settings**: prompt en español, keywords de handoff
