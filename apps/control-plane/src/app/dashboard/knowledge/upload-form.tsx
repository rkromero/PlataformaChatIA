'use client';

import { useState, useActionState } from 'react';
import { importKnowledgeUrlAction, uploadKnowledgeFileAction } from './actions';

const CATEGORIES = [
  { value: 'faq', label: 'Preguntas frecuentes' },
  { value: 'products', label: 'Productos / Servicios' },
  { value: 'pricing', label: 'Precios' },
  { value: 'hours', label: 'Horarios' },
  { value: 'policies', label: 'Políticas' },
  { value: 'general', label: 'General' },
];

type Tab = 'url' | 'file';

export function KnowledgeUploadForm() {
  const [tab, setTab] = useState<Tab>('url');
  const [fileState, fileAction, filePending] = useActionState(uploadKnowledgeFileAction, null);
  const [urlState, urlAction, urlPending] = useActionState(importKnowledgeUrlAction, null);

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setTab('url')}
          className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-150 ${
            tab === 'url'
              ? 'border-b-2 border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
          Escanear sitio web
        </button>
        <button
          type="button"
          onClick={() => setTab('file')}
          className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-150 ${
            tab === 'file'
              ? 'border-b-2 border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          Subir archivo
        </button>
      </div>

      {/* URL Tab */}
      {tab === 'url' && (
        <form action={urlAction} className="p-5">
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Pegá la dirección de tu sitio web y el sistema extrae automáticamente toda la información relevante.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                </svg>
              </div>
              <input
                type="text"
                name="url"
                required
                placeholder="www.tunegocio.com"
                className="input w-full pl-10"
                aria-label="URL del sitio web"
              />
            </div>
            <button
              type="submit"
              disabled={urlPending}
              className="btn-primary flex-shrink-0 gap-2 !px-5"
            >
              {urlPending ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Escaneando...
                </>
              ) : (
                'Escanear'
              )}
            </button>
          </div>

          <StatusMessage state={urlState} />
        </form>
      )}

      {/* File Tab */}
      {tab === 'file' && (
        <form action={fileAction} className="p-5">
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Subí un PDF, Excel o CSV con información de tu negocio (precios, catálogos, etc).
          </p>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <label htmlFor="knowledge-file" className="sr-only">Archivo</label>
            <input
              id="knowledge-file"
              type="file"
              name="file"
              accept=".pdf,.xlsx,.xls,.csv"
              required
              className="input file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-brand-500"
            />
            <label htmlFor="file-category" className="sr-only">Categoría</label>
            <select id="file-category" name="category" defaultValue="general" className="input">
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={filePending}
              className="btn-primary flex-shrink-0 gap-2"
            >
              {filePending ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Importando...
                </>
              ) : (
                'Importar'
              )}
            </button>
          </div>

          <StatusMessage state={fileState} />
        </form>
      )}
    </div>
  );
}

function StatusMessage({ state }: { state: { error?: string; success?: boolean; message?: string } | null }) {
  if (!state) return null;

  if (state.error) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
        <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
        {state.error}
      </div>
    );
  }

  if (state.success) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
        <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        {state.message || 'Importado correctamente'}
      </div>
    );
  }

  return null;
}
