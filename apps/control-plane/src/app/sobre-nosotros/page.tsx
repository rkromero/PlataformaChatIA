import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Sobre nosotros | ChatPlatform',
  description:
    'Conocé al equipo detrás de ChatPlatform y cómo ayudamos a negocios a escalar su atención al cliente por WhatsApp con IA.',
  keywords: SEO_KEYWORDS,
  alternates: {
    canonical: '/sobre-nosotros',
  },
};

export default function SobreNosotrosPage() {
  return (
    <div className="bg-white text-gray-900">
      <Navbar />
      <main className="pt-28">
        <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Sobre nosotros</h1>
          <p className="mt-4 text-base text-gray-600">
            ChatPlatform nace para resolver un problema concreto: equipos de ventas y soporte que
            pierden oportunidades por no responder a tiempo en WhatsApp.
          </p>
          <p className="mt-4 text-base text-gray-600">
            Nuestra misión es que cualquier negocio pueda automatizar conversaciones, mantener
            contexto comercial y derivar a humanos cuando hace falta, sin fricción técnica.
          </p>
          <p className="mt-4 text-base text-gray-600">
            Construimos producto con foco en resultados: más respuestas, mejor experiencia del
            cliente y más conversiones.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
