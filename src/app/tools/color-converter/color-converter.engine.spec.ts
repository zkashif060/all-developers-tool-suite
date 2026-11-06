import { describe, it, expect } from 'vitest';
import {
  parseColor,
  convertColor,
  checkContrast,
  generateHarmonies,
  generateTintsAndShades,
  rgbaToOklch,
  oklchToRgba
} from './color-converter.engine';

describe('ColorConverterEngine', () => {
  it('should parse 3-digit, 6-digit and 8-digit hex codes', () => {
    const c3 = parseColor('#f00');
    expect(c3).toEqual({ r: 255, g: 0, b: 0, a: 1 });

    const c6 = parseColor('#3b82f6');
    expect(c6).toEqual({ r: 59, g: 130, b: 246, a: 1 });

    const c8 = parseColor('#00ff0080');
    expect(c8?.r).toBe(0);
    expect(c8?.g).toBe(255);
    expect(c8?.b).toBe(0);
    expect(c8?.a).toBeCloseTo(0.5, 1);
  });

  it('should parse rgb and rgba format strings', () => {
    const rgb = parseColor('rgb(100, 150, 200)');
    expect(rgb).toEqual({ r: 100, g: 150, b: 200, a: 1 });

    const rgba = parseColor('rgba(255, 0, 128, 0.75)');
    expect(rgba).toEqual({ r: 255, g: 0, b: 128, a: 0.75 });
  });

  it('should parse hsl and hsla format strings', () => {
    const hsl = parseColor('hsl(0, 100%, 50%)');
    expect(hsl?.r).toBe(255);
    expect(hsl?.g).toBe(0);
    expect(hsl?.b).toBe(0);
  });

  it('should convert color to all standard representations', () => {
    const res = convertColor('#3b82f6');
    expect(res).toBeDefined();
    expect(res?.hex).toBe('#3b82f6');
    expect(res?.rgb).toBe('rgb(59, 130, 246)');
    expect(res?.hsl).toBe('hsl(217, 91%, 60%)');
    expect(res?.oklch).toContain('oklch(');
    expect(res?.cmyk).toBeDefined();
  });

  it('should accurately compute WCAG 2.1 contrast ratios and compliance', () => {
    // Black on White: ~21:1 (AAA)
    const blackOnWhite = checkContrast('#000000', '#ffffff');
    expect(blackOnWhite.ratio).toBeGreaterThan(20);
    expect(blackOnWhite.scoreGrade).toBe('AAA');
    expect(blackOnWhite.aaNormal).toBe(true);
    expect(blackOnWhite.aaaNormal).toBe(true);

    // Light gray on white: low contrast (Fail)
    const lowContrast = checkContrast('#cccccc', '#ffffff');
    expect(lowContrast.ratio).toBeLessThan(3.0);
    expect(lowContrast.scoreGrade).toBe('Fail');
    expect(lowContrast.aaNormal).toBe(false);

    // Slate 700 on Slate 100: good contrast
    const slateContrast = checkContrast('#334155', '#f1f5f9');
    expect(slateContrast.ratio).toBeGreaterThan(7.0);
    expect(slateContrast.aaNormal).toBe(true);
  });

  it('should calculate OKLCH color coordinates correctly and allow roundtrip', () => {
    const pureRed = { r: 255, g: 0, b: 0, a: 1 };
    const oklch = rgbaToOklch(pureRed);
    expect(oklch.l).toBeGreaterThan(0.5);
    expect(oklch.c).toBeGreaterThan(0.2);

    const backToRgb = oklchToRgba(oklch);
    expect(backToRgb.r).toBeCloseTo(255, -1);
    expect(backToRgb.g).toBeCloseTo(0, -1);
    expect(backToRgb.b).toBeCloseTo(0, -1);
  });

  it('should generate color harmonies including complementary and analogous', () => {
    const harmonies = generateHarmonies('#3b82f6');
    expect(harmonies.length).toBe(5);

    const comp = harmonies.find(h => h.name === 'Complementary');
    expect(comp?.colors.length).toBe(2);
    expect(comp?.colors[0]).toBe('#3b82f6');
  });

  it('should generate tints and shades from base color', () => {
    const { tints, shades } = generateTintsAndShades('#3b82f6');
    expect(tints.length).toBe(9);
    expect(shades.length).toBe(9);
    expect(tints[0].percent).toBe(10);
    expect(shades[8].percent).toBe(90);
  });
});
