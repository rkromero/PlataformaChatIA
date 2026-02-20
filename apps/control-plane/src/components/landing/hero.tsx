import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gray-950 pt-16">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-900/40 via-gray-950 to-gray-950" />
      <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-brand-600/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-400">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
              Potenciado por IA
            </div>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Atención al cliente por WhatsApp,{' '}
              <span className="bg-gradient-to-r from-brand-400 to-brand-300 bg-clip-text text-transparent">
                en piloto automático
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-400">
              Tu asistente virtual responde 24/7, transfiere a humanos cuando es
              necesario, y controlás todo desde un panel intuitivo. Sin código,
              sin complicaciones.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-all hover:bg-brand-500 hover:shadow-brand-500/25"
              >
                Empezar gratis
              </Link>
              <a
                href="#como-funciona"
                className="flex items-center gap-2 rounded-lg border border-white/10 px-6 py-3 text-sm font-medium text-gray-300 transition-colors hover:border-white/20 hover:text-white"
              >
                Ver cómo funciona
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </a>
            </div>

            <div className="mt-10 flex items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Sin tarjeta de crédito
              </span>
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Setup en 5 minutos
              </span>
            </div>
          </div>

          {/* Chat mockup */}
          <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:ml-auto">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-1 shadow-2xl shadow-brand-600/10 backdrop-blur-sm">
              <div className="flex items-center gap-3 rounded-t-xl bg-emerald-600 px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Tu Negocio</div>
                  <div className="text-xs text-emerald-100">En línea</div>
                </div>
              </div>

              <div className="space-y-3 bg-[#0b141a] px-4 py-5">
                <div className="flex justify-end">
                  <div className="max-w-[75%] rounded-lg rounded-tr-none bg-[#005c4b] px-3 py-2">
                    <p className="text-sm text-gray-100">Hola! Quiero saber los precios del servicio premium</p>
                    <span className="mt-1 block text-right text-[10px] text-gray-400">14:32</span>
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="max-w-[75%] rounded-lg rounded-tl-none bg-[#202c33] px-3 py-2">
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="rounded bg-brand-500/20 px-1.5 py-0.5 text-[10px] font-medium text-brand-400">IA</span>
                    </div>
                    <p className="text-sm text-gray-100">¡Hola! Nuestro plan Premium incluye acceso ilimitado por $79/mes. ¿Querés que te cuente los beneficios?</p>
                    <span className="mt-1 block text-right text-[10px] text-gray-400">14:32</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="max-w-[75%] rounded-lg rounded-tr-none bg-[#005c4b] px-3 py-2">
                    <p className="text-sm text-gray-100">Sí, dale!</p>
                    <span className="mt-1 block text-right text-[10px] text-gray-400">14:33</span>
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg rounded-tl-none bg-[#202c33] px-3 py-2">
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="rounded bg-brand-500/20 px-1.5 py-0.5 text-[10px] font-medium text-brand-400">IA</span>
                    </div>
                    <p className="text-sm text-gray-100">
                      Con el Premium tenés:<br />
                      ✅ Atención prioritaria<br />
                      ✅ Reportes avanzados<br />
                      ✅ Soporte dedicado<br />
                      <br />
                      ¿Querés que te ayude a contratar?
                    </p>
                    <span className="mt-1 block text-right text-[10px] text-gray-400">14:33</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-b-xl border-t border-white/5 bg-[#0b141a] px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:300ms]" />
                </div>
                <span className="text-xs text-gray-500">Escribiendo...</span>
              </div>
            </div>

            <div className="absolute -inset-4 -z-10 rounded-3xl bg-brand-600/5 blur-xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
