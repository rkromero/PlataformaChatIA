import Link from 'next/link';

const PLANS = [
  {
    name: 'Starter',
    price: '$29',
    period: '/mes',
    description: 'Ideal para negocios que recién empiezan a automatizar.',
    features: [
      '500 mensajes por mes',
      '1 número de WhatsApp',
      'Bot IA básico (GPT-4o-mini)',
      'Panel de control',
      'Historial de conversaciones',
    ],
    cta: 'Empezar gratis',
    href: '/register?plan=starter',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$79',
    period: '/mes',
    description: 'Para negocios que necesitan más volumen y funcionalidades.',
    features: [
      '5.000 mensajes por mes',
      'Hasta 3 WhatsApps',
      'Bot IA avanzado (GPT-4o)',
      'Transferencia a humanos',
      'Integración CRM',
      'Soporte prioritario',
    ],
    cta: 'Empezar con Pro',
    href: '/register?plan=pro',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Solución a medida para grandes operaciones.',
    features: [
      'Mensajes ilimitados',
      'WhatsApps ilimitados',
      'Modelo IA personalizado',
      'API de integración',
      'SLA garantizado',
      'Account manager dedicado',
    ],
    cta: 'Contactar ventas',
    href: '#contacto',
    popular: false,
  },
];

export function Pricing() {
  return (
    <section id="precios" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            Precios transparentes
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Elegí el plan que se adapte a tu negocio
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Empezá gratis y escalá cuando lo necesites. Sin sorpresas.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-8 ${
                plan.popular
                  ? 'border-brand-600 shadow-xl shadow-brand-600/10'
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-4 py-1 text-xs font-semibold text-white">
                  Más popular
                </span>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && (
                    <span className="ml-1 text-sm text-gray-500">{plan.period}</span>
                  )}
                </div>
              </div>

              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-gray-600">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`mt-8 block rounded-lg px-4 py-3 text-center text-sm font-semibold transition-colors ${
                  plan.popular
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25 hover:bg-brand-500'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
