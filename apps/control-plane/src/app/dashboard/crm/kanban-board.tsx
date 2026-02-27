'use client';

import { useState, useTransition, useCallback } from 'react';
import { moveLeadAction } from './actions';
import { LeadCard } from './lead-card';
import { LOSS_REASONS } from './loss-reasons';

const INITIAL_VISIBLE = 20;
const LOAD_MORE_STEP = 20;

export interface Lead {
  id: string;
  contactName: string | null;
  phone: string | null;
  lastMessage: string | null;
  stage: string;
  notes: string | null;
  chatwootConversationId: number;
  source: string;
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  leadScore: number;
  leadTemperature: string;
  lossReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Stage {
  key: string;
  label: string;
  color: string;
}

interface KanbanBoardProps {
  leads: Lead[];
  stages: Stage[];
  isAdmin: boolean;
  showLeadScore: boolean;
}

export function KanbanBoard({
  leads: initialLeads,
  stages,
  isAdmin,
  showLeadScore,
}: KanbanBoardProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});
  const [lossModalLeadId, setLossModalLeadId] = useState<string | null>(null);
  const [lossReason, setLossReason] = useState<string>(LOSS_REASONS[0].value);
  const [lossReasonDetail, setLossReasonDetail] = useState('');
  const [lossError, setLossError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const getVisibleCount = useCallback(
    (stageKey: string) => visibleCounts[stageKey] ?? INITIAL_VISIBLE,
    [visibleCounts],
  );

  function showMore(stageKey: string) {
    setVisibleCounts((prev) => ({
      ...prev,
      [stageKey]: (prev[stageKey] ?? INITIAL_VISIBLE) + LOAD_MORE_STEP,
    }));
  }

  function handleDragStart(leadId: string) {
    setDraggedId(leadId);
  }

  function handleDragOver(e: React.DragEvent, stageKey: string) {
    e.preventDefault();
    setDragOverStage(stageKey);
  }

  function handleDragLeave() {
    setDragOverStage(null);
  }

  function handleDrop(stageKey: string) {
    if (!draggedId) return;

    const lead = leads.find((l) => l.id === draggedId);
    if (!lead || lead.stage === stageKey) {
      setDraggedId(null);
      setDragOverStage(null);
      return;
    }

    if (stageKey === 'lost') {
      setLossModalLeadId(draggedId);
      setLossReason(LOSS_REASONS[0].value);
      setLossReasonDetail('');
      setLossError(null);
      setDraggedId(null);
      setDragOverStage(null);
      return;
    }

    commitStageChange(draggedId, stageKey);

    setDraggedId(null);
    setDragOverStage(null);
  }

  function commitStageChange(
    leadId: string,
    stageKey: string,
    reason?: string,
    detail?: string,
  ) {
    const previousLeads = leads;
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage: stageKey } : l)),
    );

    startTransition(async () => {
      const result = await moveLeadAction(leadId, stageKey, reason, detail);
      if (result?.error) {
        setLeads(previousLeads);
        setLossError(result.error);
      }
    });
  }

  function submitLossReason() {
    if (!lossModalLeadId) return;
    if (!lossReason) {
      setLossError('Debes seleccionar un motivo de pérdida.');
      return;
    }
    commitStageChange(lossModalLeadId, 'lost', lossReason, lossReasonDetail);
    setLossModalLeadId(null);
    setLossReasonDetail('');
    setLossError(null);
  }

  function handleDragEnd() {
    setDraggedId(null);
    setDragOverStage(null);
  }

  return (
    <>
      <div className="grid flex-1 grid-cols-6 gap-2 pb-2">
        {stages.map((stage) => {
        const stageLeads = leads.filter((l) => l.stage === stage.key);
        const isDragOver = dragOverStage === stage.key;

        return (
          <div
            key={stage.key}
            className={`flex min-w-0 flex-col rounded-xl border transition-colors ${
              isDragOver
                ? 'border-brand-500 bg-brand-500/5'
                : 'border-white/[0.06] bg-surface-2'
            }`}
            onDragOver={(e) => handleDragOver(e, stage.key)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(stage.key)}
          >
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2.5">
              <div className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
              <span className="text-sm font-semibold">{stage.label}</span>
              <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-gray-400">
                {stageLeads.length}
              </span>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-2">
              {stageLeads.length === 0 && (
                <div className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-white/[0.06]">
                  <p className="text-xs text-gray-400">Arrastrá leads acá</p>
                </div>
              )}
              {stageLeads.slice(0, getVisibleCount(stage.key)).map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  isDragging={draggedId === lead.id}
                  onDragStart={() => handleDragStart(lead.id)}
                  onDragEnd={handleDragEnd}
                  isAdmin={isAdmin}
                  showLeadScore={showLeadScore}
                />
              ))}
              {stageLeads.length > getVisibleCount(stage.key) && (
                <button
                  onClick={() => showMore(stage.key)}
                  className="w-full rounded-lg border border-dashed border-white/[0.06] py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-white/10 hover:text-gray-300"
                >
                  Mostrar {Math.min(LOAD_MORE_STEP, stageLeads.length - getVisibleCount(stage.key))} más
                  ({stageLeads.length - getVisibleCount(stage.key)} restantes)
                </button>
              )}
            </div>
          </div>
        );
        })}
      </div>

      {lossModalLeadId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/[0.06] bg-surface-2 p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-gray-100">Motivo de pérdida obligatorio</h3>
            <p className="mt-1 text-xs text-gray-400">
              Para mover el lead a perdido, selecciona un motivo.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">Motivo</label>
                <select
                  value={lossReason}
                  onChange={(e) => setLossReason(e.target.value)}
                  className="input"
                >
                  {LOSS_REASONS.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">Detalle (opcional)</label>
                <textarea
                  value={lossReasonDetail}
                  onChange={(e) => setLossReasonDetail(e.target.value)}
                  rows={3}
                  className="input"
                  placeholder="Ej: Se fue con otro proveedor por menor precio."
                />
              </div>
            </div>

            {lossError && (
              <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {lossError}
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setLossModalLeadId(null);
                  setLossError(null);
                }}
                className="btn-secondary text-sm"
              >
                Cancelar
              </button>
              <button onClick={submitLossReason} className="btn-primary text-sm">
                Guardar motivo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
