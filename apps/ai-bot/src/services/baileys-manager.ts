import makeWASocket, {
  DisconnectReason,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import { logger, tenantLogger } from '../lib/logger.js';
import { prisma } from '../lib/db.js';
import { usePostgresAuthState } from './baileys-store.js';
import { handleIncomingMessage } from './message-handler.js';

interface SessionInfo {
  socket: ReturnType<typeof makeWASocket>;
  qr: string | null;
  status: 'connecting' | 'qr' | 'connected' | 'disconnected';
  tenantId: string;
  lastActivity: number;
}

const MAX_SESSIONS = 100;
const sessions = new Map<string, SessionInfo>();

function mapStatus(internal: string): string {
  switch (internal) {
    case 'connected':
      return 'WORKING';
    case 'qr':
      return 'SCAN_QR_CODE';
    case 'connecting':
      return 'STARTING';
    default:
      return 'STOPPED';
  }
}

export async function createSession(
  tenantId: string,
): Promise<{ status: string; qr: string | null }> {
  const existing = sessions.get(tenantId);
  if (existing?.status === 'connected') {
    return { status: 'WORKING', qr: null };
  }

  if (existing?.socket) {
    try {
      existing.socket.end(undefined);
    } catch {}
    sessions.delete(tenantId);
  }

  return startSocket(tenantId);
}

async function startSocket(
  tenantId: string,
): Promise<{ status: string; qr: string | null }> {
  const log = tenantLogger(tenantId);
  const { state, saveCreds, clearState } =
    await usePostgresAuthState(tenantId);

  const silentLogger = logger.child({ module: 'baileys' });
  silentLogger.level = 'warn';

  const sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(
        state.keys,
        logger.child({ module: 'signal-store' }),
      ),
    },
    printQRInTerminal: false,
    logger: silentLogger as any,
    generateHighQualityLinkPreview: false,
    defaultQueryTimeoutMs: 60_000,
  });

  if (sessions.size >= MAX_SESSIONS) {
    let oldest: string | null = null;
    let oldestTime = Infinity;
    for (const [id, s] of sessions) {
      if (s.status !== 'connected' && s.lastActivity < oldestTime) {
        oldest = id;
        oldestTime = s.lastActivity;
      }
    }
    if (oldest) {
      const stale = sessions.get(oldest);
      try { stale?.socket.end(undefined); } catch {}
      sessions.delete(oldest);
      log.info({ evicted: oldest }, 'Evicted stale session to stay under limit');
    }
  }

  const sessionInfo: SessionInfo = {
    socket: sock,
    qr: null,
    status: 'connecting',
    tenantId,
    lastActivity: Date.now(),
  };
  sessions.set(tenantId, sessionInfo);

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        sessionInfo.qr = await QRCode.toDataURL(qr);
      } catch {
        sessionInfo.qr = null;
      }
      sessionInfo.status = 'qr';
      log.info('QR code generated, waiting for scan');
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      log.info({ statusCode }, 'Baileys connection closed');

      if (statusCode === DisconnectReason.loggedOut) {
        await clearState();
        sessions.delete(tenantId);
        log.info('Logged out — auth state cleared');
      } else {
        sessions.delete(tenantId);
        const delay =
          statusCode === DisconnectReason.restartRequired ? 1500 : 5000;
        setTimeout(() => {
          startSocket(tenantId).catch((err) =>
            log.error({ err }, 'Failed to reconnect Baileys session'),
          );
        }, delay);
      }
    }

    if (connection === 'open') {
      sessionInfo.qr = null;
      sessionInfo.status = 'connected';
      sessionInfo.lastActivity = Date.now();
      log.info('WhatsApp connected via Baileys');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages: msgs, type }) => {
    if (type !== 'notify') return;

    for (const msg of msgs) {
      if (msg.key.fromMe) continue;
      if (!msg.message || !msg.key.remoteJid) continue;
      if (msg.key.remoteJid === 'status@broadcast') continue;

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        '';

      if (!text) continue;

      const chatId = msg.key.remoteJid;
      const contactName = msg.pushName || null;
      const isReplyToMessage = Boolean(
        msg.message.extendedTextMessage?.contextInfo?.stanzaId,
      );
      sessionInfo.lastActivity = Date.now();
      try {
        await handleIncomingMessage({
          tenantId,
          chatId,
          messageText: text,
          contactName,
          isReplyToMessage,
          sendReply: async (replyText) => {
            await sock.sendMessage(chatId, { text: replyText });
          },
        });
      } catch (err) {
        log.error({ err, chatId }, 'Error handling incoming Baileys message');
      }
    }
  });

  await new Promise((r) => setTimeout(r, 4000));

  const info = sessions.get(tenantId);
  return {
    status: info ? mapStatus(info.status) : 'STARTING',
    qr: info?.qr || null,
  };
}

export function getSessionQr(tenantId: string): string | null {
  return sessions.get(tenantId)?.qr || null;
}

export function getSessionStatus(tenantId: string): string {
  const session = sessions.get(tenantId);
  if (!session) return 'STOPPED';
  return mapStatus(session.status);
}

export async function sendMessage(
  tenantId: string,
  chatId: string,
  text: string,
) {
  const session = sessions.get(tenantId);
  if (!session || session.status !== 'connected') {
    throw new Error('Session not connected');
  }
  await session.socket.sendMessage(chatId, { text });
}

export async function deleteSession(tenantId: string) {
  const session = sessions.get(tenantId);
  if (session?.socket) {
    try {
      await session.socket.logout();
    } catch {
      try {
        session.socket.end(undefined);
      } catch {}
    }
  }
  sessions.delete(tenantId);
  await prisma.baileysAuth.deleteMany({ where: { tenantId } });
}

export async function reconnectActiveSessions() {
  const channels = await prisma.tenantChannel.findMany({
    where: { type: 'whatsapp_qr' },
    include: { tenant: { select: { id: true, status: true } } },
  });

  for (const channel of channels) {
    if (channel.tenant.status !== 'active') continue;

    const hasAuth = await prisma.baileysAuth.findFirst({
      where: { tenantId: channel.tenantId, dataKey: 'creds' },
    });

    if (hasAuth) {
      logger.info(
        { tenantId: channel.tenantId },
        'Reconnecting Baileys session on startup',
      );
      startSocket(channel.tenantId).catch((err) =>
        logger.error(
          { err, tenantId: channel.tenantId },
          'Failed to reconnect on startup',
        ),
      );
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}
