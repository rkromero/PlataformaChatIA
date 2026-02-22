'use client';

import { useState, useEffect, useTransition } from 'react';
import { sendTemplateAction } from '../templates/actions';

interface Template {
  id: string;
  name: string;
  language: string;
  category: string;
  bodyText: string;
  varCount: number;
}

export function SendTemplateButton({ leadId, hasPhone }: { leadId: string; hasPhone: boolean }) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [params, setParams] = useState<string[]>([]);
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (open && !loaded) {
      fetch('/api/templates')
        .then((r) => r.json())
        .then((data) => {
          setTemplates(data);
          setLoaded(true);
        })
        .catch(() => setLoaded(true));
    }
  }, [open, loaded]);

  function handleSelect(tpl: Template) {
    setSelected(tpl);
    setParams(Array(tpl.varCount).fill(''));
    setResult(null);
  }

  function handleSend() {
    if (!selected) return;
    startTransition(async () => {
      const res = await sendTemplateAction(leadId, selected.name, selected.language, params);
      setResult(res);
      if (res.success) {
        setTimeout(() => {
          setOpen(false);
          setResult(null);
          setSelected(null);
        }, 2000);
      }
    });
  }

  if (!hasPhone) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
        Plantilla
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-sm font-semibold">Enviar plantilla</h3>

            {!loaded ? (
              <div className="flex justify-center py-8">
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand-600/30 border-t-brand-600" />
              </div>
            ) : templates.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-500">
                No hay plantillas aprobadas.
                <a href="/dashboard/templates" className="ml-1 font-medium text-brand-600">Gestioná tus plantillas</a>
              </div>
            ) : !selected ? (
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => handleSelect(tpl)}
                    className="w-full rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-brand-400 hover:bg-brand-50 dark:border-gray-700 dark:hover:border-brand-500 dark:hover:bg-brand-500/5"
                  >
                    <p className="text-sm font-medium">{tpl.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">{tpl.bodyText}</p>
                    <div className="mt-1 flex gap-2">
                      <span className="text-[10px] text-gray-400">{tpl.language}</span>
                      {tpl.varCount > 0 && (
                        <span className="text-[10px] text-gray-400">{tpl.varCount} variable(s)</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <p className="text-xs font-medium text-gray-500">Plantilla: {selected.name}</p>
                  <p className="mt-1 text-sm">{selected.bodyText}</p>
                </div>

                {selected.varCount > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500">Variables:</p>
                    {params.map((p, i) => (
                      <div key={i}>
                        <label className="text-xs text-gray-400">{`{{${i + 1}}}`}</label>
                        <input
                          type="text"
                          value={p}
                          onChange={(e) => {
                            const next = [...params];
                            next[i] = e.target.value;
                            setParams(next);
                          }}
                          className="input mt-0.5"
                          placeholder={`Valor para {{${i + 1}}}`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {result?.error && (
                  <p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>
                )}
                {result?.success && (
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Plantilla enviada</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelected(null); setResult(null); }}
                    className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    ← Cambiar
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={isPending || (selected.varCount > 0 && params.some((p) => !p.trim()))}
                    className="btn-primary flex-1"
                  >
                    {isPending ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : null}
                    Enviar
                  </button>
                </div>
              </div>
            )}

            {!selected && (
              <div className="mt-3 flex justify-end">
                <button onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
