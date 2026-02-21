'use client';

import { useActionState } from 'react';

const CATEGORIES = [
  { value: 'faq', label: 'Preguntas frecuentes' },
  { value: 'products', label: 'Productos / Servicios' },
  { value: 'pricing', label: 'Precios' },
  { value: 'hours', label: 'Horarios' },
  { value: 'policies', label: 'Políticas' },
  { value: 'general', label: 'General' },
];

interface KnowledgeFormProps {
  action: (prev: unknown, formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  defaultValues?: {
    id?: string;
    category: string;
    title: string;
    content: string;
  };
}

export function KnowledgeForm({ action, defaultValues }: KnowledgeFormProps) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="card max-w-2xl space-y-5">
      {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}

      <div>
        <label htmlFor="category" className="label">Categoría</label>
        <select
          id="category"
          name="category"
          defaultValue={defaultValues?.category ?? 'faq'}
          className="input"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="title" className="label">Título / Pregunta</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={defaultValues?.title ?? ''}
          className="input"
          placeholder="Ej: ¿Cuál es el horario de atención?"
        />
      </div>

      <div>
        <label htmlFor="content" className="label">Contenido / Respuesta</label>
        <textarea
          id="content"
          name="content"
          required
          rows={6}
          defaultValue={defaultValues?.content ?? ''}
          className="input"
          placeholder="Ej: Nuestro horario de atención es de lunes a viernes de 9:00 a 18:00 hs. Los sábados atendemos de 9:00 a 13:00 hs."
        />
        <p className="mt-1 text-xs text-gray-500">
          Escribí la información como querrías que el bot la responda. Máximo 5000 caracteres.
        </p>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {state.error}
        </p>
      )}

      {state?.success && (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          Guardado correctamente
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : null}
        {defaultValues?.id ? 'Guardar cambios' : 'Crear entrada'}
      </button>
    </form>
  );
}
