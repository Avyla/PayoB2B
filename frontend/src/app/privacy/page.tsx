import React from 'react';
import { SmartBackButton } from '@/components/SmartBackButton';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <SmartBackButton />
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-8">Políticas de Privacidad</h1>
        
        <div className="space-y-8 bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 shadow-xl">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Marco Legal (Habeas Data)</h2>
            <p className="leading-relaxed">
              En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013 de la República de Colombia (Ley de Protección de Datos Personales o Habeas Data), 
              Payo establece la presente política para el tratamiento de la información confidencial, financiera y personal recolectada a través de nuestra plataforma B2B.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Manejo de Imágenes y Comprobantes Financieros</h2>
            <p className="leading-relaxed mb-4">
              La funcionalidad principal de Payo requiere la carga, recepción y procesamiento de imágenes correspondientes a comprobantes de transferencia (Nequi, Bancolombia, etc.).
              Garantizamos que:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-400">
              <li>Las imágenes son transmitidas de forma encriptada mediante protocolos seguros (TLS/SSL).</li>
              <li>El procesamiento de las imágenes a través de proveedores externos (ej. APIs de OCR de Google Cloud) se realiza <strong>exclusivamente</strong> con fines de extracción de texto operativo (Banco, Monto, Referencia, Fecha).</li>
              <li><strong>Protección contra IA:</strong> Los datos extraídos, los metadatos de los correos electrónicos y las imágenes de los comprobantes <strong>NUNCA</strong> serán utilizados, cedidos ni vendidos a terceros para el entrenamiento de modelos de Inteligencia Artificial (IA) públicos o privados.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Privacidad de Números de WhatsApp</h2>
            <p className="leading-relaxed">
              Los números de teléfono vinculados a través de nuestra integración de WhatsApp son tratados como información comercial sensible. 
              Payo almacena estos números con el único propósito de validar el origen de los reportes (arquitectura Zero-Trust) y procesar los comprobantes. 
              No compartiremos esta información con terceros para fines de marketing, publicidad o prospección de ventas.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Retención y Eliminación de Datos</h2>
            <p className="leading-relaxed">
              Conservamos los datos de las transacciones durante el tiempo que la cuenta del Comercio permanezca activa, para propósitos de auditoría y conciliación histórica.
              Ante la terminación del contrato o a solicitud explícita del titular, Payo procederá a la eliminación segura de los registros fotográficos y transaccionales, sujeto a los periodos de retención legal exigidos por la normativa tributaria colombiana.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Derechos del Titular</h2>
            <p className="leading-relaxed">
              Como comercio usuario de Payo, usted tiene derecho a conocer, actualizar, rectificar y solicitar la eliminación de sus datos en cualquier momento, 
              contactando directamente a nuestro equipo a través del Centro de Ayuda o al correo electrónico designado para protección de datos.
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
