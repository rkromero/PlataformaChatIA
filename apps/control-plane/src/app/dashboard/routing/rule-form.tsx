'use client';

import { useState, useTransition } from 'react';
import { createRuleAction, updateRuleAction } from './actions';

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface RuleData {
  id: string;
  name: string;
  type: string;
  conditionsJson: Record<string, unknown>;
  assignedAgentId: string | null;
  priority: number;
  isActive: boolean;
}

export function RuleForm({
  rule,
  agents,
  onClose,
}: {
  rule: RuleData | null;
  agents: Agent[];
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
      conditionsJson.phone_prefixes = phonePrefixes
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
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
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">{isEdit ? 'Editar regla' : 'Nueva regla'}</h3>

      {error && (
        <div className="rounded-lg bg-red-500/10 p-2 text-xs text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-gray-400">Nombre</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input mt-1 w-full text-sm"
            placeholder="Ej: Leads Argentina"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-400">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="input mt-1 w-full text-sm"
          >
            <option value="round_robin">Round Robin</option>
            <option value="fixed">Asignación fija</option>
            <option value="geo">Por zona geográfica</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-400">Prioridad</label>
          <input
            type="number"
            min={0}
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="input mt-1 w-full text-sm"
          />
          <p className="mt-0.5 text-[10px] text-gray-400">Menor número = mayor prioridad</p>
        </div>

        <div className="flex items-center gap-2 self-end">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="isActive" className="text-sm">Activa</label>
        </div>
      </div>

      {/* Type-specific fields */}
      {type === 'fixed' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-gray-400">Agente asignado</label>
            <select
              value={assignedAgentId}
              onChange={(e) => setAssignedAgentId(e.target.value)}
              className="input mt-1 w-full text-sm"
            >
              <option value="">Seleccionar agente...</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name || a.email} ({a.role})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400">Fuente (opcional)</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="input mt-1 w-full text-sm"
            >
              <option value="">Todas las fuentes</option>
              <option value="whatsapp_qr">WhatsApp QR</option>
              <option value="chatwoot">Chatwoot</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </div>
      )}

      {type === 'geo' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-gray-400">Agente asignado</label>
            <select
              value={assignedAgentId}
              onChange={(e) => setAssignedAgentId(e.target.value)}
              className="input mt-1 w-full text-sm"
            >
              <option value="">Seleccionar agente...</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name || a.email} ({a.role})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400">Prefijos telefónicos</label>
            <input
              value={phonePrefixes}
              onChange={(e) => setPhonePrefixes(e.target.value)}
              className="input mt-1 w-full text-sm"
              placeholder="+54, +56, +52"
            />
            <p className="mt-0.5 text-[10px] text-gray-400">Separados por coma</p>
          </div>
        </div>
      )}

      {type === 'round_robin' && (
        <div>
          <label className="text-xs font-medium text-gray-400">Agentes en rotación</label>
          <div className="mt-2 space-y-1">
            {agents.map((a) => (
              <label
                key={a.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/[0.06] px-3 py-2 text-sm hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  checked={roundRobinAgents.includes(a.id)}
                  onChange={() => toggleRoundRobinAgent(a.id)}
                  className="h-4 w-4 rounded border-white/10"
                />
                {a.name || a.email}
                <span className="text-xs text-gray-400">({a.role})</span>
              </label>
            ))}
          </div>
          {roundRobinAgents.length === 0 && (
            <p className="mt-1 text-xs text-amber-500">Seleccioná al menos un agente</p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 border-t border-white/[0.06] pt-4">
        <button onClick={onClose} className="btn-secondary text-sm">
          Cancelar
        </button>
        <button onClick={handleSubmit} disabled={isPending} className="btn-primary text-sm">
          {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear regla'}
        </button>
      </div>
    </div>
  );
}
