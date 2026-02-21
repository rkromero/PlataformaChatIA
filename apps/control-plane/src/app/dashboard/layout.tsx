import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { EmailBanner } from '@/components/email-banner';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  const user = await prisma.tenantUser.findUnique({
    where: { id: session.userId },
    select: { emailVerified: true },
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={session.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar email={session.email} role={session.role} />
        {user && !user.emailVerified && <EmailBanner email={session.email} />}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
