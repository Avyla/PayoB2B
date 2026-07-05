import { describe, it, expect } from 'vitest';
import { EmailParser } from '../../src/modules/email-integration/email.parser';
import { Banco } from '@prisma/client';

describe('EmailParser', () => {
  it('should parse Nequi email correctly', () => {
    const text = 'Has recibido un pago por $ 50.000. Referencia: 123456789. Saludos de Nequi';
    const result = EmailParser.parse(text, 'notificaciones@nequi.com.co', 'Recibiste plata');
    
    expect(result).not.toBeNull();
    if (result && result.success) {
      expect(result.data.banco).toBe(Banco.NEQUI);
      expect(result.data.monto).toBe(50000);
      expect(result.data.referencia).toBe('123456789');
    }
  });

  it('should parse Bancolombia email correctly', () => {
    const text = 'Transferencia por $15,500 de Juan Perez en tu cuenta el 12/05/2024 a las 14:30. Comprobante: 987654321. Bancolombia te informa.';
    const result = EmailParser.parse(text, 'alertas@bancolombia.com.co', 'Transferencia recibida');
    
    expect(result).not.toBeNull();
    if (result && result.success) {
      expect(result.data.banco).toBe(Banco.BANCOLOMBIA);
      expect(result.data.monto).toBe(15500);
      expect(result.data.referencia).toBeNull();
    }
  });

  it('should return null for unknown sender', () => {
    const text = 'Transferencia recibida por $15,500. Comprobante: 987654321.';
    const result = EmailParser.parse(text, 'desconocido@correo.com', 'Transferencia');
    
    expect(result).toBeNull();
  });

  it('should return null if regex fails to match', () => {
    const text = 'Hola, esto es un correo sin datos.';
    const result = EmailParser.parse(text, 'notificaciones@nequi.com.co', 'Aviso');
    
    expect(result).toBeNull();
  });
  it('should parse Bancolombia Bre-B email correctly', () => {
    const text = 'recibiste plata por breve hola Eliam Avila Cuesta recibiste 7685 de Eliam Avila Cuesta el 4 de julio de 2026 a las 2:03 p.m.';
    const result = EmailParser.parse(text, 'alertasynotificaciones@an.notificacionesbancolombia.com', 'Notificacion');
    
    expect(result).not.toBeNull();
    if (result && result.success) {
      expect(result.data.banco).toBe(Banco.BANCOLOMBIA);
      expect(result.data.monto).toBe(7685);
      expect(result.data.nombre_remitente).toBe('Eliam Avila Cuesta');
      // UTC time corresponding to Colombia time 14:03 (2:03 pm)
      expect(result.data.fechaTransaccion.toISOString()).toBe('2026-07-04T19:03:00.000Z');
    }
  });
});
