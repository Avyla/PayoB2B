import { GoogleGenAI, Type, Schema } from '@google/genai';
import { Banco } from '@prisma/client';
import { EmailParser as RegexParser, ParsedEmailData } from './email.parser';
import { logger } from '../../utils/logger';

// Gemini se inicializa dinámicamente cuando se requiere para evitar warnings al iniciar el servidor

export interface SmartParsedEmailData extends ParsedEmailData {
  nombre_remitente?: string | null;
}

export type EmailParserServiceResult = 
  | { success: true; data: SmartParsedEmailData }
  | { success: false; reason: 'IGNORED_CONTEXT' | 'OUTGOING_TRANSFER' | 'ERROR_PARSEO' }
  | null;


const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    banco: {
      type: Type.STRING,
      description: "Banco emisor de la alerta. Debe ser 'NEQUI' o 'BANCOLOMBIA'."
    },
    monto: {
      type: Type.NUMBER,
      description: "Monto de la transacción como número flotante (ej: 50000.00)."
    },
    referencia: {
      type: Type.STRING,
      description: "Número de referencia de la transacción, si existe. Si es un pago Bre-B u otro que no tiene referencia, dejar null.",
      nullable: true
    },
    nombre_remitente: {
      type: Type.STRING,
      description: "Nombre de la persona que envía el dinero, si no hay número de referencia. Si no se encuentra, dejar null.",
      nullable: true
    },
    fecha_hora_transaccion: {
      type: Type.STRING,
      description: "Fecha y hora exacta de la transacción extraída del cuerpo del correo en formato ISO 8601 (ej. '2023-10-25T14:30:00.000Z'). Ignora la hora en que se recibió el correo; busca la hora MENCIONADA en el texto."
    }
  },
  required: ["banco", "monto", "fecha_hora_transaccion"]
};

export class EmailParserService {
  /**
   * Intenta parsear el texto de un correo electrónico usando primero Regex (Fase A)
   * y luego Gemini como Fallback (Fase B).
   */
  public static async parse(
    htmlBody: string, 
    sender: string, 
    subject: string
  ): Promise<EmailParserServiceResult> {
    
    const plainText = htmlBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

    // Fase A: Intento con Regex (Fast & Free)
    let regexResult = RegexParser.parse(htmlBody, sender, subject);
    
    // Si Regex devolvió un resultado explícito de ignorar
    if (regexResult && !regexResult.success) {
      return regexResult; // Returns { success: false, reason: ... }
    }

    // Si Regex funcionó (ya validó internamente que tiene Referencia o Nombre Remitente), asumimos éxito total.
    if (regexResult && regexResult.success) {
      logger.info('✅ [EmailParserService] Correo parseado exitosamente por Regex.');
      return {
        success: true,
        data: {
          ...regexResult.data,
          nombre_remitente: regexResult.data.nombre_remitente || null
        }
      };
    }

    // Fase B: Fallback a Inteligencia Artificial (Gemini 1.5 Flash)
    logger.warn('⚠️ [EmailParserService] Regex falló o faltan datos. Iniciando AI Fallback (Gemini)...');
    try {
      let ai: GoogleGenAI;
      if (process.env.GEMINI_API_KEY) {
        ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      } else {
        // Si no hay GEMINI_API_KEY, usa Vertex AI con la Service Account (JSON)
        ai = new GoogleGenAI({
          vertexai: true,
          project: process.env.GCP_PROJECT_ID || 'payo-500801',
          location: 'us-central1'
        });
      }

      const prompt = `Eres un validador contable bancario estricto.
Extrae del siguiente texto de correo electrónico bancario los campos solicitados.
Asegúrate de deducir la fecha y hora estrictamente del texto del correo y transfórmala a ISO 8601. Asume la zona horaria de Colombia (UTC-5) si no se especifica.
Si el correo es un comprobante de transferencia "Bre-B", probablemente no tenga referencia, pero sí nombre de quien envía.
El texto del correo es:
"${plainText}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.1,
        }
      });

      if (!response.text) return null;
      
      const parsedData = JSON.parse(response.text);

      if (!parsedData.monto || !parsedData.banco || !parsedData.fecha_hora_transaccion) {
        throw new Error('Faltan campos críticos obligatorios del LLM');
      }

      logger.info('🤖 [EmailParserService] AI Fallback exitoso.');
      
      return {
        success: true,
        data: {
          banco: parsedData.banco === 'NEQUI' ? Banco.NEQUI : Banco.BANCOLOMBIA,
          monto: parsedData.monto,
          referencia: parsedData.referencia || null,
          nombre_remitente: parsedData.nombre_remitente || null,
          fechaTransaccion: new Date(parsedData.fecha_hora_transaccion)
        }
      };

    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      const errStack = error instanceof Error ? error.stack : undefined;
      logger.error(`❌ [EmailParserService] Falló el AI Fallback: ${errMessage}`, { stack: errStack });
      return null;
    }
  }
}
