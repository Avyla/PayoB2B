import { describe, it, expect } from 'vitest';
import { EmailParser } from '../../src/modules/email-integration/email.parser';
import { Banco } from '@prisma/client';

describe('EmailParser', () => {
  it('should parse Nequi email correctly', () => {
    const text = 'Has recibido un pago por $ 50.000. Referencia: 123456789. Saludos de Nequi';
    const result = EmailParser.parse(text, 'notificaciones@nequi.com.co', 'Recibiste plata');
    
    expect(result).not.toBeNull();
    expect(result?.banco).toBe(Banco.NEQUI);
    expect(result?.monto).toBe(50000);
    expect(result?.referencia).toBe('123456789');
  });

  it('should parse Bancolombia email correctly', () => {
    const text = 'Transferencia recibida por $15,500. Comprobante: 987654321. Bancolombia te informa.';
    const result = EmailParser.parse(text, 'alertas@bancolombia.com.co', 'Transferencia recibida');
    
    expect(result).not.toBeNull();
    expect(result?.banco).toBe(Banco.BANCOLOMBIA);
    expect(result?.monto).toBe(15500);
    expect(result?.referencia).toBe('987654321');
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
});
