import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Features } from '@/components/landing/features';
import { Pricing } from '@/components/landing/pricing';
import { Testimonials } from '@/components/landing/testimonials';
import { FaqSection } from '@/components/landing/faq-section';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'ChatPlatform — Atención al cliente por WhatsApp con IA',
  description:
    'Automatizá la atención de tu negocio por WhatsApp con inteligencia artificial. Bot 24/7, transferencia a humanos, panel de control. Empezá gratis.',
};

export default function LandingPage() {
  return (
    <div className="bg-white text-gray-900">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <Pricing />
      <Testimonials />
      <FaqSection />
      <Footer />
    </div>
  );
}
