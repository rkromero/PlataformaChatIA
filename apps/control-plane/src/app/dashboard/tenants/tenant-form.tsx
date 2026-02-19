'use client';

import { useActionState } from 'react';
import type { Tenant } from '@prisma/client';

type FormAction = (prev: unknown, formData: FormData) => Promise<{ error?: string } | void>;

export function TenantForm({
  action,
  tenant,
}: {
  action: FormAction;
  tenant?: Tenant;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="card max-w-xl space-y-5">
      <div>
        <label htmlFor="name" className="label">Nombre</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={tenant?.name}
          className="input"
          placeholder="Empresa ABC"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="status" className="label">Estado</label>
          <select id="status" name="status" defaultValue={tenant?.status ?? 'active'} className="input">
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </div>

        <div>
          <label htmlFor="plan" className="label">Plan</label>
          <select id="plan" name="plan" defaultValue={tenant?.plan ?? 'starter'} className="input">
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="chatwootAccountId" className="label">Chatwoot Account ID</label>
        <input
          id="chatwootAccountId"
          name="chatwootAccountId"
          type="number"
          required
          defaultValue={tenant?.chatwootAccountId}
          className="input"
          placeholder="1"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {state.error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          {tenant ? 'Guardar cambios' : 'Crear tenant'}
        </button>
      </div>
    </form>
  );
}
