export type TenantStatus = 'active' | 'paused';
export type TenantPlan = 'starter' | 'pro' | 'enterprise';
export type UserRole = 'owner' | 'admin' | 'agent';
export type ChannelType = 'whatsapp' | 'webchat';

export interface Tenant {
  id: string;
  name: string;
  status: TenantStatus;
  plan: TenantPlan;
  chatwootAccountId: number;
  createdAt: Date;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export interface AiSettings {
  tenantId: string;
  enabled: boolean;
  model: string;
  systemPrompt: string;
  handoffRulesJson: HandoffRules;
  businessHoursJson: BusinessHours | null;
  updatedAt: Date;
}

export interface HandoffRules {
  keywords: string[];
  handoffTag: string;
}

export interface BusinessHours {
  timezone: string;
  schedule: Record<string, { start: string; end: string } | null>;
}

export interface TenantChannel {
  id: string;
  tenantId: string;
  type: ChannelType;
  chatwootInboxId: number;
  configEncryptedJson: string;
  createdAt: Date;
}

export interface WhatsAppChannelConfig {
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
}

export interface ConversationLink {
  id: string;
  tenantId: string;
  chatwootConversationId: number;
  chatwootContactId: number | null;
  phone: string | null;
  crmLeadId: string | null;
  createdAt: Date;
}

export interface ChatwootWebhookPayload {
  event: string;
  account: { id: number };
  inbox?: { id: number };
  conversation?: {
    id: number;
    labels?: string[];
    meta?: {
      assignee?: { id: number } | null;
      sender?: {
        id: number;
        name?: string;
        phone_number?: string;
      };
    };
    contact?: {
      id: number;
      name?: string;
      phone_number?: string;
    };
  };
  message_type?: string;
  content?: string;
  sender?: {
    type?: string;
    id?: number;
    name?: string;
  };
  content_type?: string;
}

export interface CrmLeadPayload {
  tenant_id: string;
  source: 'whatsapp' | 'webchat';
  phone: string | null;
  name: string | null;
  chatwoot_conversation_id: number;
  chatwoot_inbox_id: number | null;
  last_message: string | null;
}
