'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  updateLeadFieldAction,
  updateLeadStageAction,
  addTagAction,
  removeTagAction,
  createTaskAction,
  toggleTaskAction,
  deleteTaskAction,
} from './actions';
import { assignAgentAction } from '../../routing/actions';
import { SendTemplateButton } from '../send-template';
import { LOSS_REASONS } from '../loss-reasons';

interface Lead {
  id: string;
  contactName: string | null;
  phone: string | null;
  stage: string;
  notes: string | null;
  tags: string[];
  source: string;
  handoffActive: boolean;
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  createdAt: string;
  updatedAt: string;
  chatwootConversationId: number | null;
}

interface Task {
  id: string;
  title: string;
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
}

interface MessageItem {
  id: string | number;
  direction: string;
  content: string;
  senderName: string | null;
  timestamp: string;
}

interface Agent {
  id: string;
  name: string;
  email: string;
}

interface Props {
  lead: Lead;
  tasks: Task[];
  messages: MessageItem[];
  stageLabels: Record<string, string>;
  agents: Agent[];
  isAdmin: boolean;
}

const TAG_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
  'bg-pink-100 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400',
];

export function LeadProfile({ lead, tasks, messages: initialMessages, stageLabels, agents, isAdmin }: Props) {
  const [notes, setNotes] = useState(lead.notes ?? '');
  const [newTag, setNewTag] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [currentStage, setCurrentStage] = useState(lead.stage);
  const [lossModalOpen, setLossModalOpen] = useState(false);
  const [lossReason, setLossReason] = useState<string>(LOSS_REASONS[0].value);
  const [lossReasonDetail, setLossReasonDetail] = useState('');
  const [lossError, setLossError] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<MessageItem[]>(initialMessages);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const canChat = lead.source === 'chatwoot' || lead.source === 'whatsapp_qr';
  const [sendError, setSendError] = useState<string | null>(null);

  const displayName = lead.contactName || lead.phone || 'Contacto';
  const initial = (lead.contactName?.[0] || lead.phone?.[0] || '#').toUpperCase();
  const callPhone = lead.phone ? lead.phone.replace(/[^\d+]/g, '') : '';
  const callHref = callPhone ? `tel:${callPhone}` : null;

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, scrollToBottom]);

  async function refreshMessages() {
    if (!canChat) return;
    setRefreshing(true);
    try {
      const res = await fetch(`/api/chat?leadId=${lead.id}`);
      const data = await res.json();
      if (data.messages?.length) {
        const mapped: MessageItem[] = data.messages.map((m: { id: number; content: string; type: string; sender: string; timestamp: number }) => ({
          id: m.id,
          direction: m.type === 'incoming' ? 'incoming' : 'outgoing',
          content: m.content,
          senderName: m.sender,
          timestamp: new Date(m.timestamp * 1000).toISOString(),
        }));
        setChatMessages(mapped);
      }
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || sending) return;

    setChatInput('');
    setSending(true);
    setSendError(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, message: text }),
      });

      if (res.ok) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            direction: 'outgoing',
            content: text,
            senderName: 'Vos',
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        const data = await res.json().catch(() => ({}));
        setSendError(data.error || 'Error al enviar el mensaje');
      }
    } catch {
      setSendError('Error de conexión');
    } finally {
      setSending(false);
    }
  }

  function handleSaveNotes() {
    startTransition(() => { updateLeadFieldAction(lead.id, 'notes', notes); });
  }

  function handleStageChange(stage: string) {
    if (stage === 'lost') {
      setLossModalOpen(true);
      setLossError(null);
      return;
    }
    setCurrentStage(stage);
    startTransition(() => { updateLeadStageAction(lead.id, stage); });
  }

  function submitLostStage() {
    if (!lossReason) {
      setLossError('Debes seleccionar un motivo de pérdida.');
      return;
    }
    setCurrentStage('lost');
    setLossModalOpen(false);
    setLossError(null);
    startTransition(async () => {
      const result = await updateLeadStageAction(lead.id, 'lost', lossReason, lossReasonDetail);
      if (result?.error) {
        setCurrentStage(lead.stage);
      }
    });
  }

  function handleAddTag(e: React.FormEvent) {
    e.preventDefault();
    if (!newTag.trim()) return;
    startTransition(() => { addTagAction(lead.id, newTag); });
    setNewTag('');
  }

  function handleRemoveTag(tag: string) {
    startTransition(() => { removeTagAction(lead.id, tag); });
  }

  function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    startTransition(() => { createTaskAction(lead.id, newTaskTitle, newTaskDate || null); });
    setNewTaskTitle('');
    setNewTaskDate('');
    setShowTaskForm(false);
  }

  function handleToggleTask(taskId: string) {
    startTransition(() => { toggleTaskAction(taskId, lead.id); });
  }

  function handleDeleteTask(taskId: string) {
    startTransition(() => { deleteTaskAction(taskId, lead.id); });
  }

  function handleAssignAgent(agentId: string) {
    startTransition(() => { assignAgentAction(lead.id, agentId || null); });
  }

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <div className="mx-auto max-w-5xl lg:flex lg:h-[calc(100dvh-9rem)] lg:flex-col lg:overflow-hidden">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard/crm"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
          {initial}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight">{displayName}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {lead.phone && <span>{lead.phone}</span>}
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800">
              {lead.source === 'whatsapp_qr' ? 'WhatsApp QR' : lead.source === 'chatwoot' ? 'Chatwoot' : 'Manual'}
            </span>
            {lead.handoffActive && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                Handoff activo
              </span>
            )}
          </div>
        </div>
        <select
          value={currentStage}
          onChange={(e) => handleStageChange(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium dark:border-gray-700 dark:bg-gray-800"
        >
          {Object.entries(stageLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-3">
        {/* Left column: Info + Tasks */}
        <div className="space-y-4 lg:col-span-1 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
          {/* Agent assignment */}
          {isAdmin && agents.length > 0 && (
            <div className="card">
              <h3 className="mb-2 text-xs font-semibold uppercase text-gray-400">Agente asignado</h3>
              <select
                value={lead.assignedAgentId ?? ''}
                onChange={(e) => handleAssignAgent(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <option value="">Sin asignar</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name || a.email}</option>
                ))}
              </select>
              {callHref && (
                <a
                  href={callHref}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 lg:hidden"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 7.318 5.932 13.25 13.25 13.25h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106a1.125 1.125 0 0 0-1.173.417l-.97 1.293a1.125 1.125 0 0 1-1.21.38 12.035 12.035 0 0 1-7.143-7.143 1.125 1.125 0 0 1 .38-1.21l1.293-.97a1.125 1.125 0 0 0 .417-1.173L4.713 2.852A1.125 1.125 0 0 0 3.622 2H2.25A2.25 2.25 0 0 0 0 4.25v2.5Z" />
                  </svg>
                  Llamar
                </a>
              )}
            </div>
          )}

          {/* Tags */}
          <div className="card">
            <h3 className="mb-2 text-xs font-semibold uppercase text-gray-400">Etiquetas</h3>
            <div className="flex flex-wrap gap-1.5">
              {lead.tags.map((tag, i) => (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${TAG_COLORS[i % TAG_COLORS.length]}`}
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-0.5 opacity-60 hover:opacity-100"
                  >
                    x
                  </button>
                </span>
              ))}
              {lead.tags.length === 0 && (
                <span className="text-xs text-gray-400">Sin etiquetas</span>
              )}
            </div>
            <form onSubmit={handleAddTag} className="mt-2 flex gap-1.5">
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Nueva etiqueta..."
                className="flex-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800"
              />
              <button type="submit" className="rounded-md bg-brand-600 px-2 py-1 text-xs text-white hover:bg-brand-500">
                +
              </button>
            </form>
          </div>

          {/* Tasks */}
          <div className="card">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase text-gray-400">
                Tareas ({pendingTasks.length} pendiente{pendingTasks.length !== 1 ? 's' : ''})
              </h3>
              <button
                onClick={() => setShowTaskForm(!showTaskForm)}
                className="rounded-md bg-brand-600 px-2 py-0.5 text-[10px] text-white hover:bg-brand-500"
              >
                + Tarea
              </button>
            </div>

            {showTaskForm && (
              <form onSubmit={handleCreateTask} className="mb-3 space-y-2 rounded-lg border border-gray-200 p-2 dark:border-gray-700">
                <input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Ej: Llamar mañana"
                  required
                  className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800"
                />
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                    className="flex-1 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800"
                  />
                  <button type="submit" disabled={isPending} className="rounded-md bg-brand-600 px-3 py-1.5 text-xs text-white hover:bg-brand-500">
                    Crear
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-1">
              {pendingTasks.map((t) => (
                <TaskRow key={t.id} task={t} onToggle={handleToggleTask} onDelete={handleDeleteTask} />
              ))}
              {completedTasks.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-[10px] text-gray-400">
                    {completedTasks.length} completada{completedTasks.length !== 1 ? 's' : ''}
                  </summary>
                  <div className="mt-1 space-y-1">
                    {completedTasks.map((t) => (
                      <TaskRow key={t.id} task={t} onToggle={handleToggleTask} onDelete={handleDeleteTask} />
                    ))}
                  </div>
                </details>
              )}
              {tasks.length === 0 && (
                <p className="text-xs text-gray-400">Sin tareas</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <h3 className="mb-2 text-xs font-semibold uppercase text-gray-400">Notas</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleSaveNotes}
              rows={4}
              placeholder="Agregar notas sobre este contacto..."
              className="w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            />
          </div>

          {/* Timeline info */}
          <div className="card">
            <h3 className="mb-2 text-xs font-semibold uppercase text-gray-400">Timeline</h3>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>Creado el {new Date(lead.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-400" />
                <span>Última actividad: {new Date(lead.updatedAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-gray-300" />
                <span>{chatMessages.length} mensaje{chatMessages.length !== 1 ? 's' : ''} registrados</span>
              </div>
              {lead.assignedAgentName && (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-purple-400" />
                  <span>Asignado a {lead.assignedAgentName}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Conversation with chat input */}
        <div className="card flex flex-col lg:col-span-2 lg:min-h-0">
          {/* Conversation header */}
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase text-gray-400">
              Conversación ({chatMessages.length} mensajes)
            </h3>
            <div className="flex items-center gap-2">
              <SendTemplateButton leadId={lead.id} hasPhone={!!lead.phone} />
              {canChat && (
                <button
                  onClick={refreshMessages}
                  disabled={refreshing}
                  className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  title="Actualizar mensajes"
                >
                  <svg className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                  </svg>
                  Actualizar
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {chatMessages.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                Este contacto aún no tiene mensajes registrados
              </p>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.direction === 'incoming' ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                      msg.direction === 'incoming'
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        : 'bg-brand-600 text-white'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className={`mt-1 text-[10px] ${msg.direction === 'incoming' ? 'text-gray-400' : 'text-brand-200'}`}>
                      {msg.senderName || (msg.direction === 'incoming' ? 'Cliente' : 'Bot')} ·{' '}
                      {new Date(msg.timestamp).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Chat input */}
          {canChat ? (
            <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
              {sendError && (
                <p className="mb-2 text-xs text-red-500">{sendError}</p>
              )}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Escribir mensaje..."
                  disabled={sending}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                />
                <button
                  type="submit"
                  disabled={sending || !chatInput.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-500 disabled:opacity-50"
                >
                  {sending ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                    </svg>
                  )}
                  Enviar
                </button>
              </form>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2 border-t border-gray-200 pt-3 text-xs text-gray-400 dark:border-gray-700">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              <span>
                Este contacto fue creado manualmente. Usá una plantilla para iniciar la conversación.
              </span>
            </div>
          )}
        </div>
      </div>
      {lossModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/[0.06] bg-surface-2 p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-gray-100">Motivo de pérdida obligatorio</h3>
            <p className="mt-1 text-xs text-gray-400">Selecciona el motivo para marcar este lead como perdido.</p>

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
                  placeholder="Agrega contexto adicional..."
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
                  setLossModalOpen(false);
                  setLossError(null);
                }}
                className="btn-secondary text-sm"
              >
                Cancelar
              </button>
              <button onClick={submitLostStage} className="btn-primary text-sm">
                Guardar motivo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();

  return (
    <div className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${task.completed ? 'opacity-50' : ''}`}>
      <button
        onClick={() => onToggle(task.id)}
        className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
          task.completed
            ? 'border-emerald-400 bg-emerald-400 text-white'
            : 'border-gray-300 hover:border-brand-400 dark:border-gray-600'
        }`}
      >
        {task.completed && (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        )}
      </button>
      <span className={`flex-1 ${task.completed ? 'line-through' : ''}`}>{task.title}</span>
      {task.dueDate && (
        <span className={`text-[10px] ${isOverdue ? 'font-medium text-red-500' : 'text-gray-400'}`}>
          {new Date(task.dueDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
        </span>
      )}
      <button
        onClick={() => onDelete(task.id)}
        className="text-gray-300 hover:text-red-400"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
