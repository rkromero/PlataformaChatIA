import { cache } from 'react';
import { prisma } from './db';

export const getCachedTenant = cache(async (tenantId: string) => {
  return prisma.tenant.findUnique({ where: { id: tenantId } });
});

export const getCachedCalendarConfig = cache(async (tenantId: string) => {
  return prisma.calendarConfig.findUnique({ where: { tenantId } });
});

export const getCachedAiSettings = cache(async (tenantId: string) => {
  return prisma.aiSettings.findUnique({ where: { tenantId } });
});

export const getCachedPlanLimits = cache(async (tenantId: string) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });
  return tenant?.plan ?? 'trial';
});
