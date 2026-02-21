import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getPlanLimits } from '@chat-platform/shared/plans';
import { InviteForm } from './invite-form';
import { RemoveButton } from './remove-button';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  owner: 'Owner',
  admin: 'Admin',
  agent: 'Agente',
};

export default async function TeamPage() {
  const session = await requireSession();

  const members = await prisma.tenantUser.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, role: true, emailVerified: true, createdAt: true },
  });

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { plan: true },
  });

  const limits = getPlanLimits(tenant?.plan ?? 'starter');
  const isOwner = session.role === 'owner' || session.role === 'super_admin';

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Equipo</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {members.length} miembro{members.length !== 1 ? 's' : ''} — Máx: {limits.maxUsers === -1 ? '∞' : limits.maxUsers}
          </p>
        </div>
      </div>

      {isOwner && <InviteForm />}

      <div className="mt-6 space-y-2">
        {members.map((m) => (
          <div key={m.id} className="card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                {m.email[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{m.email}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{ROLE_LABELS[m.role] ?? m.role}</span>
                  {m.emailVerified ? (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">Verificado</span>
                  ) : (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">Sin verificar</span>
                  )}
                </div>
              </div>
            </div>
            {isOwner && m.id !== session.userId && m.role !== 'owner' && (
              <RemoveButton userId={m.id} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
