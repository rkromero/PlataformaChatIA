'use client';

import { useEffect, useState, useCallback } from 'react';
import { EmptyState } from '@/components/empty-state';

interface ConversationLink {
  id: string;
  chatwootConversationId: number;
  chatwootContactId: number | null;
  phone: string | null;
  crmLeadId: string | null;
  createdAt: string;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationLink[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      setConversations(data);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(fetchConversations, 300);
    return () => clearTimeout(timeout);
  }, [fetchConversations]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Conversations</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Links entre conversaciones de Chatwoot y leads del CRM
        </p>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-sm"
          placeholder="Buscar por teléfono o lead ID..."
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-600/30 border-t-brand-600" />
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState
          title="Sin conversaciones"
          description={search ? 'No se encontraron resultados' : 'Las conversaciones aparecerán cuando el bot procese mensajes'}
        />
      ) : (
        <div className="card overflow-hidden !p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-6 py-3.5 font-medium text-gray-500 dark:text-gray-400">Conv. ID</th>
                <th className="px-6 py-3.5 font-medium text-gray-500 dark:text-gray-400">Contact ID</th>
                <th className="px-6 py-3.5 font-medium text-gray-500 dark:text-gray-400">Teléfono</th>
                <th className="px-6 py-3.5 font-medium text-gray-500 dark:text-gray-400">CRM Lead ID</th>
                <th className="px-6 py-3.5 font-medium text-gray-500 dark:text-gray-400">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {conversations.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 tabular-nums">{c.chatwootConversationId}</td>
                  <td className="px-6 py-4 tabular-nums text-gray-500 dark:text-gray-400">
                    {c.chatwootContactId ?? '—'}
                  </td>
                  <td className="px-6 py-4">{c.phone ?? '—'}</td>
                  <td className="px-6 py-4">
                    {c.crmLeadId ? (
                      <span className="badge-blue">{c.crmLeadId}</span>
                    ) : (
                      <span className="badge-gray">pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                    {new Date(c.createdAt).toLocaleDateString('es-AR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
