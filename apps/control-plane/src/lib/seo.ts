const DEFAULT_SITE_URL = 'https://chatplatform.app';

export const SEO_KEYWORDS = [
  'bot de WhatsApp con IA',
  'atencion al cliente por WhatsApp',
  'automatizacion de WhatsApp para negocios',
  'chatbot para WhatsApp Business',
  'CRM para WhatsApp',
  'respuestas automaticas por WhatsApp',
  'asistente virtual para ventas por WhatsApp',
  'software de atencion al cliente con IA',
  'integracion WhatsApp y CRM',
  'plataforma omnicanal de soporte',
];

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || DEFAULT_SITE_URL;
}

export function absoluteUrl(path = '/') {
  return new URL(path, getSiteUrl()).toString();
}
