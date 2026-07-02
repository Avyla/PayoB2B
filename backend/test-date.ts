import { parse } from 'date-fns';

const dateA = parse('30/06/26 21:33', 'dd/MM/yy HH:mm', new Date());
const dateB = parse('27/05/2026 12:20', 'dd/MM/yyyy HH:mm', new Date());

console.log('Date A:', dateA.toISOString());
console.log('Date B:', dateB.toISOString());
