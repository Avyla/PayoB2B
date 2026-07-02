import fs from 'fs';
import path from 'path';
import { EmailParser } from '../src/modules/email-integration/email.parser';

const mdPath = path.join(__dirname, '../../email_test/FallosReportados.md');
const content = fs.readFileSync(mdPath, 'utf8');

const emails = content.split('\n\n').map(e => e.replace(/^\d+:\s*/, '').trim()).filter(e => e.length > 50);

console.log(`Encontrados ${emails.length} correos para probar.`);

let success = 0;
let fail = 0;
let ignored = 0;

for (let i = 0; i < emails.length; i++) {
  const emailText = emails[i];
  const result = EmailParser.parse(emailText, 'bancolombia@bancolombia.com', 'Movimientos Bancolombia');
  
  if (result && result.success) {
    console.log(`[PASS] Correo ${i + 1}: ${result.data.banco} | $${result.data.monto} | Remitente: ${result.data.nombre_remitente} | Fecha: ${result.data.fechaTransaccion.toISOString()}`);
    success++;
  } else if (result && !result.success) {
    console.log(`[IGNORE] Correo ${i + 1} fue descartado correctamente por contexto: ${result.reason}`);
    ignored++;
  } else {
    console.log(`[FAIL] Correo ${i + 1} no pudo ser parseado.`);
    console.log(`Fragmento: ${emailText.substring(0, 100)}...`);
    fail++;
  }
}

console.log(`\nResultados: ${success} exitosos, ${ignored} descartados, ${fail} fallidos.`);

if (fail > 0) process.exit(1);
