'use client';

import { useActionState } from 'react';
import { uploadKnowledgeFileAction } from './actions';

const CATEGORIES = [
  { value: 'faq', label: 'Preguntas frecuentes' },
  { value: 'products', label: 'Productos / Servicios' },
  { value: 'pricing', label: 'Precios' },
  { value: 'hours', label: 'Horarios' },
  { value: 'policies', label: 'Políticas' },
  { value: 'general', label: 'General' },
];

export function KnowledgeUploadForm() {
  const [state, action, pending] = useActionState(uploadKnowledgeFileAction, null);

  return (
    <form action={action} className="card mb-4">
      <h2 className="text-sm font-semibold">Importar archivo (PDF / Excel)</h2>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Ideal para listas de precios, fichas de productos o documentos largos.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-[200px,1fr,auto]">
        <select name="category" defaultValue="pricing" className="input">
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
        <input
          type="file"
          name="file"
          accept=".pdf,.xlsx,.xls,.csv,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          required
          className="input file:mr-3 file:rounded file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-brand-500"
        />
        <button type="submit" disabled={pending} className="btn-primary whitespace-nowrap">
          {pending ? 'Importando...' : 'Importar'}
        </button>
      </div>

      {state?.error && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {state.error}
        </p>
      )}
      {(state as { success?: boolean; message?: string } | null)?.success && (
        <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          {(state as { message?: string }).message || 'Archivo importado correctamente'}
        </p>
      )}
    </form>
  );
}
