# Contract: OCR Parser Interface & Regex Contracts

Definición de contratos TypeScript y reglas de extracción para los comprobantes bancarios de Nequi y Bancolombia.

## TypeScript Interface Definition

```typescript
export type BankType = 'NEQUI' | 'BANCOLOMBIA' | 'DESCONOCIDO';

export interface ParsedReceiptResult {
  banco: BankType;
  monto: number | null;
  referencia: string | null;
  fechaTransaccion: Date | null;
  rawText: string;
  confidenceScore: number; // 0.0 a 1.0 basado en concordancia de campos
}

export interface ReceiptParser {
  canParse(rawText: string): boolean;
  parse(rawText: string): ParsedReceiptResult;
}
```

---

## Parser Logic Specifications

### 1. Nequi Parser (`NequiReceiptParser`)
- **Detección de Banco**: La cadena contiene palabras clave como `"Nequi"`, `"¡Envío exitoso!"`, `"Comprobante"`.
- **Reglas Regex**:
  - **Monto**: Captura patrones como `/\$\s*([\d\.\,]+)/i` o `(?:¿Cuánto\?:?|Monto:?)\s*\$\s*([\d\.\,]+)/i`. Formatea eliminando puntos de miles y convirtiendo coma a decimal.
  - **Referencia**: Captura patrones como `(?:M-?|Ref:?|Comprobante:?)\s*([A-Z0-9]{6,12})/i`.
  - **Fecha**: Captura patrones como `(\d{1,2}\s+de\s+[a-z]+\.?\s+de\s+\d{4}\s+-\s+\d{1,2}:\d{2}\s*(?:a\.?m\.?|p\.?m\.?))/i`.

### 2. Bancolombia Parser (`BancolombiaReceiptParser`)
- **Detección de Banco**: La cadena contiene palabras clave como `"Bancolombia"`, `"Transferencia exitosa"`, `"Comprobante Nro"`.
- **Reglas Regex**:
  - **Monto**: Captura patrones como `(?:Valor|Monto):?\s*\$\s*([\d\.\,]+)/i` o `\$\s*([\d\.\,]+)/i`.
  - **Referencia**: Captura patrones como `(?:Comprobante|Número de comprobante|Nro|Ref):?\s*(\d{6,12})/i`.
  - **Fecha**: Captura patrones de fecha estándar colombianos (e.g. `\d{2}\/\d{2}\/\d{4}` o `\d{1,2}\s+[A-Za-z]{3}\s+\d{4}`).

### 3. Graceful Fallback (`FallbackReceiptParser`)
Si el texto no coincide con patrones específicos o la API de Vision retorna confianza baja:
- Retorna `banco: 'DESCONOCIDO'`, `monto: null`, `referencia: null`, `fechaTransaccion: null`.
- El controlador registrará la transacción en estado `"SUBIDO_SIN_VERIFICAR"` para revisión manual en el Dashboard B2B.
