import { Banco } from '@prisma/client';
import { parse } from 'date-fns';

export interface ParsedEmailData {
  banco: Banco;
  monto: number;
  referencia?: string | null;
  nombre_remitente?: string | null;
  fechaTransaccion: Date;
}

export type ParseResult = 
  | { success: true; data: ParsedEmailData }
  | { success: false; reason: 'IGNORED_CONTEXT' | 'OUTGOING_TRANSFER' }
  | null; // True error -> DLQ

export interface ExtractorOption<T> {
  id: string;
  hits: number;
  extract: (text: string) => T | null;
}

export interface ExtractorRule {
  id: string;
  bank: Banco;
  hits: number;
  contextConditions: RegExp[];
  amountExtractors: ExtractorOption<number>[];
  referenceExtractors: ExtractorOption<string>[];
  senderExtractors: ExtractorOption<string>[];
  dateExtractors: ExtractorOption<Date>[];
}

export class EmailParser {
  private static parseAmount(val: string): number {
    const cleaned = val.replace(/[,.]00$/, '').replace(/[^\d]/g, '');
    return parseFloat(cleaned);
  }

  private static rules: ExtractorRule[] = [
    {
      id: 'Bancolombia_Transferencia_Normal',
      bank: Banco.BANCOLOMBIA,
      hits: 0,
      contextConditions: [/transferencia.*en tu cuenta/i, /transferencia.*de.*en tu/i],
      amountExtractors: [
        {
          id: 'bancolombia_monto_transferencia',
          hits: 0,
          extract: (text) => {
            const m = text.match(/transferencia por \$([\d.,]+)/i) || text.match(/por \$([\d.,]+)/i);
            return m ? EmailParser.parseAmount(m[1]) : null;
          }
        }
      ],
      referenceExtractors: [
        { id: 'bancolombia_no_ref', hits: 0, extract: () => null }
      ],
      senderExtractors: [
        {
          id: 'bancolombia_remitente_transferencia',
          hits: 0,
          extract: (text) => {
            const m = text.match(/transferencia por \$[\d.,]+\s+de\s+([A-Za-z0-9\s]+?)\s+en tu cuenta/i) 
                      || text.match(/de\s+([A-Za-z0-9\s]+?)\s+en tu cuenta/i);
            return m ? m[1].trim() : null;
          }
        }
      ],
      dateExtractors: [
        {
          id: 'bancolombia_fecha_normal',
          hits: 0,
          extract: (text) => {
            const m = text.match(/el\s+(\d{2}\/\d{2}\/\d{2,4})\s+a\s+las\s+(\d{2}:\d{2})/i);
            if (!m) return null;
            const formatStr = m[1].length === 8 ? 'dd/MM/yy HH:mm' : 'dd/MM/yyyy HH:mm';
            return parse(`${m[1]} ${m[2]}`, formatStr, new Date());
          }
        }
      ]
    },
    {
      id: 'Bancolombia_Pago_BreB_u_Otro',
      bank: Banco.BANCOLOMBIA,
      hits: 0,
      contextConditions: [/pago.*a tu cuenta/i, /pago por \$/i],
      amountExtractors: [
        {
          id: 'bancolombia_monto_pago',
          hits: 0,
          extract: (text) => {
            const m = text.match(/pago por \$([\d.,]+)/i) || text.match(/por \$([\d.,]+)/i);
            return m ? EmailParser.parseAmount(m[1]) : null;
          }
        }
      ],
      referenceExtractors: [
        { id: 'bancolombia_no_ref', hits: 0, extract: () => null }
      ],
      senderExtractors: [
        {
          id: 'bancolombia_remitente_pago',
          hits: 0,
          extract: (text) => {
            const m = text.match(/pago por \$[\d.,]+\s+de\s+([A-Za-z0-9\s]+?)\s+a tu cuenta/i)
                      || text.match(/de\s+([A-Za-z0-9\s]+?)\s+a tu cuenta/i);
            return m ? m[1].trim() : null;
          }
        }
      ],
      dateExtractors: [
        {
          id: 'bancolombia_fecha_invertida',
          hits: 0,
          extract: (text) => {
            const m = text.match(/el\s+(\d{2}:\d{2})\s+a\s+las\s+(\d{2}\/\d{2}\/\d{2,4})/i)
                      || text.match(/el\s+(\d{2}\/\d{2}\/\d{2,4})\s+a\s+las\s+(\d{2}:\d{2})/i);
            if (!m) return null;
            const isFirstDate = m[1].includes('/');
            const dateStr = isFirstDate ? m[1] : m[2];
            const timeStr = isFirstDate ? m[2] : m[1];
            const formatStr = dateStr.length === 8 ? 'dd/MM/yy HH:mm' : 'dd/MM/yyyy HH:mm';
            return parse(`${dateStr} ${timeStr}`, formatStr, new Date());
          }
        }
      ]
    },
    {
      id: 'Bancolombia_Llave',
      bank: Banco.BANCOLOMBIA,
      hits: 0,
      contextConditions: [/conectad[ao] a la llave/i, /transferencia de.*a la llave/i],
      amountExtractors: [
        {
          id: 'bancolombia_monto_llave',
          hits: 0,
          extract: (text) => {
            const m = text.match(/por \$([\d.,]+)/i);
            return m ? EmailParser.parseAmount(m[1]) : null;
          }
        }
      ],
      referenceExtractors: [
        { id: 'bancolombia_no_ref', hits: 0, extract: () => null }
      ],
      senderExtractors: [
        {
          id: 'bancolombia_remitente_llave',
          hits: 0,
          extract: (text) => {
            const m = text.match(/transferencia de\s+([A-Za-z0-9\s]+?)\s+por \$/i);
            return m ? m[1].trim() : null;
          }
        }
      ],
      dateExtractors: [
        {
          id: 'bancolombia_fecha_llave',
          hits: 0,
          extract: (text) => {
            const m = text.match(/el\s+(\d{2}\/\d{2}\/\d{2,4})\s+a\s+las\s+(\d{2}:\d{2})/i);
            if (!m) return null;
            const formatStr = m[1].length === 8 ? 'dd/MM/yy HH:mm' : 'dd/MM/yyyy HH:mm';
            return parse(`${m[1]} ${m[2]}`, formatStr, new Date());
          }
        }
      ]
    },
    {
      id: 'Nequi_Standard',
      bank: Banco.NEQUI,
      hits: 0,
      contextConditions: [/Nequi/i, /Recibiste.*de/i],
      amountExtractors: [
        {
          id: 'nequi_monto_recibiste',
          hits: 0,
          extract: (text) => {
            const m = text.match(/Recibiste\s+([\d.,]+)\s+de/i);
            return m ? EmailParser.parseAmount(m[1]) : null;
          }
        },
        {
          id: 'nequi_monto_simbolo',
          hits: 0,
          extract: (text) => {
            const m = text.match(/\$\s?([\d.,]+)/);
            return m ? EmailParser.parseAmount(m[1]) : null;
          }
        }
      ],
      referenceExtractors: [
        {
          id: 'nequi_ref_referencia',
          hits: 0,
          extract: (text) => {
            const m = text.match(/Referencia\s*[:\-]?\s*(\d+)/i);
            return m ? m[1] : null;
          }
        },
        {
          id: 'nequi_ref_comprobante',
          hits: 0,
          extract: (text) => {
            const m = text.match(/Comprobante\s*[:\-]?\s*(\d+)/i);
            return m ? m[1] : null;
          }
        },
        {
          id: 'nequi_ref_mensaje',
          hits: 0,
          extract: (text) => {
            const m = text.match(/Mensaje\s*[:\-]?\s*(M\d+)/i);
            return m ? m[1] : null;
          }
        }
      ],
      senderExtractors: [
        {
          id: 'nequi_remitente_breb',
          hits: 0,
          extract: (text) => {
            const m = text.match(/Recibiste\s+[\d.,]+\s+de\s+([A-Za-z0-9\s]+?)\s+el\s+\d{1,2}\s+de\s+/i);
            return m ? m[1].trim() : null;
          }
        },
        {
          id: 'nequi_remitente_recibiste',
          hits: 0,
          extract: (text) => {
            const m = text.match(/Recibiste\s+[\d.,]+\s+de\s+([A-Z0-9\s]+?)(?:\s+Mensaje|\s*$)/i);
            return m ? m[1].trim() : null;
          }
        }
      ],
      dateExtractors: [
        {
          id: 'nequi_fecha_fallback',
          hits: 0,
          extract: () => new Date() // Fallback provisorio
        }
      ]
    }
  ];

