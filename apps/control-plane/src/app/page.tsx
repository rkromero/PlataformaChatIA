import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { Logos } from '@/components/landing/logos';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Features } from '@/components/landing/features';
import { Pricing } from '@/components/landing/pricing';
import { Testimonials } from '@/components/landing/testimonials';
import { FAQS, FaqSection } from '@/components/landing/faq-section';
import { Footer } from '@/components/landing/footer';
import { SEO_KEYWORDS, absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Bot de WhatsApp con IA para tu negocio | ChatPlatform',
  description:
    'Automatizá la atención al cliente por WhatsApp con IA: respuestas 24/7, CRM integrado y derivación a humanos. Probá ChatPlatform gratis.',
  keywords: SEO_KEYWORDS,
  alternates: {
    canonical: '/',
  },
};

export default function LandingPage() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ChatPlatform',
    url: absoluteUrl('/'),
    logo: absoluteUrl('/favicon.svg'),
    sameAs: [],
  };

  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ChatPlatform',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'Plataforma para automatizar la atención al cliente por WhatsApp con inteligencia artificial y CRM.',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: '29',
    },
    url: absoluteUrl('/'),
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="bg-white text-gray-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />
      <Hero />
      <Logos />
      <HowItWorks />
      <Features />
      <Pricing />
      <Testimonials />
      <FaqSection />
      <Footer />
    </div>
  );
}
