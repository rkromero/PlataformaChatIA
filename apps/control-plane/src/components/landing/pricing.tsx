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
    href: '/register',
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
    href: '/register',
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
    <section id="precios" className="bg-white py-24 dark:bg-gray-950 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Precios transparentes
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Elegí el plan que se adapte a tu negocio
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Empezá con 14 días gratis y escalá cuando lo necesites. Sin tarjeta de crédito.
          </p>
        </div>

        {/* Trial callout */}
        <div className="mx-auto mt-10 max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-5 py-2.5 dark:border-brand-800 dark:bg-brand-500/10">
            <svg className="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span className="text-sm font-medium text-brand-900 dark:text-brand-100">
              14 días de prueba gratuita con 50 mensajes — sin compromiso
            </span>
          </div>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-8 ${plan.popular
                  ? 'border-brand-600 shadow-xl shadow-brand-600/10 dark:border-brand-500 dark:shadow-brand-500/10'
                  : 'border-gray-200 dark:border-gray-800'
                }`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-4 py-1 text-xs font-semibold text-white">
                  Más popular
                </span>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                  {plan.period && (
                    <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">{plan.period}</span>
                  )}
                </div>
              </div>

              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`mt-8 block rounded-lg px-4 py-3 text-center text-sm font-semibold transition-colors duration-150 ${plan.popular
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25 hover:bg-brand-500'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="mx-auto mt-24 max-w-5xl overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Funcionalidades</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Starter</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Pro</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              <tr>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">Mensajes / mes</td>
                <td className="px-6 py-4 text-gray-900 dark:text-white">500</td>
                <td className="px-6 py-4 text-gray-900 dark:text-white">5.000</td>
                <td className="px-6 py-4 text-gray-900 dark:text-white">Ilimitados</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">Números WA</td>
                <td className="px-6 py-4 text-gray-900 dark:text-white">1</td>
                <td className="px-6 py-4 text-gray-900 dark:text-white">Hasta 3</td>
                <td className="px-6 py-4 text-gray-900 dark:text-white">Ilimitados</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">Modelo IA</td>
                <td className="px-6 py-4 text-gray-900 dark:text-white">GPT-4o mini</td>
                <td className="px-6 py-4 text-gray-900 dark:text-white">GPT-4o</td>
                <td className="px-6 py-4 text-gray-900 dark:text-white">Personalizado</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">Transferencia humana</td>
                <td className="px-6 py-4 text-gray-900 dark:text-white">—</td>
                <td className="px-6 py-4 text-emerald-500">✅</td>
                <td className="px-6 py-4 text-emerald-500">✅</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">Integración CRM</td>
                <td className="px-6 py-4 text-gray-900 dark:text-white">—</td>
                <td className="px-6 py-4 text-emerald-500">✅</td>
                <td className="px-6 py-4 text-emerald-500">✅</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">Soporte</td>
                <td className="px-6 py-4 text-gray-900 dark:text-white">Email</td>
                <td className="px-6 py-4 text-gray-900 dark:text-white">Prioritario</td>
                <td className="px-6 py-4 text-gray-900 dark:text-white">Dedicado</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