  public static sanitizeHtml(html: string): string {
    let text = html.replace(/<br\s*\/?>/gi, ' ');
    text = text.replace(/&nbsp;/gi, ' ');
    text = text.replace(/\\\*/g, '*');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();
    return text;
  }

  private static prioritizeOptions<T>(options: ExtractorOption<T>[]) {
    options.sort((a, b) => b.hits - a.hits);
  }

  private static prioritizeRules() {
    this.rules.sort((a, b) => b.hits - a.hits);
  }

  public static parse(emailBody: string, sender: string, subject: string): ParseResult {
    const text = this.sanitizeHtml(emailBody);
    
    if (/pago de nomina/i.test(text) || /nomina/i.test(subject) || /Page Interim/i.test(text)) {
      console.log(`[EmailParser] Descartando Pago de Nómina o remitente blacklist (IGNORED_CONTEXT)`);
      return { success: false, reason: 'IGNORED_CONTEXT' };
    }

    if (/enviaste plata/i.test(text) || /transferencia a/i.test(subject) || /pago a/i.test(subject)) {
      console.log(`[EmailParser] Descartando Transferencia Saliente (OUTGOING_TRANSFER)`);
      return { success: false, reason: 'OUTGOING_TRANSFER' };
    }

    this.prioritizeRules();

    for (const rule of this.rules) {
      const isContextMatch = rule.contextConditions.some(regex => regex.test(text));
      if (!isContextMatch) continue;

      let finalMonto: number | null = null;
      let finalReference: string | null = null;
      let finalSender: string | null = null;
      let finalDate: Date | null = null;

      let usedMontoOption: ExtractorOption<number> | null = null;
      let usedReferenceOption: ExtractorOption<string> | null = null;
      let usedSenderOption: ExtractorOption<string> | null = null;
      let usedDateOption: ExtractorOption<Date> | null = null;

      // Monto
      this.prioritizeOptions(rule.amountExtractors);
      for (const opt of rule.amountExtractors) {
        try {
          const m = opt.extract(text);
          if (m !== null && !isNaN(m)) {
            finalMonto = m;
            usedMontoOption = opt;
            break;
          }
        } catch(e) { continue; }
      }

      // Sender
      this.prioritizeOptions(rule.senderExtractors);
      for (const opt of rule.senderExtractors) {
        try {
          const s = opt.extract(text);
          if (s !== null) {
            finalSender = s;
            usedSenderOption = opt;
            break;
          }
        } catch(e) { continue; }
      }

      // Reference
      this.prioritizeOptions(rule.referenceExtractors);
      for (const opt of rule.referenceExtractors) {
        try {
          const r = opt.extract(text);
          if (r !== null) {
            finalReference = r;
            usedReferenceOption = opt;
            break;
          }
        } catch(e) { continue; }
      }

      // Date
      this.prioritizeOptions(rule.dateExtractors);
      for (const opt of rule.dateExtractors) {
        try {
          const d = opt.extract(text);
          if (d !== null) {
            finalDate = d;
            usedDateOption = opt;
            break;
          }
        } catch(e) { continue; }
      }

      if (finalMonto !== null && (finalSender !== null || finalReference !== null) && finalDate !== null) {
        rule.hits++;
        if (usedMontoOption) usedMontoOption.hits++;
        if (usedSenderOption) usedSenderOption.hits++;
        if (usedReferenceOption) usedReferenceOption.hits++;
        if (usedDateOption) usedDateOption.hits++;

        console.log(`✅ [EmailParser] Matched rule: ${rule.id} (Rule Hits: ${rule.hits})`);
        if (usedMontoOption) console.log(`   - Monto Extraído por: ${usedMontoOption.id} (Hits: ${usedMontoOption.hits})`);

        return {
          success: true,
          data: {
            banco: rule.bank,
            monto: finalMonto,
            referencia: finalReference,
            nombre_remitente: finalSender,
            fechaTransaccion: finalDate
          }
        };
      } else {
        console.warn(`[EmailParser] Regla ${rule.id} coincidió en contexto pero falló en extracción profunda.`);
      }
    }

    return null;
  }
}
