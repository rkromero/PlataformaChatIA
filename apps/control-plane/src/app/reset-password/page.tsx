import type { Metadata } from 'next';
import { ResetPasswordPageClient } from './reset-password-page-client';

export const metadata: Metadata = {
  title: 'Restablecer contraseña | ChatPlatform',
  description: 'Definí una nueva contraseña para acceder a tu cuenta.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/reset-password',
  },
};

export default function ResetPasswordPage() {
  return <ResetPasswordPageClient />;
}
