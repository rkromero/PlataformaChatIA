'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { createTemplateAction } from '../actions';

export default function NewTemplatePage() {
  const [state, formAction, pending] = useActionState(createTemplateAction, null);

  if (state?.success) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="card text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/10">
            <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <p className="font-medium">Plantilla enviada a Meta para revisión</p>
          <p className="mt-1 text-sm text-gray-500">Puede tardar entre minutos y 24 horas en ser aprobada.</p>
          <Link href="/dashboard/templates" className="mt-4 inline-block text-sm font-medium text-brand-600">
            ← Volver a plantillas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <Link href="/dashboard/templates" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          ← Volver a plantillas
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Nueva plantilla</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Se envía a Meta para aprobación. Solo se puede usar después de aprobada.
        </p>
      </div>

      <form action={formAction} className="card space-y-4">
        <div>
          <label htmlFor="name" className="label">Nombre *</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="input"
            placeholder="bienvenida_cliente"
            pattern="[a-z0-9_]+"
            title="Solo letras minúsculas, números y guiones bajos"
          />
          <p className="mt-1 text-xs text-gray-400">Solo minúsculas, números y _ (ej: seguimiento_compra)</p>
        </div>

        <div>
          <label htmlFor="category" className="label">Categoría *</label>
          <select id="category" name="category" className="input" required>
            <option value="UTILITY">Utilidad — confirmaciones, actualizaciones</option>
            <option value="MARKETING">Marketing — promociones, ofertas</option>
          </select>
        </div>

        <div>
          <label htmlFor="language" className="label">Idioma</label>
          <select id="language" name="language" className="input">
            <option value="es">Español</option>
            <option value="es_AR">Español (Argentina)</option>
            <option value="es_MX">Español (México)</option>
            <option value="en">Inglés</option>
            <option value="pt_BR">Portugués (Brasil)</option>
          </select>
        </div>

        <div>
          <label htmlFor="bodyText" className="label">Cuerpo del mensaje *</label>
          <textarea
            id="bodyText"
            name="bodyText"
            rows={5}
            required
            className="input"
            placeholder={"Hola {{1}}, gracias por tu interés en nuestros servicios. ¿Te gustaría agendar una llamada?"}
          />
          <p className="mt-1 text-xs text-gray-400">
            Usá {'{{1}}'}, {'{{2}}'}, etc. como variables que completarás al enviar.
          </p>
        </div>

        {state?.error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : null}
          Enviar a Meta para aprobación
        </button>
      </form>
    </div>
  );
}
