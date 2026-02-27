import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Contacto | ChatPlatform',
  description:
    'Contactá al equipo de ChatPlatform para implementar automatización de atención al cliente por WhatsApp con IA.',
  keywords: SEO_KEYWORDS,
  alternates: {
    canonical: '/contacto',
  },
};

export default function ContactoPage() {
  return (
    <div className="bg-white text-gray-900">
      <Navbar />
      <main className="pt-28">
        <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Contacto</h1>
          <p className="mt-4 text-base text-gray-600">
            Si querés implementar un bot de WhatsApp con IA en tu negocio, escribinos y te ayudamos
            a definir la mejor configuración para tu operación.
          </p>
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-600">
              Email comercial:{' '}
              <a className="font-semibold text-brand-600 hover:text-brand-500" href="mailto:ventas@chatplatform.app">
                ventas@chatplatform.app
              </a>
            </p>
            <p className="mt-2 text-sm text-gray-600">
              También podés crear una cuenta y probar la plataforma sin costo inicial.
            </p>
            <Link
              href="/register"
              className="mt-5 inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
            >
              Empezar gratis
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
