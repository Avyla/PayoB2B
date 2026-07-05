import { parse } from 'date-fns';

function parseColombiaDate(dateStr: string, formatStr: string): Date {
  const parsed = parse(dateStr, formatStr, new Date());
  
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const d = String(parsed.getDate()).padStart(2, '0');
  const h = String(parsed.getHours()).padStart(2, '0');
  const min = String(parsed.getMinutes()).padStart(2, '0');
  
  const isoStr = `${y}-${m}-${d}T${h}:${min}:00-05:00`;
  return new Date(isoStr);
}

const input = '04/07/26 12:58';
const format = 'dd/MM/yy HH:mm';
const rawParsed = parse(input, format, new Date());
const fixedParsed = parseColombiaDate(input, format);

console.log('Raw parse (UTC server simulation):', rawParsed.toISOString());
console.log('Fixed parse (Colombia forced):', fixedParsed.toISOString());
