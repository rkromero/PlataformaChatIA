'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from './theme-provider';

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
  const { theme, toggle } = useTheme();
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
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 transition-colors duration-150 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
          aria-label="Abrir menú de navegación"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <span className="max-w-[160px] truncate text-sm font-semibold lg:hidden" title={brandName}>
          {brandName}
        </span>
      </div>

      <div className="hidden lg:block">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-400 transition-colors duration-150 hover:border-gray-300 hover:text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:hover:text-gray-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          Buscar...
          <kbd className="ml-4 rounded border border-gray-300 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:border-gray-600">Ctrl+K</kbd>
        </button>
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
          <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm" onClick={closeSearch} aria-hidden="true" />
          <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-2 border-b border-gray-200 px-4 dark:border-gray-700">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar página..."
                className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-gray-400"
              />
              <kbd className="rounded border border-gray-300 px-1.5 py-0.5 text-[10px] text-gray-400 dark:border-gray-600">Esc</kbd>
            </div>
            {query.trim() && (
              <div className="max-h-64 overflow-y-auto p-2">
                {filtered.length === 0 ? (
                  <p className="px-3 py-4 text-center text-sm text-gray-400">Sin resultados</p>
                ) : (
                  filtered.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => { router.push(item.href); closeSearch(); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
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
        <button
          onClick={toggle}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 transition-colors duration-150 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {theme === 'dark' ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
            </svg>
          )}
        </button>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">{email}</p>
            <p className="text-xs capitalize text-gray-500 dark:text-gray-400">{role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
