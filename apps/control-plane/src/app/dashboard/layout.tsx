import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { EmailBanner } from '@/components/email-banner';
import { DashboardShell } from './dashboard-shell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  const [user, tenant] = await Promise.all([
    prisma.tenantUser.findUnique({
      where: { id: session.userId },
      select: { emailVerified: true },
    }),
    prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { name: true },
    }),
  ]);

  return (
    <DashboardShell
      email={session.email}
      role={session.role}
      tenantName={tenant?.name || null}
    >
      {user && !user.emailVerified && <EmailBanner email={session.email} />}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
    </DashboardShell>
  );
}
