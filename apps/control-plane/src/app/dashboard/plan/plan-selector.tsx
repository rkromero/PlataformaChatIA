'use client';

import { useActionState } from 'react';
import { changePlanAction } from './actions';
import type { PlanLimits } from '@chat-platform/shared/plans';

const CHECK_ICON = (
  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);

export function PlanSelector({
  currentPlan,
  plans,
}: {
  currentPlan: string;
  plans: Record<string, PlanLimits>;
}) {
  const [state, action, pending] = useActionState(changePlanAction, null);

  return (
    <div>
      {state?.error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          {state.message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {Object.entries(plans).map(([key, plan]) => {
          const isCurrent = key === currentPlan;
          const isEnterprise = key === 'enterprise';

          return (
            <div
              key={key}
              className={`card relative flex flex-col ${
                isCurrent ? 'ring-2 ring-brand-600' : ''
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-brand-600 px-3 py-0.5 text-[10px] font-semibold text-white">
                  Plan actual
                </span>
              )}

              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                {plan.price > 0 ? (
                  <>
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-sm text-gray-500">/mes</span>
                  </>
                ) : (
                  <span className="text-3xl font-bold">Custom</span>
                )}
              </div>

              <ul className="mt-4 flex-1 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  {CHECK_ICON}
                  {plan.messagesPerMonth.toLocaleString()} mensajes/mes
                </li>
                <li className="flex items-start gap-2">
                  {CHECK_ICON}
                  {plan.maxChannels === -1 ? 'Canales ilimitados' : `${plan.maxChannels} canal${plan.maxChannels > 1 ? 'es' : ''}`}
                </li>
                <li className="flex items-start gap-2">
                  {CHECK_ICON}
                  {plan.maxUsers === -1 ? 'Usuarios ilimitados' : `${plan.maxUsers} usuario${plan.maxUsers > 1 ? 's' : ''}`}
                </li>
                <li className="flex items-start gap-2">
                  {CHECK_ICON}
                  {plan.models.join(', ')}
                </li>
              </ul>

              {isCurrent ? (
                <button disabled className="btn-secondary mt-4 cursor-default opacity-60">
                  Plan actual
                </button>
              ) : isEnterprise ? (
                <a
                  href="mailto:ventas@chatplatform.com?subject=Plan Enterprise"
                  className="btn-secondary mt-4 block text-center"
                >
                  Contactar ventas
                </a>
              ) : (
                <form action={action} className="mt-4">
                  <input type="hidden" name="plan" value={key} />
                  <button type="submit" disabled={pending} className="btn-primary w-full">
                    {pending ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      `Cambiar a ${plan.name}`
                    )}
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
