const extract = (m1) => {
  const cleaned = m1.replace(/[,.]00$/, '').replace(/[^\d]/g, '');
  return parseFloat(cleaned);
}
console.log('1,000.00 ->', extract('1,000.00'));
console.log('2,558,100.00 ->', extract('2,558,100.00'));
console.log('100.000 ->', extract('100.000'));
console.log('25.000,00 ->', extract('25.000,00'));
