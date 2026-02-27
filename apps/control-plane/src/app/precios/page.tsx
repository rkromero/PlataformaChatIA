import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Pricing } from '@/components/landing/pricing';
import { Footer } from '@/components/landing/footer';
import { SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Precios de bot de WhatsApp con IA | ChatPlatform',
  description:
    'Conocé los planes y precios de ChatPlatform para automatizar tu atención por WhatsApp con inteligencia artificial.',
  keywords: SEO_KEYWORDS,
  alternates: {
    canonical: '/precios',
  },
};

export default function PreciosPage() {
  return (
    <div className="bg-white text-gray-900">
      <Navbar />
      <main className="pt-16">
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
