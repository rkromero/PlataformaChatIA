'use client';

import { useState, useCallback } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';

interface Props {
  email: string;
  role: string;
  tenantName: string | null;
  children: React.ReactNode;
}

export function DashboardShell({ email, role, tenantName, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={role} tenantName={tenantName} open={sidebarOpen} onClose={closeSidebar} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          email={email}
          role={role}
          tenantName={tenantName}
          onMenuToggle={() => setSidebarOpen((prev) => !prev)}
        />
        {children}
      </div>
    </div>
  );
}
