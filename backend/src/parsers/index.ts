export type BankType = 'NEQUI' | 'BANCOLOMBIA' | 'OTROS_BANCOS';

export interface ParsedReceiptResult {
  banco: BankType;
  monto: number | null;
  referencia: string | null;
  fechaTransaccion: Date | null;
  nombreRemitente?: string | null;
  rawText: string;
  confidenceScore: number;
}

export interface ReceiptParser {
  canParse(rawText: string): boolean;
  parse(rawText: string): ParsedReceiptResult;
}

import { NequiReceiptParser } from './nequi.parser';
import { BancolombiaReceiptParser } from './bancolombia.parser';

export class ReceiptParserDispatcher {
  private parsers: ReceiptParser[];

  constructor() {
    this.parsers = [
      new NequiReceiptParser(),
      new BancolombiaReceiptParser(),
    ];
  }

  parse(rawText: string): ParsedReceiptResult {
    for (const parser of this.parsers) {
      if (parser.canParse(rawText)) {
        return parser.parse(rawText);
      }
    }

    // Fallback
    return {
      banco: 'OTROS_BANCOS',
      monto: null,
      referencia: null,
      fechaTransaccion: null,
      nombreRemitente: null,
      rawText,
      confidenceScore: 0,
    };
  }
}
