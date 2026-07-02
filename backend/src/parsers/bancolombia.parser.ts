import { ParsedReceiptResult, ReceiptParser, BankType } from './index';

export class BancolombiaReceiptParser implements ReceiptParser {
  canParse(rawText: string): boolean {
    const text = rawText.toLowerCase();
    return text.includes('bancolombia') || text.includes('transferencia exitosa') || text.includes('comprobante nro');
  }

  parse(rawText: string): ParsedReceiptResult {
    let monto: number | null = null;
    let referencia: string | null = null;
    let fechaTransaccion: Date | null = null;
    let nombreRemitente: string | null = null;
    let confidence = 0;

    // Extract Monto
    const montoRegex = /(?:Valor|Monto|Total):?\s*\$\s*([\d\.\,]+)/i;
    const fallbackMontoRegex = /\$\s*([\d\.\,]+)/i;
    const montoMatch = rawText.match(montoRegex) || rawText.match(fallbackMontoRegex);
    if (montoMatch && montoMatch[1]) {
      const cleanMonto = montoMatch[1].replace(/\./g, '').replace(/,/g, '.');
      const parsed = parseFloat(cleanMonto);
      if (!isNaN(parsed)) {
        monto = parsed;
        confidence += 0.4;
      }
    }

    // Extract Referencia
    const refRegex = /(?:Comprobante|Número de comprobante|Nro|Ref(?:erencia)?):?\s*([A-Za-z0-9]{6,14})/i;
    const refMatch = rawText.match(refRegex);
    if (refMatch && refMatch[1]) {
      referencia = refMatch[1];
      confidence += 0.3;
    }

    // Extract Fecha
    const dateRegex = /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/i;
    const dateMatch = rawText.match(dateRegex);
    if (dateMatch) {
      try {
        const day = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10) - 1;
        const year = parseInt(dateMatch[3], 10);
        // Force Colombia time (-05:00) parsing, assume noon if no time is provided
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00-05:00`;
        fechaTransaccion = new Date(dateStr);
        confidence += 0.3;
      } catch (e) {
        // Fallback
      }
    }

    // Extract Nombre Remitente
    const remitenteRegex = /(?:De:|Nombre de quien envía:?|Enviado por:?|Cuenta origen:?)\s*([^\n]+)/i;
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
