import type { Metadata } from 'next';
import { ForgotPasswordPageClient } from './forgot-password-page-client';

export const metadata: Metadata = {
  title: 'Recuperar contraseña | ChatPlatform',
  description: 'Solicitá el enlace de recuperación de contraseña.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/forgot-password',
  },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageClient />;
}
