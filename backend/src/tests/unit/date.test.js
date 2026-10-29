import { describe, expect, it } from 'vitest';
import {
  calculateBackScheduledDate,
  formatDateDDMMYYYY,
  getDaysDifference,
  normalizeDateToISO,
  shiftDate
} from '../../utils/date.js';

describe('Date Utility (DD/MM/YYYY and Scheduling)', () => {
  it('formats dates to DD/MM/YYYY format', () => {
    expect(formatDateDDMMYYYY('2026-12-15')).toBe('15/12/2026');
    expect(formatDateDDMMYYYY('2026-01-05')).toBe('05/01/2026');
    expect(formatDateDDMMYYYY(null)).toBe('');
    expect(formatDateDDMMYYYY('invalid')).toBe('');
  });

  it('normalizes DD/MM/YYYY strings to ISO YYYY-MM-DD', () => {
    expect(normalizeDateToISO('15/12/2026')).toBe('2026-12-15');
    expect(normalizeDateToISO('05/01/2026')).toBe('2026-01-05');
    expect(normalizeDateToISO('2026-12-15')).toBe('2026-12-15');
  });

  it('calculates days difference correctly', () => {
    expect(getDaysDifference('2026-12-01', '2026-12-15')).toBe(14);
    expect(getDaysDifference('2026-12-15', '2026-12-01')).toBe(-14);
  });

  it('shifts dates forward and backward', () => {
    expect(shiftDate('2026-12-15', 7)).toBe('2026-12-22');
    expect(shiftDate('2026-12-15', -14)).toBe('2026-12-01');
  });

  it('calculates back-scheduled dates from event date', () => {
    // 90 days before 2026-12-15
    const backScheduled = calculateBackScheduledDate('2026-12-15', 90);
    expect(backScheduled).toBe('2026-09-16');
  });
});

