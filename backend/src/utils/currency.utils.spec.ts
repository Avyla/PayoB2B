import { describe, it, expect } from 'vitest';
import { extraerMontoCOP } from './currency.utils';

describe('extraerMontoCOP', () => {
  it('Debe extraer montos perfectos', () => {
    expect(extraerMontoCOP('$ 15.000,00')).toBe(15000);
    expect(extraerMontoCOP('15000')).toBe(15000);
  });

  it('Debe limpiar basura bancaria al final', () => {
    expect(extraerMontoCOP('$ 15.000,00 COP')).toBe(15000);
    expect(extraerMontoCOP('$ 15.000,00.')).toBe(15000);
    expect(extraerMontoCOP('TOTAL: 15.000,00 M/CTE')).toBe(15000);
  });

  it('Debe manejar fallos de OCR (O en lugar de ceros y espacios rotos)', () => {
    expect(extraerMontoCOP('$ 15.000,OO')).toBe(15000);
    expect(extraerMontoCOP('$ 15 000 , OO')).toBe(15000);
    expect(extraerMontoCOP('$ 15 000 , 0o')).toBe(15000);
  });

  it('Debe manejar formatos de USA y decimales', () => {
    expect(extraerMontoCOP('$1,000.00')).toBe(1000);
    expect(extraerMontoCOP('1,250.50')).toBe(1250); // Asumiendo que 50 son centavos, se amputan
  });

  it('Debe proteger montos bajos o cerrados sin decimales', () => {
    expect(extraerMontoCOP('100')).toBe(100);
    expect(extraerMontoCOP('$ 1.500')).toBe(1500);
  });

  it('Debe devolver 0 para textos vacíos o nulos', () => {
    expect(extraerMontoCOP('')).toBe(0);
    expect(extraerMontoCOP(null as any)).toBe(0);
  });
});
