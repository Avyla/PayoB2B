import { expect, test, describe } from 'vitest';
import { NequiReceiptParser } from '../../src/parsers/nequi.parser';
import { BancolombiaReceiptParser } from '../../src/parsers/bancolombia.parser';
import { ReceiptParserDispatcher } from '../../src/parsers/index';

describe('OCR Parsers', () => {
  const dispatcher = new ReceiptParserDispatcher();

  // ─── Nequi Parser ──────────────────────────────────────────────────────────

  describe('NequiReceiptParser', () => {
    const parser = new NequiReceiptParser();

    test('canParse: detects standard Nequi receipt ("¡Envío exitoso!")', () => {
      expect(parser.canParse('¡Envío exitoso!\n$ 1.500.000,50')).toBe(true);
    });

    test('canParse: detects Nequi receipt with "¿Cuánto?" label', () => {
      // Real Nequi app screenshot (WhatsApp photos in /Comprobantes)
      const raw = `Detalle del movimiento\nEnvío Realizado\n¡Escanea este QR con Nequi para verificar tu envío al instante!\nPara\nBlanca Grajales\n¿Cuánto?\n$ 19.500,00\nNúmero Nequi\n316 363 2517\nFecha\n09 de mayo de 2026 a las 07:06 p.m.\nReferencia\nM22984341`;
      expect(parser.canParse(raw)).toBe(true);
    });

    test('canParse: does NOT trigger on Bancolombia receipt that mentions "Nequi" as destination', () => {
      // Bancolombia receipt from /Comprobantes/PHOTO-2026-01-28-21-02-48.jpg
      const bancolombia = `¡Transferencia exitosa!\nComprobante No. 54V017TBJ1\n28 Ene 2026 - 09:02 p.m.\nDatos de la transferencia\nValor de la transferencia\n$ 630.000\nProducto destino\nNequi\n3234134770`;
      expect(parser.canParse(bancolombia)).toBe(false);
    });

    test('parse: extracts monto, referencia and fecha from real Nequi OCR text', () => {
      // Mirrors real OCR from db_out.json transaction 486ee9c6
      const raw = `11:00\nAlertas y Notificaciones\n¡Listo! Todo salió bien con tus\nBancolombia: ELIAM, recibiste una re\nEnvío realizado\nPara\nEscanea este QR con Nequi para verificar tu envio al instante!\nEliam Avila Cuesta\nLlave\n@Eliam858\nBanco destino\nBancolombia\nFecha\n30 de junio de 2026 a las 10:59 p.m.\n¿Cuánto?\n$1.000,00\nReferencia\nM31356407\n¿Desde donde se hizo el envío?\n315 239 1956\n¿De dónde salió la plata?\nDisponible`;
      expect(parser.canParse(raw)).toBe(true);
      const result = parser.parse(raw);
      expect(result.banco).toBe('NEQUI');
      expect(result.monto).toBe(1000);
      expect(result.referencia).toBe('M31356407');
      expect(result.fechaTransaccion).not.toBeNull();
      expect(result.fechaTransaccion?.getMonth()).toBe(5); // junio = 5
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0.7);
    });

    test('parse: nombre_remitente es null cuando sólo hay número de teléfono', () => {
      // El número de teléfono no debe ser capturado como nombre remitente
      const raw = `Envío realizado\n¿Cuánto?\n$ 1.000,00\nReferencia\nM31356407\n¿Desde donde se hizo el envío?\n315 239 1956`;
      const result = parser.parse(raw);
      expect(result.nombreRemitente).toBeNull();
    });

    test('parse: extracts standard values from legacy format', () => {
      const rawText = `¡Envío exitoso!\nMonto\n$ 1.500.000,50\nReferencia\nM-123456789\n14 de ene. de 2024 - 10:20 am`;
      const result = parser.parse(rawText);
      expect(result.banco).toBe('NEQUI');
      expect(result.monto).toBe(1500000);
      // "M-123456789" → the dash separates the M prefix; parser captures the numeric part
      expect(result.referencia).toBe('123456789');
    });
  });

  // ─── Bancolombia Parser ────────────────────────────────────────────────────

  describe('BancolombiaReceiptParser', () => {
    const parser = new BancolombiaReceiptParser();

    test('canParse: detects Bancolombia receipt ("¡Transferencia exitosa!")', () => {
      // Real format from /Comprobantes/PHOTO-2025-08-24-21-25-40.jpg
      const raw = `¡Transferencia exitosa!\nComprobante No. 0000094234\n24 Ago 2025 - 09:25 p.m.\nValor de la transferencia\n$ 62.000`;
      expect(parser.canParse(raw)).toBe(true);
    });

    test('canParse: detects Bancolombia receipt with "Comprobante No." alpha code', () => {
      // From /Comprobantes/PHOTO-2026-01-28-21-02-48.jpg (alphanumeric)
      const raw = `¡Transferencia exitosa!\nComprobante No. 54V017TBJ1\n28 Ene 2026 - 09:02 p.m.`;
      expect(parser.canParse(raw)).toBe(true);
    });

    test('canParse: does NOT trigger on Nequi receipt that mentions "Bancolombia" as destination', () => {
      // Mirrors real OCR text from db_out.json (Nequi→Bancolombia transfer)
      const nequi = `Envío realizado\n¡Escanea este QR con Nequi para verificar tu envio al instante!\n¿Cuánto?\n$1.000,00\nBanco destino\nBancolombia`;
      expect(parser.canParse(nequi)).toBe(false);
    });

    test('parse: extracts monto from "Valor de la transferencia" format', () => {
      const raw = `¡Transferencia exitosa!\nComprobante No. 54V017TBJ1\n28 Ene 2026 - 09:02 p.m.\nDatos de la transferencia\nValor de la transferencia\n$ 630.000\nProducto destino\nNequi\n3234134770`;
      expect(parser.canParse(raw)).toBe(true);
      const result = parser.parse(raw);
      expect(result.banco).toBe('BANCOLOMBIA');
      expect(result.monto).toBe(630000);
      expect(result.referencia).toBe('54V017TBJ1');
    });

    test('parse: parses abbreviated date "28 Ene 2026 - 09:02 p.m."', () => {
      const raw = `¡Transferencia exitosa!\nComprobante No. 54V017TBJ1\n28 Ene 2026 - 09:02 p.m.\nValor de la transferencia\n$ 630.000`;
      const result = parser.parse(raw);
      expect(result.fechaTransaccion).not.toBeNull();
      expect(result.fechaTransaccion?.getDate()).toBe(28);
      expect(result.fechaTransaccion?.getMonth()).toBe(0); // enero = 0
      expect(result.fechaTransaccion?.getFullYear()).toBe(2026);
    });

    test('parse: extracts standard numeric date', () => {
      const rawText = `Transferencia exitosa\nBancolombia\nValor $ 500.000\nComprobante Nro 987654321\n12/05/2024`;
      const result = parser.parse(rawText);
      expect(result.banco).toBe('BANCOLOMBIA');
      expect(result.monto).toBe(500000);
      expect(result.referencia).toBe('987654321');
    });

    // ── Bre-B format tests ───────────────────────────────────────────────────

    test('parse Bre-B: Tier 2 extrae monto correcto aunque "$ 0.00" aparezca después', () => {
      // Mirrors the real photo: "Valor de la transferencia\n$ 7.685\nCosto de la transferencia\n$ 0.00"
      const raw = `¡Transferencia exitosa!\nComprobante No. TRcNbMnm6ZEC\n04 jul 2026 - 2:03 p.m.\nValor de la transferencia\n$ 7.685\nCosto de la transferencia\n$ 0.00\n¿A quién le llegó la plata?\nEnviado a   ELIAM AVILA CUESTA\nCelular\n3152391956`;
      expect(parser.canParse(raw)).toBe(true);
      const result = parser.parse(raw);
      expect(result.banco).toBe('BANCOLOMBIA');
      expect(result.monto).toBe(7685);           // Tier 2 captura 7.685, no 0.00
      expect(result.referencia).toBe('TRcNbMnm6ZEC');
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0.7);
    });

    test('parse Bre-B: Tier 2 funciona con \\r\\n (Windows line endings del OCR)', () => {
      // OCR en entornos Windows puede retornar \r\n en lugar de \n
      const raw = `¡Transferencia exitosa!\r\nComprobante No. TRcNbMnm6ZEC\r\nValor de la transferencia\r\n$ 7.685\r\nCosto de la transferencia\r\n$ 0.00`;
      const result = parser.parse(raw);
      expect(result.monto).toBe(7685);
    });

    test('parse Bre-B: nombreRemitente es null porque "Enviado a" es el DESTINATARIO, no el remitente', () => {
      // En el formato Bre-B el remitente (quien envía) NO aparece en pantalla.
      // "Enviado a: ELIAM AVILA CUESTA" es a QUIÉN le llegó la plata (destinatario).
      // Capturarlo como remitente sería un error semántico.
      const raw = `¡Transferencia exitosa!\nComprobante No. TRcNbMnm6ZEC\n04 jul 2026 - 2:03 p.m.\nValor de la transferencia\n$ 7.685\nEnviado a   ELIAM AVILA CUESTA\nCelular\n3152391956`;
      const result = parser.parse(raw);
      expect(result.nombreRemitente).toBeNull(); // Correcto: el remitente no es visible en Bre-B
    });
  });


  // ─── Dispatcher ────────────────────────────────────────────────────────────

  describe('ReceiptParserDispatcher', () => {
    test('Dispatcher routes Nequi receipt correctly', () => {
      const raw = `Envío Realizado\n¿Cuánto?\n$ 19.500,00\nNúmero Nequi\n316 363 2517\nFecha\n09 de mayo de 2026 a las 07:06 p.m.\nReferencia\nM22984341`;
      const result = dispatcher.parse(raw);
      expect(result.banco).toBe('NEQUI');
    });

    test('Dispatcher routes Bancolombia receipt correctly', () => {
      const raw = `¡Transferencia exitosa!\nComprobante No. 2SMXASJAYG\n05 Dic 2025 - 01:07 p.m.\nValor de la transferencia\n$ 10.700\nProducto destino\nNequi\n3173621297`;
      const result = dispatcher.parse(raw);
      expect(result.banco).toBe('BANCOLOMBIA');
    });

    test('Dispatcher handles unknown formats', () => {
      const rawText = `Ticket de compra supermercado $ 20.000`;
      const result = dispatcher.parse(rawText);
      expect(result.banco).toBe('OTROS_BANCOS');
      expect(result.monto).toBeNull();
    });

    test('Dispatcher: Nequi receipt with "Banco destino: Bancolombia" is NOT misclassified as Bancolombia', () => {
      // Critical case: this was the bug — Nequi receipt that mentions "Bancolombia" as destination
      const raw = `Envío realizado\nEscanea este QR con Nequi para verificar tu envio al instante!\n¿Cuánto?\n$1.000,00\nReferencia\nM31356407\nBanco destino\nBancolombia`;
      const result = dispatcher.parse(raw);
      expect(result.banco).toBe('NEQUI');
    });
  });
});
