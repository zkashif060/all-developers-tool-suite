import { describe, it, expect } from 'vitest';
import {
  validateCronExpression,
  explainCron
} from './cron-builder.engine';

describe('Cron Builder Engine', () => {
  it('should validate every-minute expression (* * * * *)', () => {
    const result = validateCronExpression('* * * * *');
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.humanExplanation).toBe('Every minute');
      expect(result.fields).toEqual(['*', '*', '*', '*', '*']);
    }
  });

  it('should validate hourly expression (0 * * * *)', () => {
    const result = validateCronExpression('0 * * * *');
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.humanExplanation).toBe('Every hour, at minute 0');
    }
  });

  it('should validate daily at midnight expression (0 0 * * *)', () => {
    const result = validateCronExpression('0 0 * * *');
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.humanExplanation).toBe('Every day at midnight (00:00)');
    }
  });

  it('should validate weekly expression (0 0 * * 1)', () => {
    const result = validateCronExpression('0 0 * * 1');
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.humanExplanation).toBe('At 00:00 every Monday');
    }
  });

  it('should validate first day of month expression (0 0 1 * *)', () => {
    const result = validateCronExpression('0 0 1 * *');
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.humanExplanation).toBe('At 00:00 on day 1 of every month');
    }
  });

  it('should validate step values (*/15 * * * *)', () => {
    const result = validateCronExpression('*/15 * * * *');
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.humanExplanation).toBe('Every 15 minutes');
    }
  });

  it('should validate lists and ranges (1,15,30 * * * 1-5)', () => {
    const result = validateCronExpression('1,15,30 9 * * 1-5');
    expect(result.valid).toBe(true);
  });

  it('should support standard month and weekday names', () => {
    const result = validateCronExpression('0 12 1 JAN MON');
    expect(result.valid).toBe(true);
  });

  it('should reject invalid field counts (4 fields or 6 fields)', () => {
    const fourFields = validateCronExpression('* * * *');
    expect(fourFields.valid).toBe(false);
    if (!fourFields.valid) {
      expect(fourFields.error).toContain('Found 4 fields');
    }

    const sixFields = validateCronExpression('* * * * * *');
    expect(sixFields.valid).toBe(false);
    if (!sixFields.valid) {
      expect(sixFields.error).toContain('Found 6 fields');
    }
  });

  it('should reject out-of-range values in fields', () => {
    // Minute 60 is invalid (0-59)
    const invalidMinute = validateCronExpression('60 * * * *');
    expect(invalidMinute.valid).toBe(false);
    if (!invalidMinute.valid) {
      expect(invalidMinute.error).toContain('Minute');
    }

    // Hour 24 is invalid (0-23)
    const invalidHour = validateCronExpression('0 24 * * *');
    expect(invalidHour.valid).toBe(false);
    if (!invalidHour.valid) {
      expect(invalidHour.error).toContain('Hour');
    }

    // Month 13 is invalid (1-12)
    const invalidMonth = validateCronExpression('0 0 1 13 *');
    expect(invalidMonth.valid).toBe(false);
    if (!invalidMonth.valid) {
      expect(invalidMonth.error).toContain('Month');
    }
  });

  it('should reject unsupported syntax and characters', () => {
    const invalidSyntax = validateCronExpression('@daily');
    expect(invalidSyntax.valid).toBe(false);

    const invalidChar = validateCronExpression('0 0 ? * *');
    expect(invalidChar.valid).toBe(false);
  });

  it('should reject empty or whitespace input', () => {
    const result = validateCronExpression('   ');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('empty');
    }
  });

  it('should generate meaningful human explanation', () => {
    expect(explainCron(['0', '12', '*', '*', '*'])).toBe('Every day at noon (12:00)');
    expect(explainCron(['0', '9', '*', '*', '1-5'])).toBe('At 09:00, Monday through Friday');
  });
});

