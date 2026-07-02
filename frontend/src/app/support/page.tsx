'use client';

import React, { useState } from 'react';
import { SmartBackButton } from '@/components/SmartBackButton';

export default function SupportCenter() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "¿Qué hago si una imagen no se lee correctamente?",
      answer: "Asegúrate de que la imagen sea legible, no esté borrosa y contenga la información completa del pago. Si el sistema OCR no logra extraer los datos (por ejemplo, el texto 'OTROS_BANCOS'), puedes buscar la transacción en tu panel, y editar manualmente los campos seleccionando 'Vincular Manualmente' para cruzarla con el correo correspondiente."
    },
    {
      question: "¿Por qué mis correos bancarios no se están sincronizando?",
      answer: "Revisa si el correo está llegando a la bandeja correcta y no a 'Spam'. Además, asegúrate de que tu conexión de Gmail en Payo siga activa. Google puede solicitar la re-autenticación ocasionalmente. Desde el panel de 'Correos', puedes revisar el estado de tu conexión y la 'Cola de Errores' (DLQ) para ver si algún correo fue descartado."
    },
    {
      question: "¿Cómo vinculo un nuevo número de WhatsApp de un cajero?",
      answer: "Ingresa al módulo de 'Configuración de WhatsApp' desde el menú principal de tu comercio. Allí podrás ver la lista actual (límite de 5 números por comercio) y añadir un nuevo celular. Recuerda que solo los usuarios con rol de Administrador pueden añadir o eliminar números, y el sistema te pedirá confirmación explícita para evitar borrados accidentales."
    },
    {
      question: "¿Por qué una transacción aparece como 'Duplicado Sospechoso'?",
      answer: "Payo detectó que se subió una imagen con la misma referencia, banco y fecha que otra transacción existente. El sistema aísla este comprobante para evitar doble contabilización. Puedes ir a la zona de resolución para revisar ambos comprobantes lado a lado y decidir si lo apruebas (falso positivo) o lo descartas."
    }
  ];

  const toggleFaq = (index: number) => {
    if (openFaq === index) {
      setOpenFaq(null);
    } else {
      setOpenFaq(index);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <SmartBackButton />
        </div>
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Centro de Ayuda Payo</h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Encuentra respuestas a los problemas más comunes o contacta directamente con nuestro equipo de soporte experto.
          </p>
        </div>
        
        <div className="bg-slate-800/50 backdrop-blur-sm p-2 sm:p-8 rounded-2xl border border-slate-700/50 shadow-xl mb-10">
          <h2 className="text-2xl font-semibold text-white mb-6 px-4 sm:px-0">Preguntas Frecuentes</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`border border-slate-700/50 rounded-xl overflow-hidden transition-all duration-200 ${openFaq === index ? 'bg-slate-800' : 'bg-transparent hover:bg-slate-800/30'}`}
              >
                <button 
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none"
                >
                  <span className="font-medium text-white">{faq.question}</span>
                  <svg 
                    className={`w-5 h-5 text-teal-500 transform transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div 
                  className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-96 py-4 opacity-100 border-t border-slate-700/50' : 'max-h-0 py-0 opacity-0'}`}
                >
                  <p className="text-slate-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-900/40 to-slate-800 p-8 rounded-2xl border border-teal-800/50 shadow-2xl text-center">
          <h2 className="text-2xl font-bold text-white mb-3">¿Necesitas asistencia técnica VIP?</h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            Como cliente de Payo, tienes acceso a soporte directo por WhatsApp. Nuestro equipo de ingenieros resolverá tu problema en tiempo real.
          </p>
          <a 
            href="https://wa.me/573000000000" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-teal-500 hover:bg-teal-400 text-white rounded-xl font-semibold shadow-lg shadow-teal-500/30 transition-all hover:-translate-y-1"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Soporte vía WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
