import { expect, test, describe } from 'vitest';
import { NequiReceiptParser } from '../../src/parsers/nequi.parser';
import { BancolombiaReceiptParser } from '../../src/parsers/bancolombia.parser';
import { ReceiptParserDispatcher } from '../../src/parsers/index';

describe('OCR Parsers', () => {
  const dispatcher = new ReceiptParserDispatcher();

  test('Nequi Parser extracts correct values', () => {
    const rawText = `¡Envío exitoso!
Monto
$ 1.500.000,50
Referencia
M-123456789
14 de ene. de 2024 - 10:20 am`;

    const parser = new NequiReceiptParser();
    expect(parser.canParse(rawText)).toBe(true);

    const result = parser.parse(rawText);
    expect(result.banco).toBe('NEQUI');
    expect(result.monto).toBe(1500000.50);
    expect(result.referencia).toBe('123456789');
  });

  test('Bancolombia Parser extracts correct values', () => {
    const rawText = `Transferencia exitosa
Bancolombia
Valor $ 500.000
Comprobante Nro 987654321
12/05/2024`;

    const parser = new BancolombiaReceiptParser();
    expect(parser.canParse(rawText)).toBe(true);

    const result = parser.parse(rawText);
    expect(result.banco).toBe('BANCOLOMBIA');
    expect(result.monto).toBe(500000);
    expect(result.referencia).toBe('987654321');
  });

  test('Dispatcher handles unknown formats', () => {
    const rawText = `Ticket de compra supermercado $ 20.000`;
    const result = dispatcher.parse(rawText);
    expect(result.banco).toBe('OTROS_BANCOS');
    expect(result.monto).toBeNull();
  });
});
