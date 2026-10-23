export function round2(x: number): number {
  return Math.round(x * 100 + 1e-9) / 100;
}

export function formatBdt(n: number): string {
  const isNegative = n < 0;
  const absN = Math.abs(n);
  const fixed = round2(absN).toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  let resultInt = '';
  let count = 0;
  for (let i = intPart.length - 1; i >= 0; i--) {
    resultInt = intPart[i] + resultInt;
    count++;
    if (i !== 0 && ((count === 3) || (count > 3 && (count - 3) % 2 === 0))) {
      resultInt = ',' + resultInt;
    }
  }
  const result = `৳${resultInt}${decPart === '00' ? '' : '.' + decPart}`;
  return isNegative ? `-${result}` : result;
}
