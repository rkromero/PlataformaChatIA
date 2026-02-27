'use client';

import { useActionState } from 'react';
import { importKnowledgeUrlAction, uploadKnowledgeFileAction } from './actions';

const CATEGORIES = [
  { value: 'faq', label: 'Preguntas frecuentes' },
  { value: 'products', label: 'Productos / Servicios' },
  { value: 'pricing', label: 'Precios' },
  { value: 'hours', label: 'Horarios' },
  { value: 'policies', label: 'Políticas' },
  { value: 'general', label: 'General' },
];

export function KnowledgeUploadForm() {
  const [fileState, fileAction, filePending] = useActionState(uploadKnowledgeFileAction, null);
  const [urlState, urlAction, urlPending] = useActionState(importKnowledgeUrlAction, null);

  return (
    <div className="mb-4 grid gap-4 lg:grid-cols-2">
      <form action={fileAction} className="card">
        <h2 className="text-sm font-semibold">Importar archivo (PDF / Excel)</h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Ideal para listas de precios, fichas de productos o documentos largos.
        </p>

        <div className="mt-3 grid gap-3">
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
          <button type="submit" disabled={filePending} className="btn-primary w-full sm:w-auto">
            {filePending ? 'Importando...' : 'Importar archivo'}
          </button>
        </div>

        {fileState?.error && (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {fileState.error}
          </p>
        )}
        {(fileState as { success?: boolean; message?: string } | null)?.success && (
          <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            {(fileState as { message?: string }).message || 'Archivo importado correctamente'}
          </p>
        )}
      </form>

      <form action={urlAction} className="card">
        <h2 className="text-sm font-semibold">Importar desde URL web</h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Pegá una dirección web y el sistema extrae el texto para tu base de conocimiento.
        </p>

        <div className="mt-3 grid gap-3">
          <select name="category" defaultValue="general" className="input">
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <input
            type="text"
            name="url"
            required
            placeholder="www.tusitio.com o https://tusitio.com/pagina"
            className="input"
          />
          <button type="submit" disabled={urlPending} className="btn-primary w-full sm:w-auto">
            {urlPending ? 'Importando...' : 'Importar URL'}
          </button>
        </div>

        {urlState?.error && (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {urlState.error}
          </p>
        )}
        {(urlState as { success?: boolean; message?: string } | null)?.success && (
          <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            {(urlState as { message?: string }).message || 'URL importada correctamente'}
          </p>
        )}
      </form>
    </div>
  );
}
