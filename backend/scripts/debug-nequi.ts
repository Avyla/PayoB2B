import { EmailParser } from '../src/modules/email-integration/email.parser';
const text = "¡Hola, ELIAM AVILA CUESTA! Recibiste 810.000 de ELIAM AVILA CUESTA el 29 de junio de 2026 a la 1:24 p.m. desde el banco Bancolombia. Revisa el detalle en los movimientos de tu app o descarga el comprobante si lo necesitas.";
const res = EmailParser.parse(text, 'notificaciones@nequi.com.co', '¡Recibiste plata por Bre-B!');
console.log(res);
