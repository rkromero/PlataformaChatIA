'use client';

import { useState, useEffect, useCallback } from 'react';
import { ConversationList } from './conversation-list';
import { ChatPanel } from './chat-panel';

export interface ConversationItem {
  id: string;
  chatwootConversationId: number;
  contactName: string | null;
  phone: string | null;
  lastMessage: string | null;
  stage: string;
  updatedAt: string;
  labels: string[];
  status: 'bot' | 'human';
}

export function ChatView() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations?q=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(fetchConversations, 300);
    return () => clearTimeout(timeout);
  }, [fetchConversations]);

  useEffect(() => {
    const interval = setInterval(fetchConversations, 15000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  function handleSelect(id: string) {
    setSelectedId(id);
    setMobileShowChat(true);
  }

  function handleBack() {
    setMobileShowChat(false);
  }

  function handleStatusChange(id: string, newStatus: 'bot' | 'human', newLabels: string[]) {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus, labels: newLabels } : c)),
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Conversation list — hidden on mobile when chat is open */}
      <div className={`w-full flex-shrink-0 border-r border-gray-200 dark:border-gray-800 md:w-80 lg:w-96 ${mobileShowChat ? 'hidden md:block' : ''}`}>
        <ConversationList
          conversations={conversations}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </div>

      {/* Chat panel */}
      <div className={`flex-1 ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        {selected ? (
          <ChatPanel
            key={selected.id}
            conversation={selected}
            onBack={handleBack}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-gray-400">
            <svg className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-700" fill="none" viewBox="0 0 24 24" strokeWidth={0.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
            <p className="text-sm font-medium">Seleccioná una conversación</p>
            <p className="mt-1 text-xs">Elegí un chat de la lista para ver los mensajes</p>
          </div>
        )}
      </div>
    </div>
  );
}
