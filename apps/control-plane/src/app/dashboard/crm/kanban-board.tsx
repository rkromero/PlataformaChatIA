'use client';

import { useState, useTransition } from 'react';
import { moveLeadAction } from './actions';
import { LeadCard } from './lead-card';

export interface Lead {
  id: string;
  contactName: string | null;
  phone: string | null;
  lastMessage: string | null;
  stage: string;
  notes: string | null;
  chatwootConversationId: number;
  createdAt: string;
  updatedAt: string;
}

interface Stage {
  key: string;
  label: string;
  color: string;
}

interface KanbanBoardProps {
  leads: Lead[];
  stages: Stage[];
  chatwootBaseUrl: string;
  chatwootAccountId: number | null;
}

export function KanbanBoard({ leads: initialLeads, stages, chatwootBaseUrl, chatwootAccountId }: KanbanBoardProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

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

    setLeads((prev) =>
      prev.map((l) => (l.id === draggedId ? { ...l, stage: stageKey } : l)),
    );

    startTransition(() => {
      moveLeadAction(draggedId, stageKey);
    });

    setDraggedId(null);
    setDragOverStage(null);
  }

  function handleDragEnd() {
    setDraggedId(null);
    setDragOverStage(null);
  }

  return (
    <div className="flex flex-1 gap-3 overflow-x-auto pb-2">
      {stages.map((stage) => {
        const stageLeads = leads.filter((l) => l.stage === stage.key);
        const isDragOver = dragOverStage === stage.key;

        return (
          <div
            key={stage.key}
            className={`flex w-72 flex-shrink-0 flex-col rounded-xl border transition-colors ${
              isDragOver
                ? 'border-brand-400 bg-brand-50/50 dark:border-brand-500 dark:bg-brand-500/5'
                : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950'
            }`}
            onDragOver={(e) => handleDragOver(e, stage.key)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(stage.key)}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2.5 dark:border-gray-800">
              <div className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
              <span className="text-sm font-semibold">{stage.label}</span>
              <span className="ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                {stageLeads.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2 overflow-y-auto p-2">
              {stageLeads.length === 0 && (
                <div className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-800">
                  <p className="text-xs text-gray-400">Arrastrá leads acá</p>
                </div>
              )}
              {stageLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  chatwootBaseUrl={chatwootBaseUrl}
                  chatwootAccountId={chatwootAccountId}
                  isDragging={draggedId === lead.id}
                  onDragStart={() => handleDragStart(lead.id)}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
