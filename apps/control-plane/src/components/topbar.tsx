'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const SEARCH_ITEMS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Mi Bot', href: '/dashboard/ai-settings' },
  { label: 'Sandbox', href: '/dashboard/sandbox' },
  { label: 'Conocimiento', href: '/dashboard/ai-settings?tab=knowledge' },
  { label: 'Canales', href: '/dashboard/channels' },
  { label: 'Conversaciones', href: '/dashboard/conversations' },
  { label: 'CRM', href: '/dashboard/crm' },
  { label: 'Equipo', href: '/dashboard/team' },
  { label: 'Analytics', href: '/dashboard/analytics' },
  { label: 'Calendario', href: '/dashboard/calendario' },
  { label: 'Configuración', href: '/dashboard/configuracion' },
];

interface TopbarProps {
  email: string;
  role: string;
  tenantName: string | null;
  onMenuToggle: () => void;
}

export function Topbar({ email, role, tenantName, onMenuToggle }: TopbarProps) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const brandName = (tenantName || '').trim() || 'ChatPlatform';

  const filtered = query.trim()
    ? SEARCH_ITEMS.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : [];

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setQuery('');
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') closeSearch();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [closeSearch]);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  return (
    <header className="flex h-14 items-center justify-between border-b border-white/[0.06] bg-surface-1 px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors duration-150 hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="Abrir menú de navegación"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <span className="max-w-[160px] truncate text-sm font-semibold text-white lg:hidden" title={brandName}>
          {brandName}
        </span>
      </div>

      <div className="hidden lg:block">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-400 transition-colors duration-150 hover:border-white/20 hover:text-gray-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          Buscar...
          <kbd className="ml-4 rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">Ctrl+K</kbd>
        </button>
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeSearch} aria-hidden="true" />
          <div className="relative w-full max-w-md rounded-xl border border-white/[0.06] bg-surface-2 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-4">
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar página..."
                className="flex-1 bg-transparent py-3 text-sm text-gray-100 outline-none placeholder:text-gray-500"
              />
              <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-gray-500">Esc</kbd>
            </div>
            {query.trim() && (
              <div className="max-h-64 overflow-y-auto p-2">
                {filtered.length === 0 ? (
                  <p className="px-3 py-4 text-center text-sm text-gray-500">Sin resultados</p>
                ) : (
                  filtered.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => { router.push(item.href); closeSearch(); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-300 transition-colors duration-150 hover:bg-white/5 hover:text-white"
                    >
                      <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                      {item.label}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-gray-200">{email}</p>
            <p className="text-xs capitalize text-gray-500">{role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
