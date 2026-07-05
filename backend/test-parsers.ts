import { ReceiptParserDispatcher } from './src/parsers/index';

const text = `
¡Transferencia exitosa!
Comprobante No. TRcNbMnm6ZEC
04 jul 2026 - 2:03 p.m.
Valor de la transferencia
$ 7.685
notificaciones@nequi.com.co
`;

const dispatcher = new ReceiptParserDispatcher();
const result = dispatcher.parse(text);
console.log(JSON.stringify(result, null, 2));
