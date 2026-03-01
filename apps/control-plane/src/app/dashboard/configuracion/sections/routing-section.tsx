'use client';

import { useState, useTransition } from 'react';
import { SlidePanel } from '@/components/slide-panel';
import { createRuleAction, deleteRuleAction, updateRuleAction } from '../../routing/actions';
import type { RoutingData, RoutingRule, RoutingAgent } from '../types';

const TYPE_LABELS: Record<string, string> = {
  round_robin: 'Round Robin',
  fixed: 'Asignación fija',
  geo: 'Por zona geográfica',
};

export function RoutingSection({ data }: { data: RoutingData }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [editRule, setEditRule] = useState<RoutingRule | null>(null);
  const [, startTransition] = useTransition();

  function handleNew() {
    setEditRule(null);
    setPanelOpen(true);
  }

  function handleEdit(rule: RoutingRule) {
    setEditRule(rule);
    setPanelOpen(true);
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta regla?')) return;
    startTransition(() => {
      deleteRuleAction(id);
    });
  }

  function handlePanelClose() {
    setPanelOpen(false);
    setEditRule(null);
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-gray-400">
            Configurá cómo se asignan los leads automáticamente a los agentes
          </p>
        </div>
        <button onClick={handleNew} className="btn-primary w-full justify-center text-sm sm:w-auto">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva regla
        </button>
      </div>

      {data.rules.length === 0 && (
        <div className="card py-12 text-center">
          <svg className="mx-auto h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
          </svg>
          <p className="mt-3 text-sm text-gray-400">
            No hay reglas configuradas. Los leads se asignarán manualmente.
          </p>
          <button onClick={handleNew} className="btn-secondary mt-4 text-sm">
            Crear primera regla
          </button>
        </div>
      )}

      {data.rules.length > 0 && (
        <div className="space-y-2">
          {data.rules.map((rule) => (
            <div
              key={rule.id}
              className={`card flex items-center justify-between transition-opacity ${!rule.isActive ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-xs font-bold text-gray-400">
                  {rule.priority}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{rule.name}</p>
                    <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-medium text-brand-400">
                      {TYPE_LABELS[rule.type] ?? rule.type}
                    </span>
                    {!rule.isActive && (
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                        Inactiva
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {rule.type === 'round_robin'
                      ? `Rota entre ${((rule.conditionsJson.agent_ids as string[]) ?? []).length} agentes`
                      : rule.assignedAgentName
                        ? `Asigna a ${rule.assignedAgentName}`
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
                  onClick={() => handleEdit(rule)}
                  className="cursor-pointer rounded p-1.5 text-gray-400 transition-colors duration-150 hover:bg-white/5 hover:text-gray-300"
                  title="Editar"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="cursor-pointer rounded p-1.5 text-gray-400 transition-colors duration-150 hover:bg-red-500/10 hover:text-red-500"
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
      )}

      {/* Slide panel for creating/editing rules */}
      <SlidePanel
        open={panelOpen}
        onClose={handlePanelClose}
        title={editRule ? 'Editar regla' : 'Nueva regla'}
      >
        <RuleFormPanel
          rule={editRule}
          agents={data.agents}
          onClose={handlePanelClose}
        />
      </SlidePanel>
    </div>
  );
}

function RuleFormPanel({
  rule,
  agents,
  onClose,
}: {
  rule: RoutingRule | null;
  agents: RoutingAgent[];
  onClose: () => void;
}) {
  const isEdit = !!rule;
  const [name, setName] = useState(rule?.name ?? '');
  const [type, setType] = useState(rule?.type ?? 'round_robin');
  const [assignedAgentId, setAssignedAgentId] = useState(rule?.assignedAgentId ?? '');
  const [priority, setPriority] = useState(rule?.priority ?? 0);
  const [isActive, setIsActive] = useState(rule?.isActive ?? true);
  const [phonePrefixes, setPhonePrefixes] = useState(
    ((rule?.conditionsJson?.phone_prefixes as string[]) ?? []).join(', '),
  );
  const [source, setSource] = useState((rule?.conditionsJson?.source as string) ?? '');
  const [roundRobinAgents, setRoundRobinAgents] = useState<string[]>(
    (rule?.conditionsJson?.agent_ids as string[]) ?? [],
  );
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!name.trim()) { setError('Nombre requerido'); return; }

    const conditionsJson: Record<string, unknown> = {};
    if (type === 'geo') {
      conditionsJson.phone_prefixes = phonePrefixes.split(',').map((p) => p.trim()).filter(Boolean);
    }
    if (type === 'fixed' && source) {
      conditionsJson.source = source;
    }
    if (type === 'round_robin') {
      conditionsJson.agent_ids = roundRobinAgents;
    }

    const payload = {
      name,
      type,
      assignedAgentId: type === 'round_robin' ? null : assignedAgentId || null,
      priority,
      isActive,
      conditionsJson,
    };

    const fd = new FormData();
    fd.set('data', JSON.stringify(payload));

    startTransition(async () => {
      const result = isEdit
        ? await updateRuleAction(rule!.id, null, fd)
        : await createRuleAction(null, fd);
      if (result?.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  function toggleRoundRobinAgent(agentId: string) {
    setRoundRobinAgents((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId],
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div>
        <label className="label">Nombre</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder="Ej: Leads Argentina"
        />
      </div>

      <div>
        <label className="label">Tipo</label>
        <select value={type} onChange={(e) => setType(e.target.value)} className="input">
          <option value="round_robin">Round Robin</option>
          <option value="fixed">Asignación fija</option>
          <option value="geo">Por zona geográfica</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Prioridad</label>
          <input
            type="number"
            min={0}
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="input"
          />
          <p className="mt-1 text-xs text-gray-400">Menor = mayor prioridad</p>
        </div>
        <div className="flex items-end pb-1">
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-white/10"
            />
            <span className="text-sm font-medium">Regla activa</span>
          </label>
        </div>
      </div>

      {/* Type-specific fields */}
      {type === 'fixed' && (
        <>
          <div>
            <label className="label">Agente asignado</label>
            <select value={assignedAgentId} onChange={(e) => setAssignedAgentId(e.target.value)} className="input">
              <option value="">Seleccionar agente...</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name || a.email} ({a.role})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Fuente (opcional)</label>
            <select value={source} onChange={(e) => setSource(e.target.value)} className="input">
              <option value="">Todas las fuentes</option>
              <option value="whatsapp_qr">WhatsApp QR</option>
              <option value="chatwoot">Chatwoot</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </>
      )}

      {type === 'geo' && (
        <>
          <div>
            <label className="label">Agente asignado</label>
            <select value={assignedAgentId} onChange={(e) => setAssignedAgentId(e.target.value)} className="input">
              <option value="">Seleccionar agente...</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name || a.email} ({a.role})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Prefijos telefónicos</label>
            <input
              value={phonePrefixes}
              onChange={(e) => setPhonePrefixes(e.target.value)}
              className="input"
              placeholder="+54, +56, +52"
            />
            <p className="mt-1 text-xs text-gray-400">Separados por coma</p>
          </div>
        </>
      )}

      {type === 'round_robin' && (
        <div>
          <label className="label">Agentes en rotación</label>
          <div className="mt-1 space-y-1.5">
            {agents.map((a) => (
              <label
                key={a.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-white/[0.06] px-3.5 py-2.5 text-sm transition-colors duration-150 hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  checked={roundRobinAgents.includes(a.id)}
                  onChange={() => toggleRoundRobinAgent(a.id)}
                  className="h-4 w-4 rounded border-white/10"
                />
                <span>{a.name || a.email}</span>
                <span className="text-xs text-gray-400">({a.role})</span>
              </label>
            ))}
          </div>
          {roundRobinAgents.length === 0 && (
            <p className="mt-2 text-xs text-amber-500">Seleccioná al menos un agente</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 border-t border-white/[0.06] pt-5">
        <button onClick={onClose} className="btn-secondary flex-1">
          Cancelar
        </button>
        <button onClick={handleSubmit} disabled={isPending} className="btn-primary flex-1">
          {isPending ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : isEdit ? (
            'Guardar cambios'
          ) : (
            'Crear regla'
          )}
        </button>
      </div>
    </div>
  );
}
