export function extraerMontoCOP(textoOCR: string): number {
  if (!textoOCR) return 0;
  
  let textoLimpio = textoOCR;

  // 1. Normalización OCR inteligente: Convertimos "O/o" a "0" SOLO cuando actúan como centavos.
  // Buscamos una coma o punto, seguido de espacios o números opcionales, y luego "O/o".
  textoLimpio = textoLimpio.replace(/([.,]\s*\d*)[Oo]+(?=\s|$|[^\wOo])/g, (match) => {
      return match.replace(/[Oo]/g, '0');
  });
  
  // 2. Unificación: Quitamos todos los espacios en blanco
  textoLimpio = textoLimpio.replace(/\s+/g, '');
  
  // 3. Extracción del bloque monetario: 
  // Tomamos la secuencia pura de números y separadores, ignorando textos como COP o M/CTE.
  const match = textoLimpio.match(/[\d.,]+/);
  if (!match) return 0;
  textoLimpio = match[0];
  
  // Limpiamos separadores residuales al final (ej. si extrajo "15.000.")
  textoLimpio = textoLimpio.replace(/[.,]+$/, '');
  
  // 4. El Francotirador: Si termina en punto o coma seguido de EXACTAMENTE 2 dígitos, amputa la cola.
  textoLimpio = textoLimpio.replace(/[.,]\d{2}$/, '');
  
  // 5. Aspiradora Final: Borra todos los símbolos restantes
  textoLimpio = textoLimpio.replace(/\D/g, '');
  
  // Devolvemos el número final validado
  return Number(textoLimpio) || 0;
}
