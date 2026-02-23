import { prisma } from '../lib/db.js';
import {
  initAuthCreds,
  BufferJSON,
  type AuthenticationCreds,
  type SignalDataTypeMap,
} from '@whiskeysockets/baileys';

export async function usePostgresAuthState(tenantId: string) {
  async function writeData(key: string, data: unknown) {
    const serialized = JSON.stringify(data, BufferJSON.replacer);
    await prisma.baileysAuth.upsert({
      where: { tenantId_dataKey: { tenantId, dataKey: key } },
      update: { dataVal: serialized },
      create: { tenantId, dataKey: key, dataVal: serialized },
    });
  }

  async function readData(key: string) {
    const row = await prisma.baileysAuth.findUnique({
      where: { tenantId_dataKey: { tenantId, dataKey: key } },
    });
    if (!row) return null;
    return JSON.parse(row.dataVal, BufferJSON.reviver);
  }

  async function removeData(key: string) {
    await prisma.baileysAuth.deleteMany({
      where: { tenantId, dataKey: key },
    });
  }

  const creds: AuthenticationCreds =
    (await readData('creds')) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async <T extends keyof SignalDataTypeMap>(
          type: T,
          ids: string[],
        ): Promise<{ [id: string]: SignalDataTypeMap[T] }> => {
          const result: { [id: string]: SignalDataTypeMap[T] } = {};
          for (const id of ids) {
            const data = await readData(`${type}-${id}`);
            if (data) result[id] = data;
          }
          return result;
        },
        set: async (
          data: {
            [T in keyof SignalDataTypeMap]?: {
              [id: string]: SignalDataTypeMap[T] | null;
            };
          },
        ) => {
          const tasks: Promise<void>[] = [];
          for (const [type, entries] of Object.entries(data)) {
            for (const [id, value] of Object.entries(entries || {})) {
              tasks.push(
                value
                  ? writeData(`${type}-${id}`, value)
                  : removeData(`${type}-${id}`),
              );
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: async () => {
      await writeData('creds', creds);
    },
    clearState: async () => {
      await prisma.baileysAuth.deleteMany({ where: { tenantId } });
    },
  };
}
