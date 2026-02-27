import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { SEO_KEYWORDS } from '@/lib/seo';

const POSTS = [
  {
    slug: 'automatizar-whatsapp-con-ia',
    title: 'Cómo automatizar WhatsApp con IA sin perder conversiones',
    description:
      'Guía práctica para implementar automatización en WhatsApp con enfoque comercial y experiencia de cliente.',
  },
];

export const metadata: Metadata = {
  title: 'Blog de WhatsApp, IA y CRM | ChatPlatform',
  description:
    'Estrategias, guías y mejores prácticas para escalar atención al cliente y ventas con WhatsApp e inteligencia artificial.',
  keywords: SEO_KEYWORDS,
  alternates: {
    canonical: '/blog',
  },
};

export default function BlogPage() {
  return (
    <div className="bg-white text-gray-900">
      <Navbar />
      <main className="pt-28">
        <section className="mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Blog</h1>
          <p className="mt-4 text-base text-gray-600">
            Contenido para mejorar tu estrategia de atención, ventas y automatización en WhatsApp.
          </p>
          <div className="mt-10 grid gap-5">
            {POSTS.map((post) => (
              <article key={post.slug} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">
                  <Link href={`/blog/${post.slug}`} className="hover:text-brand-600">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm text-gray-600">{post.description}</p>
                <Link href={`/blog/${post.slug}`} className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:text-brand-500">
                  Leer artículo
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
