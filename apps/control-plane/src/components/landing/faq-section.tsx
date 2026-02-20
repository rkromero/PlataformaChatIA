'use client';

import { useState } from 'react';

const FAQS = [
  {
    question: '¿Cómo funciona el bot de IA?',
    answer:
      'El bot usa inteligencia artificial (GPT-4) para entender los mensajes de tus clientes y responder con información personalizada de tu negocio. Vos escribís las instrucciones (prompt) con los datos de tu empresa, y la IA se encarga del resto.',
  },
  {
    question: '¿Necesito conocimientos técnicos?',
    answer:
      'No. La plataforma está diseñada para que cualquier persona pueda configurar su bot en minutos. Solo necesitás saber qué querés que responda tu bot y nosotros nos encargamos de lo técnico.',
  },
  {
    question: '¿Puedo personalizar las respuestas del bot?',
    answer:
      'Sí, completamente. Vos definís el tono, la información, los precios, horarios y cualquier dato de tu negocio. El bot responde basándose en tus instrucciones específicas.',
  },
  {
    question: '¿Qué pasa si el cliente quiere hablar con un humano?',
    answer:
      'El bot detecta automáticamente cuando el cliente pide hablar con una persona real y transfiere la conversación a tu equipo de atención. Podés configurar las palabras clave que activan esta transferencia.',
  },
  {
    question: '¿Puedo usar mi número de WhatsApp actual?',
    answer:
      'Necesitás un número de WhatsApp Business API. Si ya tenés uno, lo conectás directamente. Si no, te guiamos en el proceso de obtenerlo a través de Meta Business.',
  },
  {
    question: '¿Hay período de prueba gratuito?',
    answer:
      'Sí, podés empezar con el plan Starter sin tarjeta de crédito. Incluye 500 mensajes por mes para que pruebes la plataforma sin compromiso.',
  },
  {
    question: '¿Mis datos están seguros?',
    answer:
      'Absolutamente. Cada negocio tiene su información completamente aislada. Usamos encriptación AES-256 para datos sensibles y toda la comunicación es por HTTPS.',
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            Preguntas frecuentes
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            ¿Tenés dudas? Acá las respuestas
          </h2>
        </div>

        <div className="mx-auto mt-16 max-w-3xl divide-y divide-gray-200">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index}>
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between py-5 text-left"
                >
                  <span className="text-sm font-medium text-gray-900">{faq.question}</span>
                  <svg
                    className={`ml-4 h-5 w-5 flex-shrink-0 text-gray-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    isOpen ? 'max-h-96 pb-5' : 'max-h-0'
                  }`}
                >
                  <p className="text-sm leading-relaxed text-gray-600">{faq.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
