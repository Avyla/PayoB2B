import fs from 'fs';
import path from 'path';
import { EmailParser } from '../src/modules/email-integration/email.parser';

const testDir = path.join(__dirname, '../../email_test');

function readFilesRecursively(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      readFilesRecursively(filePath, fileList);
    } else if (file.endsWith('.eml') || file.endsWith('.txt')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = readFilesRecursively(testDir);
console.log(`Encontrados ${allFiles.length} archivos para probar.`);

let success = 0;
let fail = 0;
let ignored = 0;

for (const filePath of allFiles) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Try to parse it, some files might contain multiple emails concatenated (like the ones from Nequi)
  const emails = content.includes('De:') ? content.split('\nDe:') : [content];
  
  for (let i = 0; i < emails.length; i++) {
    let emailText = emails[i];
    if (i > 0) emailText = 'De:' + emailText; // Restore the 'De:' removed by split
    
    if (emailText.length < 50) continue;
    
    // Determine sender based on file name or content just for simulation
    const sender = emailText.toLowerCase().includes('nequi') ? 'notificaciones@nequi.com.co' : 'bancolombia@bancolombia.com';
    const subject = emailText.match(/Asunto:\s*(.*)/)?.[1] || '';

    const result = EmailParser.parse(emailText, sender, subject);
    
    const fileName = path.basename(filePath);
    if (result && result.success) {
      console.log(`[PASS] ${fileName} (Parte ${i+1}): ${result.data.banco} | $${result.data.monto} | Remitente: ${result.data.nombre_remitente} | Fecha: ${result.data.fechaTransaccion.toISOString()}`);
      success++;
    } else if (result && !result.success) {
      console.log(`[IGNORE] ${fileName} (Parte ${i+1}) fue descartado correctamente por contexto: ${result.reason}`);
      ignored++;
    } else {
      console.log(`[FAIL] ${fileName} (Parte ${i+1}) no pudo ser parseado.`);
      fail++;
    }
  }
}

console.log(`\nResultados: ${success} exitosos, ${ignored} descartados, ${fail} fallidos.`);

if (fail > 0) process.exit(1);
