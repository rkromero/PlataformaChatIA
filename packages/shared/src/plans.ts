export interface PlanLimits {
  name: string;
  price: number;
  messagesPerMonth: number;
  maxChannels: number;
  maxUsers: number;
  models: string[];
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  starter: {
    name: 'Starter',
    price: 29,
    messagesPerMonth: 500,
    maxChannels: 1,
    maxUsers: 1,
    models: ['gpt-4.1-mini'],
  },
  pro: {
    name: 'Pro',
    price: 79,
    messagesPerMonth: 5000,
    maxChannels: 3,
    maxUsers: 5,
    models: ['gpt-4.1-mini', 'gpt-4.1'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 0,
    messagesPerMonth: 50000,
    maxChannels: -1,
    maxUsers: -1,
    models: ['gpt-4.1-mini', 'gpt-4.1', 'gpt-4.5-preview'],
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.starter;
}

export function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
