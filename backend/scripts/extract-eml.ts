import fs from 'fs';
import { EmailParser } from '../src/modules/email-integration/email.parser';

const content = fs.readFileSync('../email_test/¡Recibiste plata por Bre-B!.eml', 'utf8');

// The body is encoded in base64 or quoted-printable or just plain text.
// Let's just find the text/plain or text/html part if any.
// Actually, I can just use a simple regex to get everything after the last header.
const parts = content.split('\r\n\r\n');
const body = parts.slice(1).join('\n');
console.log(EmailParser.sanitizeHtml(body).substring(0, 1000));
