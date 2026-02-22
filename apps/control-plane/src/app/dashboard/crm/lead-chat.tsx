'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  id: number;
  content: string;
  type: 'incoming' | 'outgoing';
  sender: string;
  timestamp: number;
}

export function LeadChat({ leadId, isLinked }: { leadId: string; isLinked: boolean }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [linked, setLinked] = useState(isLinked);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) loadMessages();
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadMessages() {
    setLoading(true);
    try {
      const res = await fetch(`/api/chat?leadId=${leadId}`);
      const data = await res.json();
      setMessages(data.messages ?? []);
      setLinked(data.linked ?? false);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, message: text }),
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
          },
        ]);
      }
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-1.5 text-[11px] font-medium text-gray-600 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-brand-500 dark:hover:bg-brand-500/5 dark:hover:text-brand-400"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
        </svg>
        Chat
      </button>
    );
  }

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-2.5 py-1.5 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">Conversación</span>
        <div className="flex items-center gap-1.5">
          <button onClick={loadMessages} className="rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title="Recargar">
            <svg className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
          </button>
          <button onClick={() => setOpen(false)} className="rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {!linked ? (
        <div className="p-3 text-center text-[11px] text-gray-400">
          Este lead aún no tiene conversación. Enviá una plantilla y esperá a que responda.
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="max-h-48 overflow-y-auto bg-white p-2 dark:bg-gray-900">
            {loading && messages.length === 0 ? (
              <div className="flex justify-center py-4">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-600/30 border-t-brand-600" />
              </div>
            ) : messages.length === 0 ? (
              <p className="py-3 text-center text-[11px] text-gray-400">Sin mensajes aún</p>
            ) : (
              <div className="space-y-1.5">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.type === 'incoming' ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed ${
                        msg.type === 'incoming'
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          : 'bg-brand-600 text-white'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p className={`mt-0.5 text-[9px] ${msg.type === 'incoming' ? 'text-gray-400' : 'text-brand-200'}`}>
                        {msg.sender} · {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="flex gap-1 border-t border-gray-200 bg-gray-50 p-1.5 dark:border-gray-700 dark:bg-gray-800">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribir como agente..."
              className="flex-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] focus:border-brand-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="rounded-md bg-brand-600 px-2 py-1 text-white transition-colors hover:bg-brand-500 disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            </button>
          </form>
        </>
      )}
    </div>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}
