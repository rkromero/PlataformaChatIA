import Link from 'next/link';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/tokens';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <VerifyLayout success={false} message="Link inválido." />;
  }

  const email = await verifyToken(token, 'email_verification');
  if (!email) {
    return <VerifyLayout success={false} message="El link expiró o ya fue usado." />;
  }

  await prisma.tenantUser.updateMany({
    where: { email },
    data: { emailVerified: true },
  });

  return <VerifyLayout success={true} message="Tu email fue verificado correctamente." />;
}

function VerifyLayout({ success, message }: { success: boolean; message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="card text-center">
          <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
            success ? 'bg-emerald-100 dark:bg-emerald-500/10' : 'bg-red-100 dark:bg-red-500/10'
          }`}>
            {success ? (
              <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <p className="font-medium">{message}</p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-500">
            Ir al dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
