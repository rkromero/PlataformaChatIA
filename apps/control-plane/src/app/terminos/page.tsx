import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Términos de servicio | ChatPlatform',
  description:
    'Revisá los términos de servicio de ChatPlatform para el uso de la plataforma de atención por WhatsApp con IA.',
  keywords: SEO_KEYWORDS,
  alternates: {
    canonical: '/terminos',
  },
};

export default function TerminosPage() {
  return (
    <div className="bg-white text-gray-900">
      <Navbar />
      <main className="pt-28">
        <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Términos de servicio</h1>
          <p className="mt-4 text-sm leading-7 text-gray-600">
            Al utilizar ChatPlatform aceptás usar la plataforma conforme a la ley aplicable y a
            estos términos. El servicio puede evolucionar con mejoras, cambios operativos y nuevas
            funcionalidades.
          </p>
          <p className="mt-4 text-sm leading-7 text-gray-600">
            Cada cuenta es responsable por el contenido que envía y por su uso de canales
            integrados. ChatPlatform no se responsabiliza por incumplimientos regulatorios
            específicos de cada industria del cliente.
          </p>
          <p className="mt-4 text-sm leading-7 text-gray-600">
            Para dudas legales o comerciales, escribí a
            {' '}
            <a className="font-medium text-brand-600 hover:text-brand-500" href="mailto:legal@chatplatform.app">
              legal@chatplatform.app
            </a>
            .
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
