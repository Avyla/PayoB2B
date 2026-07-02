const text1 = '¡Listo! Todo salió bien con tus movimientos Bancolombia: ELIAM, recibiste una transferencia de ELIAM AVILA CUESTA por $1,000.00 en tu cuenta *3128 conectada a la llave @eliam858 el 30/06/26 a las 21:33. Con llaves es de una y gratis.';
const text2 = '¡Listo! Todo salió bien con tus movimientos Bancolombia: Recibiste un pago por $2,558,100.00 de Page Interim Co a tu cuenta AHORROS, el 12:20 a las 27/05/2026.';

const remitenteMatch1 = text1.match(/(?:transferencia|pago)\s+de\s+([a-zA-Z\s]+?)\s+por\s+\$/i) || text1.match(/(?:transferencia|pago)\s+por\s+\$[\d.,]+\s+de\s+([a-zA-Z\s]+?)\s+(?:a tu|en tu)/i);
const remitenteMatch2 = text2.match(/(?:transferencia|pago)\s+de\s+([a-zA-Z\s]+?)\s+por\s+\$/i) || text2.match(/(?:transferencia|pago)\s+por\s+\$[\d.,]+\s+de\s+([a-zA-Z\s]+?)\s+(?:a tu|en tu)/i);

console.log('New 1:', remitenteMatch1 ? remitenteMatch1[1] : null);
console.log('New 2:', remitenteMatch2 ? remitenteMatch2[1] : null);
