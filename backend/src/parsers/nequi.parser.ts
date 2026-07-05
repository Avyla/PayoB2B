import { ParsedReceiptResult, ReceiptParser, BankType } from './index';
import { extraerMontoCOP } from '../utils/currency.utils';

export class NequiReceiptParser implements ReceiptParser {
  canParse(rawText: string): boolean {
    const text = rawText.toLowerCase();
    // SSD – Sign: Use Nequi-specific structural signals to avoid false positives
    // when "nequi" appears as a *destination bank* on a Bancolombia receipt.
    // Priority signals (unique to the Nequi app UI):
    const hasNequiQr = text.includes('escanea este qr con nequi');
    const hasNequiNumber = text.includes('número nequi');
    const hasCuanto = text.includes('¿cuánto?') || text.includes('¿cuanto?');
    const hasEnvioRealizado = text.includes('envío realizado') || text.includes('envio realizado');
    const hasMovimientoExitoso = text.includes('movimiento exitoso') || text.includes('¡envío exitoso!');
    // A receipt is Nequi if it has at least one UI-structural signal
    return hasNequiQr || hasNequiNumber || hasCuanto || hasEnvioRealizado || hasMovimientoExitoso;
  }

  parse(rawText: string): ParsedReceiptResult {
    let monto: number | null = null;
    let referencia: string | null = null;
    let fechaTransaccion: Date | null = null;
    let nombreRemitente: string | null = null;
    let confidence = 0;

    // Extract Monto
    const montoRegex = /(?:¿Cuánto\?:?|Monto:?|Total:?)?\s*\$\s*([\d\.\,\sOo]+)/i;
    const montoMatch = rawText.match(montoRegex);
    if (montoMatch && montoMatch[1]) {
      const parsed = extraerMontoCOP(montoMatch[1]);
      if (parsed > 0) {
        monto = parsed;
        confidence += 0.4;
      }
    }

    // Extract Referencia
    const refRegex = /(?:Ref(?:erencia)?:?\s*)?(M\d{6,12}|\d{6,12})/i;
    const refMatch = rawText.match(refRegex);
    if (refMatch && refMatch[1]) {
      referencia = refMatch[1];
      confidence += 0.3;
    }

    // Extract Fecha
    const dateRegex = /(\d{1,2})\s+de\s+([a-z]+)\.?\s+de\s+(\d{4})\s*(?:-|a las)?\s*(\d{1,2}):(\d{2})\s*(?:(a\.?\s*m\.?|p\.?\s*m\.?|hrs))?/i;
    const dateMatch = rawText.match(dateRegex);
    if (dateMatch) {
      try {
        const day = parseInt(dateMatch[1], 10);
        const monthStr = dateMatch[2].toLowerCase();
        const year = parseInt(dateMatch[3], 10);
        let hours = parseInt(dateMatch[4], 10);
        const minutes = parseInt(dateMatch[5], 10);
        const ampm = dateMatch[6] ? dateMatch[6].toLowerCase().replace(/\s+/g, '') : '';

        const MONTHS: Record<string, number> = {
          enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
          julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
        };

        if (MONTHS[monthStr] !== undefined) {
          if (ampm.includes('p') && hours < 12) hours += 12;
          if (ampm.includes('a') && hours === 12) hours = 0;
          // Force Colombia time (-05:00) parsing
          const dateStr = `${year}-${String(MONTHS[monthStr] + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00-05:00`;
          fechaTransaccion = new Date(dateStr);
          confidence += 0.3;
        }
      } catch (e) {
        // Fallback
      }
    }

    // Extract Nombre Remitente
    // SSD – Data: handle both accented "dónde" and unaccented "donde" (OCR variation)
    const remitenteRegex = /(?:De:|\u00bfDesde\s+d[o\u00f3]nde\s+se\s+hizo\s+el\s+env[i\u00ed]o\?|Nombre de quien env[i\u00ed]a:?|Enviado por:?)\s*([^\n]+)/i;
    const remitenteMatch = rawText.match(remitenteRegex);
    if (remitenteMatch && remitenteMatch[1]) {
      const candidato = remitenteMatch[1].trim();
      // Filter out phone numbers — they are not a useful remitente name for matching
      if (!/^[\d\s]+$/.test(candidato)) {
        nombreRemitente = candidato;
      }
    }

    return {
      banco: 'NEQUI',
      monto,
      referencia,
      fechaTransaccion,
      nombreRemitente,
      rawText,
      confidenceScore: Math.min(confidence, 1.0),
    };
  }
}
