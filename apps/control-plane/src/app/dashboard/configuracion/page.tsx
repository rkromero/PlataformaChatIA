import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  owner: 'Owner',
  admin: 'Admin',
  agent: 'Agente',
};

function formatDate(value: Date | null | undefined) {
  if (!value) return 'N/D';
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

export default async function ConfiguracionPage() {
  const session = await requireSession();

  const [tenant, owner] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: {
        id: true,
        name: true,
        status: true,
        plan: true,
        onboardingCompleted: true,
        createdAt: true,
        updatedAt: true,
        trialEndsAt: true,
        aiSettings: {
          select: {
            enabled: true,
            model: true,
            updatedAt: true,
          },
        },
      },
    }),
    prisma.tenantUser.findFirst({
      where: { tenantId: session.tenantId, role: 'owner', deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { name: true, email: true },
    }),
  ]);

  const negocio = tenant?.name?.trim() || 'ChatPlatform';
  const ownerName = owner?.name?.trim() || owner?.email || 'No definido';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Datos principales de tu negocio, owner y estado de configuración.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="card">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Información del negocio</h2>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Nombre del negocio</dt>
              <dd className="text-sm font-medium">{negocio}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Owner</dt>
              <dd className="text-sm font-medium">{ownerName}</dd>
              <dd className="text-xs text-gray-500 dark:text-gray-400">{owner?.email || 'Sin email definido'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Mi sesión</dt>
              <dd className="text-sm font-medium">{session.email}</dd>
              <dd className="text-xs text-gray-500 dark:text-gray-400">{ROLE_LABELS[session.role] ?? session.role}</dd>
            </div>
          </dl>
        </section>

        <section className="card">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Datos de configuración</h2>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Tenant ID</dt>
              <dd className="text-sm font-mono">{tenant?.id || session.tenantId}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Plan</dt>
              <dd className="text-sm font-medium capitalize">{tenant?.plan || 'N/D'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Estado</dt>
              <dd className="text-sm font-medium capitalize">{tenant?.status || 'N/D'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Onboarding</dt>
              <dd className="text-sm font-medium">{tenant?.onboardingCompleted ? 'Completado' : 'Pendiente'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">IA habilitada</dt>
              <dd className="text-sm font-medium">{tenant?.aiSettings?.enabled ? 'Sí' : 'No'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Modelo IA</dt>
              <dd className="text-sm font-medium">{tenant?.aiSettings?.model || 'N/D'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Fin de trial</dt>
              <dd className="text-sm font-medium">{formatDate(tenant?.trialEndsAt)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Última actualización</dt>
              <dd className="text-sm font-medium">
                {formatDate(tenant?.aiSettings?.updatedAt || tenant?.updatedAt)}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
        Si querés cambiar reglas de IA y horarios, podés hacerlo desde <span className="font-medium">Mi Bot</span>.
      </p>
    </div>
  );
}
