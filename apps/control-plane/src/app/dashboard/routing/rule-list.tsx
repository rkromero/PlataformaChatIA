'use client';

import { useState, useTransition } from 'react';
import { createRuleAction, deleteRuleAction, updateRuleAction } from './actions';
import { RuleForm } from './rule-form';

interface Rule {
  id: string;
  name: string;
  type: string;
  conditionsJson: Record<string, unknown>;
  assignedAgentId: string | null;
  assignedAgentEmail: string | null;
  priority: number;
  isActive: boolean;
}

interface Agent {
  id: string;
  email: string;
  role: string;
}

const TYPE_LABELS: Record<string, string> = {
  round_robin: 'Round Robin',
  fixed: 'Asignación fija',
  geo: 'Por zona geográfica',
};

export function RuleList({ rules, agents }: { rules: Rule[]; agents: Agent[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editRule, setEditRule] = useState<Rule | null>(null);
  const [, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta regla?')) return;
    startTransition(() => {
      deleteRuleAction(id);
    });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => { setEditRule(null); setShowForm(true); }}
          className="btn-primary"
        >
          + Nueva regla
        </button>
      </div>

      {rules.length === 0 && !showForm && (
        <div className="card text-center py-12">
          <svg className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
          </svg>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            No hay reglas configuradas. Los leads se asignarán manualmente.
          </p>
        </div>
      )}

      {showForm && (
        <div className="card mb-4">
          <RuleForm
            rule={editRule}
            agents={agents}
            onClose={() => { setShowForm(false); setEditRule(null); }}
          />
        </div>
      )}

      <div className="space-y-2">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`card flex items-center justify-between ${
              !rule.isActive ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                {rule.priority}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{rule.name}</p>
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                    {TYPE_LABELS[rule.type] ?? rule.type}
                  </span>
                  {!rule.isActive && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800">
                      Inactiva
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  {rule.type === 'round_robin'
                    ? `Rota entre ${((rule.conditionsJson.agent_ids as string[]) ?? []).length} agentes`
                    : rule.assignedAgentEmail
                      ? `Asigna a ${rule.assignedAgentEmail}`
                      : 'Sin agente asignado'}
                  {rule.type === 'geo' && rule.conditionsJson.phone_prefixes
                    ? ` — Prefijos: ${(rule.conditionsJson.phone_prefixes as string[]).join(', ')}`
                    : ''}
                  {rule.type === 'fixed' && rule.conditionsJson.source
                    ? ` — Fuente: ${rule.conditionsJson.source}`
                    : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => { setEditRule(rule); setShowForm(true); }}
                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                title="Editar"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
              </button>
              <button
                onClick={() => handleDelete(rule.id)}
                className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                title="Eliminar"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
