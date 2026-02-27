import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Cómo automatizar WhatsApp con IA | ChatPlatform',
  description:
    'Paso a paso para implementar un bot de WhatsApp con IA, derivación a humanos y CRM para aumentar conversiones.',
  keywords: SEO_KEYWORDS,
  alternates: {
    canonical: '/blog/automatizar-whatsapp-con-ia',
  },
};

export default function AutomatizarWhatsappConIaPost() {
  return (
    <div className="bg-white text-gray-900">
      <Navbar />
      <main className="pt-28">
        <article className="mx-auto max-w-3xl px-4 pb-20 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Guía práctica</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Cómo automatizar WhatsApp con IA sin perder conversiones
          </h1>
          <p className="mt-4 text-base leading-7 text-gray-600">
            Automatizar WhatsApp no es responder por responder. El objetivo es contestar rápido,
            mantener contexto comercial y derivar a una persona cuando el cliente lo necesita.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-gray-900">1) Definí objetivo y casos de uso</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600">
            Empezá por los flujos de mayor impacto: consultas de precios, disponibilidad, seguimiento
            de leads y recuperación de oportunidades frías.
          </p>

          <h2 className="mt-8 text-xl font-semibold text-gray-900">2) Diseñá una base de conocimiento clara</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600">
            Documentá servicios, políticas, objeciones y respuestas esperadas. Una IA responde mejor
            cuando tiene información precisa y actualizada.
          </p>

          <h2 className="mt-8 text-xl font-semibold text-gray-900">3) Activá handoff inteligente</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600">
            Definí cuándo pasar a humano: alta intención de compra, reclamos sensibles o pedidos
            explícitos de asesor.
          </p>

          <h2 className="mt-8 text-xl font-semibold text-gray-900">4) Medí y optimizá semanalmente</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600">
            Medí tiempo de respuesta, tasa de resolución automática y conversión por etapa del funnel.
            Ajustá prompts y reglas en base a datos reales.
          </p>

          <div className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <p className="text-sm text-gray-700">
              Si querés implementar esta estrategia en tu negocio, podés arrancar gratis con ChatPlatform.
            </p>
            <Link
              href="/register"
              className="mt-4 inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
            >
              Probar gratis
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
