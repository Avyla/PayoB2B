import React from 'react';
import { SmartBackButton } from '@/components/SmartBackButton';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <SmartBackButton />
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-8">Términos de Servicio</h1>
        
        <div className="space-y-8 bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 shadow-xl">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Aceptación de los Términos</h2>
            <p className="leading-relaxed">
              Al acceder y utilizar Payo ("el Servicio"), usted acepta estar sujeto a estos Términos de Servicio. 
              El Servicio está diseñado exclusivamente para uso comercial (B2B) en la República de Colombia.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Naturaleza del Servicio y Exención de Responsabilidad (OCR)</h2>
            <p className="leading-relaxed mb-4">
              Payo proporciona una plataforma tecnológica que facilita la automatización, centralización y extracción de texto de comprobantes de pago mediante tecnología de Reconocimiento Óptico de Caracteres (OCR).
            </p>
            <div className="bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg">
              <p className="text-red-200 font-medium">
                <strong>Cláusula de Responsabilidad:</strong> Payo NO es una entidad financiera ni garantiza la veracidad de los fondos transferidos. La tecnología OCR es una herramienta de asistencia. La responsabilidad absoluta y final de validar el ingreso real de los fondos en las cuentas bancarias (Nequi, Bancolombia, etc.) y de prevenir fraudes o suplantaciones recae estrictamente en el Comercio y sus administradores. Payo no asumirá responsabilidad civil, penal ni comercial por pérdidas económicas derivadas de comprobantes falsos, alterados o lecturas inexactas del OCR.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Nivel de Servicio (SLA) y Disponibilidad</h2>
            <p className="leading-relaxed">
              Nos esforzamos por mantener una disponibilidad del 99.9%. Sin embargo, la operación de Payo depende de servicios de terceros (APIs de WhatsApp, Google Cloud, servicios bancarios). 
              Payo no se hace responsable por caídas de servicio, latencias o interrupciones que se originen en estas plataformas externas.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Restricciones de Uso (WhatsApp)</h2>
            <p className="leading-relaxed">
              El uso de la integración con WhatsApp está estrictamente limitado a la recepción de comprobantes transaccionales. 
              Queda determinantemente prohibido utilizar los webhooks o números vinculados a Payo para enviar SPAM, mensajes de marketing no solicitados, o cualquier contenido que viole las políticas comerciales de WhatsApp. 
              El incumplimiento de esta norma resultará en la suspensión inmediata de la cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Ley Aplicable</h2>
            <p className="leading-relaxed">
              Estos términos se rigen e interpretan de acuerdo con las leyes de la República de Colombia. Cualquier disputa relacionada con estos términos estará sujeta a la jurisdicción exclusiva de los tribunales competentes en Colombia.
            </p>
          </section>
        </div>
        
        <div className="mt-12 text-center text-sm text-slate-500">
          Última actualización: {new Date().toLocaleDateString('es-CO')}
        </div>
      </div>
    </div>
  );
}
