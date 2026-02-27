import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/components/theme-provider';
import { SEO_KEYWORDS, getSiteUrl } from '@/lib/seo';
import './globals.css';

export const metadata: Metadata = {
  title: 'ChatPlatform — Panel de Control',
  description: 'Plataforma de atención al cliente por WhatsApp con IA',
  keywords: SEO_KEYWORDS,
  metadataBase: new URL(getSiteUrl()),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ChatPlatform',
    description: 'Automatizá la atención al cliente de tu negocio por WhatsApp con IA',
    siteName: 'ChatPlatform',
    url: '/',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChatPlatform',
    description: 'Automatizá la atención al cliente de tu negocio por WhatsApp con IA',
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              className:
                '!bg-surface-2 !text-gray-100 !shadow-lg !border !border-white/[0.06]',
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
