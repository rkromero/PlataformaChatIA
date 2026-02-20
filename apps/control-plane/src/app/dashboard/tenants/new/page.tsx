import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { TenantForm } from '../tenant-form';
import { createTenantAction } from '../actions';

export default async function NewTenantPage() {
  const session = await requireSession();
  if (session.role !== 'super_admin') redirect('/dashboard');
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/tenants"
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Volver
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo Tenant</h1>
      </div>
      <TenantForm action={createTenantAction} />
    </div>
  );
}
