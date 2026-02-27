import type { Metadata } from 'next';
import { InvitePageClient } from './invite-page-client';

export const metadata: Metadata = {
  title: 'Aceptar invitación | ChatPlatform',
  description: 'Creá tu contraseña para unirte al equipo.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/invite',
  },
};

export default function InvitePage() {
  return <InvitePageClient />;
}
