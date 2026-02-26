import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { EmptyState } from '@/components/empty-state';
import { DeleteChannelButton } from './delete-button';
import { getBodyText } from '@/lib/meta-templates';
import { TemplateSection } from './template-section';

export default async function ChannelsPage() {
  const session = await requireSession();

  const channels = await prisma.tenantChannel.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
  });

  const hasOfficialApi = channels.some((ch) => ch.type === 'whatsapp');

  const templates = hasOfficialApi
    ? await prisma.whatsAppTemplate.findMany({
        where: { tenantId: session.tenantId, deletedAt: null },
        orderBy: { updatedAt: 'desc' },
      })
    : [];

  const approved = templates.filter((t) => t.status === 'APPROVED').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Canales</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gestioná tus canales de comunicación y plantillas de WhatsApp
        </p>
      </div>

      {/* Connected channels */}
      {channels.length === 0 ? (
        <EmptyState
          title="Sin canales"
          description="Conectá tu primer canal de WhatsApp para empezar a recibir mensajes"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
            </svg>
          }
        />
      ) : (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
            Canales conectados
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {channels.map((ch) => {
              const isQr = ch.type === 'whatsapp_qr';
              return (
                <div
                  key={ch.id}
                  className="group rounded-xl border border-gray-200 bg-white p-4 transition-shadow duration-150 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        isQr
                          ? 'bg-purple-50 dark:bg-purple-500/10'
                          : 'bg-emerald-50 dark:bg-emerald-500/10'
                      }`}>
                        {isQr ? (
                          <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h3v3h-3v-3Z" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {isQr ? 'WhatsApp QR' : 'WhatsApp API Oficial'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {isQr && ch.evolutionInstance
                            ? `Sesión: ${ch.evolutionInstance}`
                            : ch.chatwootInboxId
                              ? `Inbox #${ch.chatwootInboxId}`
                              : 'Conectado'}
                        </p>
                      </div>
                    </div>
                    <DeleteChannelButton channelId={ch.id} />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                      isQr
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${isQr ? 'bg-purple-500' : 'bg-emerald-500'}`} />
                      {isQr ? 'No oficial' : 'API Oficial'}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {new Date(ch.createdAt).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* WhatsApp Templates - only if has Official API channel */}
      {hasOfficialApi && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Plantillas WhatsApp</h2>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {templates.length} plantilla{templates.length !== 1 ? 's' : ''} · {approved} aprobada{approved !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <TemplateSection />
              <Link
                href="/dashboard/templates/new"
                className="btn-primary flex items-center gap-1.5 text-sm"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Nueva
              </Link>
            </div>
          </div>

          {templates.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center dark:border-gray-700">
              <svg className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                Sin plantillas
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Sincronizá desde Meta o creá una nueva
              </p>
              <Link
                href="/dashboard/templates/new"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-500"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Crear plantilla
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-700 dark:bg-gray-900">
              {templates.map((tpl) => {
                const body = getBodyText(tpl.components as unknown[]);
                const statusStyle = {
                  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
                  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
                  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
                }[tpl.status] ?? 'bg-gray-100 text-gray-500';
                const statusLabel = {
                  APPROVED: 'Aprobada',
                  PENDING: 'Pendiente',
                  REJECTED: 'Rechazada',
                }[tpl.status] ?? tpl.status;
                const categoryLabel = {
                  UTILITY: 'Utilidad',
                  MARKETING: 'Marketing',
                  AUTHENTICATION: 'Autenticación',
                }[tpl.category] ?? tpl.category;

                return (
                  <div key={tpl.id} className="flex items-start gap-4 px-4 py-3.5">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
                      <svg className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{tpl.name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle}`}>
                          {statusLabel}
                        </span>
                        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-800">
                          {categoryLabel}
                        </span>
                        <span className="text-[10px] text-gray-400">{tpl.language}</span>
                      </div>
                      {body && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{body}</p>
                      )}
                    </div>
                    <TemplateDeleteButton templateId={tpl.id} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Info box */}
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="flex gap-3">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">¿Cómo funcionan las plantillas?</p>
                <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  <li>Si el cliente escribió en las últimas <strong>24 horas</strong>, el bot responde libre.</li>
                  <li>Después de 24h, solo podés enviar <strong>plantillas aprobadas</strong> por Meta.</li>
                  <li>Usá <strong>"Sincronizar"</strong> para traer las plantillas de tu cuenta de Meta.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Add channel */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Agregar canal
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard/channels/connect-whatsapp"
            className="group cursor-pointer rounded-xl border-2 border-gray-200 p-5 transition-all duration-150 hover:border-emerald-400 hover:shadow-md dark:border-gray-700 dark:hover:border-emerald-500"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 transition-colors duration-150 group-hover:bg-emerald-200 dark:bg-emerald-500/10">
                <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">WhatsApp API Oficial</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Meta Business Platform</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              Conexión oficial vía API de Meta. Requiere cuenta Business verificada.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">Oficial</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">Templates HSM</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">Sin riesgo</span>
            </div>
          </Link>

          <Link
            href="/dashboard/channels/connect-qr"
            className="group cursor-pointer rounded-xl border-2 border-gray-200 p-5 transition-all duration-150 hover:border-purple-400 hover:shadow-md dark:border-gray-700 dark:hover:border-purple-500"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 transition-colors duration-150 group-hover:bg-purple-200 dark:bg-purple-500/10">
                <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h3v3h-3v-3Z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">WhatsApp QR</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Escanear código QR</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              Conectá cualquier WhatsApp escaneando un QR. Sin cuenta Business.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">Rápido</span>
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">Sin verificación</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">No oficial</span>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}

function TemplateDeleteButton({ templateId }: { templateId: string }) {
  return (
    <form action={async () => {
      'use server';
      const { prisma: db } = await import('@/lib/db');
      await db.whatsAppTemplate.update({
        where: { id: templateId },
        data: { deletedAt: new Date() },
      });
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/dashboard/channels');
    }}>
      <button
        type="submit"
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-gray-300 transition-colors duration-150 hover:bg-red-50 hover:text-red-500 dark:text-gray-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
        aria-label="Eliminar plantilla"
        title="Eliminar del registro local"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
      </button>
    </form>
  );
}
