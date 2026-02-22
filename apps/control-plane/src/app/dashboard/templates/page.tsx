import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getBodyText } from '@/lib/meta-templates';
import Link from 'next/link';
import { SyncButton } from './sync-button';
import { TemplateActions } from './template-actions';

const STATUS_STYLES: Record<string, string> = {
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
};

const STATUS_LABELS: Record<string, string> = {
  APPROVED: 'Aprobada',
  PENDING: 'Pendiente',
  REJECTED: 'Rechazada',
};

const CATEGORY_LABELS: Record<string, string> = {
  UTILITY: 'Utilidad',
  MARKETING: 'Marketing',
  AUTHENTICATION: 'Autenticación',
};

export default async function TemplatesPage() {
  const session = await requireSession();

  const templates = await prisma.whatsAppTemplate.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { updatedAt: 'desc' },
  });

  const hasChannel = await prisma.tenantChannel.count({
    where: { tenantId: session.tenantId, type: 'whatsapp' },
  });

  const approved = templates.filter((t) => t.status === 'APPROVED').length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Plantillas WhatsApp</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {templates.length} plantilla{templates.length !== 1 ? 's' : ''} — {approved} aprobada{approved !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SyncButton disabled={!hasChannel} />
          <Link href="/dashboard/templates/new" className="btn-primary flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nueva plantilla
          </Link>
        </div>
      </div>

      {!hasChannel && (
        <div className="mb-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
          Necesitás conectar un canal WhatsApp primero para sincronizar y enviar plantillas.
          <Link href="/dashboard/channels/connect-whatsapp" className="ml-1 font-medium underline">Conectar ahora</Link>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
            <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Sin plantillas</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Sincronizá tus plantillas de Meta o creá una nueva.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((tpl) => {
            const body = getBodyText(tpl.components as unknown[]);
            return (
              <div key={tpl.id} className="card flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{tpl.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[tpl.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_LABELS[tpl.status] ?? tpl.status}
                    </span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-800">
                      {CATEGORY_LABELS[tpl.category] ?? tpl.category}
                    </span>
                    <span className="text-[10px] text-gray-400">{tpl.language}</span>
                  </div>
                  {body && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{body}</p>
                  )}
                </div>
                <TemplateActions templateId={tpl.id} />
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
        <h3 className="text-sm font-semibold">¿Cómo funcionan las plantillas?</h3>
        <ul className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
          <li>• Si el cliente escribió en las últimas <strong>24 horas</strong>, el bot responde libre.</li>
          <li>• Después de 24h, solo podés enviar <strong>plantillas aprobadas</strong> por Meta.</li>
          <li>• Las plantillas pueden tener variables como <code>{'{{1}}'}</code>, <code>{'{{2}}'}</code> que completás al enviar.</li>
          <li>• Meta tarda entre minutos y 24h en aprobar una plantilla nueva.</li>
          <li>• Usá <strong>"Sincronizar"</strong> para traer las plantillas que ya tenés en tu cuenta de Meta.</li>
        </ul>
      </div>
    </div>
  );
}
