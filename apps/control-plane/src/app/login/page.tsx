import type { Metadata } from 'next';
import { LoginPageClient } from './login-page-client';

export const metadata: Metadata = {
  title: 'Iniciar sesión | ChatPlatform',
  description: 'Accedé a tu cuenta de ChatPlatform.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/login',
  },
};

export default function LoginPage() {
  return <LoginPageClient />;
}
