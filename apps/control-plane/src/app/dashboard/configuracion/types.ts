import type { PlanLimits } from '@chat-platform/shared/plans';

export interface AccountData {
  tenantId: string;
  tenantName: string;
  plan: string;
  status: string;
  onboardingCompleted: boolean;
  aiEnabled: boolean;
  aiModel: string | null;
  trialEndsAt: string | null;
  lastUpdated: string | null;
  ownerName: string;
  ownerEmail: string;
  sessionEmail: string;
  sessionRole: string;
}

export interface PlanUsageData {
  currentPlan: string;
  planName: string;
  isTrial: boolean;
  isTrialExpired: boolean;
  trialDaysLeft: number;
  messagesUsed: number;
  messagesLimit: number;
  messagesPercent: number;
  channelCount: number;
  channelLimit: number;
  userCount: number;
  userLimit: number;
  plans: Record<string, PlanLimits>;
}

export interface RoutingRule {
  id: string;
  name: string;
  type: string;
  conditionsJson: Record<string, unknown>;
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  priority: number;
  isActive: boolean;
}

export interface RoutingAgent {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface RoutingData {
  rules: RoutingRule[];
  agents: RoutingAgent[];
}
