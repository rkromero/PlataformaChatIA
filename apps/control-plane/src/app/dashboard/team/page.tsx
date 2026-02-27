import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getPlanLimits } from '@chat-platform/shared/plans';
import { InviteForm } from './invite-form';
import { RemoveButton } from './remove-button';

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  super_admin: { label: 'Super Admin', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  owner: { label: 'Owner', color: 'text-brand-400', bg: 'bg-brand-500/10' },
  admin: { label: 'Admin', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  agent: { label: 'Agente', color: 'text-gray-400', bg: 'bg-white/5' },
};

const AVATAR_COLORS = [
  'bg-brand-600 text-white',
  'bg-indigo-600 text-white',
  'bg-emerald-600 text-white',
  'bg-amber-600 text-white',
  'bg-pink-600 text-white',
  'bg-cyan-600 text-white',
];

export default async function TeamPage() {
  const session = await requireSession();

  const members = await prisma.tenantUser.findMany({
    where: { tenantId: session.tenantId, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { plan: true },
  });

  const limits = getPlanLimits(tenant?.plan ?? 'starter');
  const isOwner = session.role === 'owner' || session.role === 'super_admin';
  const maxUsers = limits.maxUsers === -1 ? Infinity : limits.maxUsers;
  const usagePercent = maxUsers === Infinity ? 0 : Math.round((members.length / maxUsers) * 100);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Equipo</h1>
          <p className="mt-1 text-sm text-gray-400">
            Gestioná los miembros de tu equipo y sus roles
          </p>
        </div>

        {/* Usage indicator */}
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-surface-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-gray-100">
                {members.length}
                <span className="font-normal text-gray-400"> / {maxUsers === Infinity ? '∞' : maxUsers}</span>
              </p>
              <p className="text-[10px] text-gray-400">miembros</p>
            </div>
          </div>
          {maxUsers !== Infinity && (
            <div className="h-8 w-px bg-white/10" />
          )}
          {maxUsers !== Infinity && (
            <div className="w-20">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-amber-500' : 'bg-brand-600'
                  }`}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
              <p className="mt-0.5 text-center text-[10px] text-gray-400">{usagePercent}%</p>
            </div>
          )}
        </div>
      </div>

      {/* Invite form */}
      {isOwner && <InviteForm />}

      {/* Members list */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Miembros ({members.length})
        </h2>
        <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-surface-2">
          {members.map((m, idx) => {
            const role = ROLE_CONFIG[m.role] ?? ROLE_CONFIG.agent;
            const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            const initial = (m.name || m.email)[0].toUpperCase();
            const isCurrentUser = m.id === session.userId;

            return (
              <div
                key={m.id}
                className={`flex items-center justify-between px-4 py-3.5 transition-colors duration-150 ${
                  idx > 0 ? 'border-t border-white/[0.04]' : ''
                } ${isCurrentUser ? 'bg-brand-500/5' : 'hover:bg-white/[0.03]'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${avatarColor}`}>
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-gray-100">
                        {m.name || m.email}
                      </p>
                      {isCurrentUser && (
                        <span className="rounded-md bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-400">
                          Vos
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {m.name && (
                        <span className="truncate text-xs text-gray-400">{m.email}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${role.bg} ${role.color}`}>
                    {role.label}
                  </span>
                  {isOwner && !isCurrentUser && m.role !== 'owner' && (
                    <RemoveButton userId={m.id} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
