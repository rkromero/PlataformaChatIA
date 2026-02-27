import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Política de privacidad | ChatPlatform',
  description:
    'Conocé cómo ChatPlatform recopila, usa y protege los datos de tu negocio y tus clientes.',
  keywords: SEO_KEYWORDS,
  alternates: {
    canonical: '/privacidad',
  },
};

export default function PrivacidadPage() {
  return (
    <div className="bg-white text-gray-900">
      <Navbar />
      <main className="pt-28">
        <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Política de privacidad</h1>
          <p className="mt-4 text-sm leading-7 text-gray-600">
            En ChatPlatform tratamos datos operativos necesarios para brindar el servicio de
            automatización conversacional. Aplicamos medidas de seguridad técnicas y organizativas
            para proteger información sensible.
          </p>
          <p className="mt-4 text-sm leading-7 text-gray-600">
            No vendemos datos personales. El acceso a la información se limita al personal
            autorizado y a proveedores de infraestructura necesarios para operar la plataforma.
          </p>
          <p className="mt-4 text-sm leading-7 text-gray-600">
            Para ejercer derechos de acceso o solicitar eliminación de datos, escribí a
            {' '}
            <a className="font-medium text-brand-600 hover:text-brand-500" href="mailto:privacidad@chatplatform.app">
              privacidad@chatplatform.app
            </a>
            .
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
