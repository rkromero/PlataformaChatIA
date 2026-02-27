'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ConversationItem } from './chat-view';

interface Message {
  id: number;
  content: string;
  type: 'incoming' | 'outgoing';
  sender: string;
  timestamp: number;
  private: boolean;
}

interface Props {
  conversation: ConversationItem;
  onBack: () => void;
  onStatusChange: (id: string, status: 'bot' | 'human', labels: string[]) => void;
}

export function ChatPanel({ conversation, onBack, onStatusChange }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [labels, setLabels] = useState<string[]>(conversation.labels);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [toggling, setToggling] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isHuman = labels.includes('human_handoff');
  const displayName = conversation.contactName || conversation.phone || (conversation.source !== 'chatwoot' ? 'WhatsApp' : `#${conversation.chatwootConversationId}`);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conversation.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
        setLabels(data.labels ?? []);

        const newStatus = (data.labels ?? []).includes('human_handoff') ? 'human' : 'bot';
        onStatusChange(conversation.id, newStatus as 'bot' | 'human', data.labels ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [conversation.id]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const interval = setInterval(fetchMessages, 8000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setInput('');
    setSending(true);

    try {
      const res = await fetch(`/api/conversations/${conversation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', message: text }),
      });

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            content: text,
            type: 'outgoing',
            sender: 'Vos',
            timestamp: Math.floor(Date.now() / 1000),
            private: false,
          },
        ]);
      }
    } finally {
      setSending(false);
    }
  }

  async function handleToggle() {
    setToggling(true);
    try {
      const action = isHuman ? 'release' : 'take';
      const res = await fetch(`/api/conversations/${conversation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        const data = await res.json();
        const newLabels = data.labels ?? [];
        setLabels(newLabels);
        const newStatus = newLabels.includes('human_handoff') ? 'human' : 'bot';
        onStatusChange(conversation.id, newStatus as 'bot' | 'human', newLabels);
      }
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
        <button
          onClick={onBack}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors duration-150 hover:bg-white/5 hover:text-white md:hidden"
          aria-label="Volver a la lista de conversaciones"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>

        <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
          isHuman
            ? 'bg-amber-500/15 text-amber-400'
            : 'bg-brand-500/15 text-brand-400'
        }`}>
          {(conversation.contactName?.[0] || conversation.phone?.[0] || '#').toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-100">{displayName}</p>
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${isHuman ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <span className="text-[11px] text-gray-500">
              {isHuman ? 'Atendiendo agente' : 'Bot activo'}
            </span>
            {conversation.phone && (
              <span className="text-[11px] text-gray-500">· {conversation.phone}</span>
            )}
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
            isHuman
              ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
          }`}
        >
          {toggling ? (
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current/30 border-t-current" />
          ) : isHuman ? (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
              Devolver al Bot
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              Tomar conversación
            </>
          )}
        </button>
      </div>

      {/* Status banner */}
      {isHuman && (
        <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-400">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <span className="font-medium">Bot pausado</span> — Estás atendiendo esta conversación. Los mensajes del bot están desactivados.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-surface-0 p-4">
        {loading ? (
          <div className="mx-auto max-w-2xl space-y-3 pt-4">
            {[65, 45, 70, 50, 60].map((w, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`animate-pulse rounded-2xl px-4 py-3 ${
                    i % 2 === 0
                      ? 'rounded-bl-md bg-surface-3'
                      : 'rounded-br-md bg-brand-500/10'
                  }`}
                  style={{ width: `${w}%` }}
                >
                  <div className="h-3 rounded bg-white/5" />
                  <div className="mt-1.5 h-3 w-3/4 rounded bg-white/[0.03]" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            Sin mensajes aún
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-2">
            {messages.map((msg, idx) => {
              const showDateSep = idx === 0 || !isSameDay(msg.timestamp, messages[idx - 1].timestamp);

              return (
                <div key={msg.id}>
                  {showDateSep && (
                    <div className="my-4 flex items-center justify-center">
                      <span className="rounded-full bg-surface-3 px-3 py-1 text-[10px] font-medium text-gray-400">
                        {formatDate(msg.timestamp)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${msg.type === 'incoming' ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`relative max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                        msg.type === 'incoming'
                          ? 'rounded-bl-md bg-surface-3 text-gray-100'
                          : 'rounded-br-md bg-brand-600 text-white'
                      } ${msg.private ? 'border-2 border-dashed border-yellow-400' : ''}`}
                    >
                      {msg.type === 'incoming' && (
                        <p className="mb-0.5 text-[10px] font-semibold text-brand-400">
                          {msg.sender}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p className={`mt-1 text-right text-[10px] ${
                        msg.type === 'incoming' ? 'text-gray-500' : 'text-brand-200'
                      }`}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-white/[0.06] bg-surface-1 px-4 py-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isHuman ? 'Escribir mensaje como agente...' : 'Toma la conversación para escribir...'}
          disabled={!isHuman || sending}
          className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:border-brand-500 focus:outline-none disabled:opacity-30"
        />
        <button
          type="submit"
          disabled={!isHuman || sending || !input.trim()}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-white transition-colors duration-150 hover:bg-brand-500 disabled:opacity-40"
          aria-label="Enviar mensaje"
        >
          {sending ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}

function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts: number): string {
  const d = new Date(ts * 1000);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Hoy';
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isSameDay(ts1: number, ts2: number): boolean {
  const d1 = new Date(ts1 * 1000);
  const d2 = new Date(ts2 * 1000);
  return d1.toDateString() === d2.toDateString();
}
