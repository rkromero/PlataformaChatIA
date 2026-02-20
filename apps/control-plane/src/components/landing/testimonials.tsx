const TESTIMONIALS = [
  {
    quote:
      'Desde que implementamos el bot, la cantidad de consultas que resolvemos sin intervención humana subió al 80%. Nuestros clientes están encantados.',
    author: 'María García',
    role: 'Dueña de Restaurante',
    initials: 'MG',
  },
  {
    quote:
      'Lo configuré en una tarde y al día siguiente ya estaba atendiendo clientes. La integración con WhatsApp es impecable.',
    author: 'Carlos Rodríguez',
    role: 'Director de E-commerce',
    initials: 'CR',
  },
  {
    quote:
      'El handoff a humanos es brillante. El bot sabe cuándo derivar y el cliente ni se da cuenta de la transición. Muy profesional.',
    author: 'Ana Martínez',
    role: 'Gerente de Soporte',
    initials: 'AM',
  },
];

export function Testimonials() {
  return (
    <section className="bg-gray-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            Testimonios
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Lo que dicen nuestros clientes
          </h2>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.author}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6"
            >
              <div className="mb-4 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="flex-1 text-sm leading-relaxed text-gray-600">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{t.author}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
