'use client';

import { useState, useCallback } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';

interface Props {
  email: string;
  role: string;
  children: React.ReactNode;
}

export function DashboardShell({ email, role, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={role} open={sidebarOpen} onClose={closeSidebar} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          email={email}
          role={role}
          onMenuToggle={() => setSidebarOpen((prev) => !prev)}
        />
        {children}
      </div>
    </div>
  );
}
