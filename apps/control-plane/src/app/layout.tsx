import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'ChatPlatform — Panel de Control',
  description: 'Plataforma de atención al cliente por WhatsApp con IA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              className:
                '!bg-white !text-gray-900 dark:!bg-gray-800 dark:!text-gray-100 !shadow-lg !border !border-gray-200 dark:!border-gray-700',
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
