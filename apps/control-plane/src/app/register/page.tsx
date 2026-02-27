import type { Metadata } from 'next';
import { RegisterPageClient } from './register-page-client';

export const metadata: Metadata = {
  title: 'Crear cuenta | ChatPlatform',
  description: 'Creá tu cuenta de ChatPlatform para automatizar atención por WhatsApp con IA.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/register',
  },
};

export default function RegisterPage() {
  return <RegisterPageClient />;
}
