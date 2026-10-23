import { expect, test, describe } from 'bun:test';
import { formatBdt, round2 } from '../format';

describe('formatBdt', () => {
  test('formats numbers with lakh grouping', () => {
    expect(formatBdt(910500)).toBe('৳9,10,500');
    expect(formatBdt(8287.5)).toBe('৳8,287.50');
    expect(formatBdt(1234567)).toBe('৳12,34,567');
    expect(formatBdt(12345678)).toBe('৳1,23,45,678');
  });

  test('handles zero and negatives sanely', () => {
    expect(formatBdt(0)).toBe('৳0');
    expect(formatBdt(-8287.5)).toBe('-৳8,287.50');
  });
});

describe('round2', () => {
  test('rounds half-up at 2dp with epsilon guard', () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(1.004)).toBe(1.00);
  });
});
