import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ChatPlatform',
    short_name: 'ChatPlatform',
    description: 'Plataforma de atención al cliente por WhatsApp con IA',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0d0f14',
    theme_color: '#0d0f14',
    lang: 'es-AR',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        url: '/dashboard',
      },
      {
        name: 'CRM',
        short_name: 'CRM',
        url: '/dashboard/crm',
      },
      {
        name: 'Conversaciones',
        short_name: 'Chats',
        url: '/dashboard/conversations',
      },
    ],
    id: absoluteUrl('/'),
  };
}
