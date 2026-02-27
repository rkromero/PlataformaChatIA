'use client';

import { useState } from 'react';
import { AccountSection } from './sections/account-section';
import { PlanUsageSection } from './sections/plan-usage-section';
import { RoutingSection } from './sections/routing-section';

import type { AccountData, PlanUsageData, RoutingData } from './types';

const TABS = [
  {
    id: 'account' as const,
    label: 'Cuenta',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
  {
    id: 'plan' as const,
    label: 'Plan y uso',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
  {
    id: 'routing' as const,
    label: 'Asignaciones',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
] as const;

type TabId = (typeof TABS)[number]['id'];

interface SettingsShellProps {
  accountData: AccountData;
  planData: PlanUsageData;
  routingData: RoutingData;
}

export function SettingsShell({ accountData, planData, routingData }: SettingsShellProps) {
  const [activeTab, setActiveTab] = useState<TabId>('account');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="mt-1 text-sm text-gray-400">
          Gestioná tu cuenta, plan y reglas de asignación
        </p>
      </div>

      {/* Tab navigation */}
      <div className="mb-6 border-b border-white/[0.06]">
        <nav className="-mb-px flex gap-1" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex cursor-pointer items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors duration-150 ${
                activeTab === tab.id
                  ? 'border-brand-400 text-brand-400'
                  : 'border-transparent text-gray-400 hover:border-white/10 hover:text-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'account' && <AccountSection data={accountData} />}
        {activeTab === 'plan' && <PlanUsageSection data={planData} />}
        {activeTab === 'routing' && <RoutingSection data={routingData} />}
      </div>
    </div>
  );
}
