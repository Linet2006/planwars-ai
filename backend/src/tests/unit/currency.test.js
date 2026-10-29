import { describe, expect, it } from 'vitest';
import { formatINR, formatINRShorthand, parseINR } from '../../utils/currency.js';

describe('Currency Utility (Indian Rupee INR)', () => {
  it('formats standard Indian rupee amounts with lakh and crore commas', () => {
    expect(formatINR(0)).toBe('₹0');
    expect(formatINR(500)).toBe('₹500');
    expect(formatINR(25000)).toBe('₹25,000');
    expect(formatINR(100000)).toBe('₹1,00,000'); // 1 Lakh
    expect(formatINR(2500000)).toBe('₹25,00,000'); // 25 Lakhs
    expect(formatINR(15000000)).toBe('₹1,50,00,000'); // 1.5 Crores
  });

  it('handles negative amounts and optional symbols', () => {
    expect(formatINR(-50000)).toBe('-₹50,000');
    expect(formatINR(2500000, false)).toBe('25,00,000');
    expect(formatINR(null)).toBe('₹0');
    expect(formatINR(NaN)).toBe('₹0');
  });

  it('formats shorthand lakh and crore strings', () => {
    expect(formatINRShorthand(2500000)).toBe('₹25 L');
    expect(formatINRShorthand(15000000)).toBe('₹1.5 Cr');
    expect(formatINRShorthand(75000)).toBe('₹75 K');
    expect(formatINRShorthand(500)).toBe('₹500');
  });

  it('parses diverse Indian currency inputs into integer amounts', () => {
    expect(parseINR('₹25,00,000')).toBe(2500000);
    expect(parseINR('25 Lakhs')).toBe(2500000);
    expect(parseINR('2.5L')).toBe(250000);
    expect(parseINR('1.5 Crore')).toBe(15000000);
    expect(parseINR('50k')).toBe(50000);
    expect(parseINR(5000)).toBe(5000);
    expect(parseINR('invalid')).toBe(0);
  });
});

