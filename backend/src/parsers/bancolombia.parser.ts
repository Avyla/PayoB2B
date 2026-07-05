import { ParsedReceiptResult, ReceiptParser, BankType } from './index';
import { extraerMontoCOP } from '../utils/currency.utils';

export class BancolombiaReceiptParser implements ReceiptParser {
  canParse(rawText: string): boolean {
    const text = rawText.toLowerCase();
    // SSD – Sign: Use Bancolombia-specific structural signals to avoid false
    // positives when "bancolombia" appears as *destination bank* on Nequi receipts.
    const hasTransferenciaExitosa = text.includes('transferencia exitosa');
    const hasComprobante = text.includes('comprobante no.') || text.includes('comprobante nro');
    const hasValorTransferencia = text.includes('valor de la transferencia');
    const hasProductoDestino = text.includes('producto destino') && text.includes('bancolombia');
    return hasTransferenciaExitosa || hasComprobante || hasValorTransferencia || hasProductoDestino;
  }

  parse(rawText: string): ParsedReceiptResult {
    let monto: number | null = null;
    let referencia: string | null = null;
    let fechaTransaccion: Date | null = null;
    let nombreRemitente: string | null = null;
    let confidence = 0;

    // Extract Monto — 3-tier cascade ordered by confidence
    // SSD – Data: each tier is more specific, preventing "$ 0.00" (transfer cost) from
    // shadowing the real amount when the OCR block order varies across environments.
    //
    // Tier 1 – Classic format:  "Valor $ 62.000"  (label and $ on same line)
    const MONTO_CLASICO_REGEX = /(?:Valor|Monto|Total):?\s*\$\s*([\d\.\,\sOo]+)/i;
    // Tier 2 – Bre-B format:   "Valor de la transferencia\n$ 7.685"  ($ on next line)
    // Uses [\r\n]+ to handle \n (Unix), \r\n (Windows) and spurious blank lines from OCR.
    const MONTO_BREB_REGEX = /Valor de la transferencia\s*[\r\n]+\s*\$\s*([\d\.\,\s]+)/i;
    // Tier 3 – Generic fallback: last resort, captures first $ in text
    const MONTO_FALLBACK_REGEX = /\$\s*([\d\.\,\sOo]+)/i;

    const montoMatch =
      rawText.match(MONTO_CLASICO_REGEX) ||
      rawText.match(MONTO_BREB_REGEX)    ||
      rawText.match(MONTO_FALLBACK_REGEX);

    if (montoMatch && montoMatch[1]) {
      const parsed = extraerMontoCOP(montoMatch[1]);
      if (parsed > 0) {
        monto = parsed;
        confidence += 0.4;
      } else {
        // Guard: fallback matched "$ 0.00" (transfer cost) — log for ops visibility
        console.warn('[BancolombiaParser] Monto extraído es cero: posible colisión de orden OCR. rawText snippet:', rawText.slice(0, 200));
      }
    }

    // Extract Referencia
    // SSD – Structure: Bancolombia uses alphanumeric codes like "54V017TBJ1", "2SMXASJAYG", "S2ZI0CO1O4"
    const refRegex = /(?:Comprobante(?:\s*No\.?)?|Número de comprobante|Nro\.?|Ref(?:erencia)?):?\s*([A-Za-z0-9]{6,20})/i;
    const refMatch = rawText.match(refRegex);
    if (refMatch && refMatch[1]) {
      referencia = refMatch[1];
      confidence += 0.3;
    }

    // Extract Fecha
    // SSD – Structure: Bancolombia uses DD/MM/YYYY or "DD Mes YYYY - HH:MM p.m."
    const dateRegexNumeric = /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/i;
    const dateRegexAbrev = /(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.?\s+(\d{4})(?:\s*-\s*(\d{1,2}):(\d{2})\s*(a\.?\s*m\.?|p\.?\s*m\.?)?)?/i;
    const dateNumericMatch = rawText.match(dateRegexNumeric);
    const dateAbrevMatch = rawText.match(dateRegexAbrev);
    const MONTHS_ABREV: Record<string, number> = {
      ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
      jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11
    };
    if (dateAbrevMatch) {
      try {
        const day = parseInt(dateAbrevMatch[1], 10);
        const month = MONTHS_ABREV[dateAbrevMatch[2].toLowerCase()];
        const year = parseInt(dateAbrevMatch[3], 10);
        let hours = dateAbrevMatch[4] ? parseInt(dateAbrevMatch[4], 10) : 12;
        const minutes = dateAbrevMatch[5] ? parseInt(dateAbrevMatch[5], 10) : 0;
        const ampm = dateAbrevMatch[6] ? dateAbrevMatch[6].toLowerCase().replace(/\s+/g, '') : '';
        if (ampm.includes('p') && hours < 12) hours += 12;
        if (ampm.includes('a') && hours === 12) hours = 0;
        if (month !== undefined) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00-05:00`;
          fechaTransaccion = new Date(dateStr);
          confidence += 0.3;
        }
      } catch (e) {
        // Fallback
      }
    } else if (dateNumericMatch) {
      try {
        const day = parseInt(dateNumericMatch[1], 10);
        const month = parseInt(dateNumericMatch[2], 10) - 1;
        const year = parseInt(dateNumericMatch[3], 10);
        // Force Colombia time (-05:00) parsing, assume noon if no time is provided
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00-05:00`;
        fechaTransaccion = new Date(dateStr);
        confidence += 0.3;
      } catch (e) {
        // Fallback
      }
    }

    // Extract Nombre Remitente
    // SSD – Data: classic formats show "De:"/"Enviado por:".
    // IMPORTANT – Bre-B format: only shows "Enviado a" (the RECIPIENT), NOT the sender.
    // In that case nombreRemitente is correctly null — the sender is not visible on screen.
    const remitenteRegex = /(?:De:|Nombre de quien env[ií]a:?|Enviado por:?|Cuenta origen:?)\s*([^\n]+)/i;
    const remitenteMatch = rawText.match(remitenteRegex);
    if (remitenteMatch && remitenteMatch[1]) {
      nombreRemitente = remitenteMatch[1].trim();
    }

    return {
      banco: 'BANCOLOMBIA',
      monto,
      referencia,
      fechaTransaccion,
      nombreRemitente,
      rawText,
      confidenceScore: Math.min(confidence, 1.0),
    };
  }
}
