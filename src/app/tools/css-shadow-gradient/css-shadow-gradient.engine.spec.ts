import { describe, it, expect } from 'vitest';
import {
  hexToRgbaString,
  formatSingleShadow,
  generateBoxShadowCss,
  generateFullBoxShadowRule,
  generateGradientCss,
  generateFullGradientRule,
  SHADOW_PRESETS,
  GRADIENT_PRESETS,
  ShadowLayer,
  GradientConfig
} from './css-shadow-gradient.engine';

describe('CssShadowGradientEngine', () => {
  it('should format hex to valid rgba string with clamped opacity', () => {
    expect(hexToRgbaString('#000000', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
    expect(hexToRgbaString('#ffffff', 1)).toBe('rgba(255, 255, 255, 1)');
    expect(hexToRgbaString('#3b82f6', 0.25)).toBe('rgba(59, 130, 246, 0.25)');
  });

  it('should format single shadow layer including inset flag', () => {
    const normal: ShadowLayer = {
      id: '1',
      name: 'Layer 1',
      x: 0,
      y: 4,
      blur: 8,
      spread: 0,
      color: '#000000',
      opacity: 0.15,
      inset: false,
      active: true
    };
    expect(formatSingleShadow(normal)).toBe('0px 4px 8px 0px rgba(0, 0, 0, 0.15)');

    const inset: ShadowLayer = {
      ...normal,
      inset: true
    };
    expect(formatSingleShadow(inset)).toBe('inset 0px 4px 8px 0px rgba(0, 0, 0, 0.15)');
  });

  it('should generate multi-layer box-shadow CSS rule and filter inactive layers', () => {
    const layers: ShadowLayer[] = [
      { id: '1', name: 'L1', x: 0, y: 1, blur: 3, spread: 0, color: '#000000', opacity: 0.1, inset: false, active: true },
      { id: '2', name: 'L2', x: 0, y: 10, blur: 20, spread: 0, color: '#000000', opacity: 0.2, inset: false, active: false }
    ];
    const css = generateBoxShadowCss(layers);
    expect(css).toContain('0px 1px 3px 0px rgba(0, 0, 0, 0.1)');
    expect(css).not.toContain('0px 10px 20px');

    const rule = generateFullBoxShadowRule(layers);
    expect(rule.startsWith('box-shadow: ')).toBe(true);
    expect(rule.endsWith(';')).toBe(true);
  });

  it('should generate modern linear gradient CSS with OKLCH color space', () => {
    const config: GradientConfig = {
      type: 'linear',
      colorSpace: 'oklch',
      angle: 135,
      radialShape: 'circle',
      stops: [
        { id: '1', color: '#6366f1', position: 0 },
        { id: '2', color: '#ec4899', position: 100 }
      ]
    };
    const css = generateGradientCss(config);
    expect(css).toBe('linear-gradient(135deg in oklch, #6366f1 0%, #ec4899 100%)');

    const fullRule = generateFullGradientRule(config);
    expect(fullRule).toBe('background: linear-gradient(135deg in oklch, #6366f1 0%, #ec4899 100%);');
  });

  it('should generate radial and conic gradients', () => {
    const radialConfig: GradientConfig = {
      type: 'radial',
      colorSpace: 'srgb',
      angle: 0,
      radialShape: 'circle',
      stops: [
        { id: '1', color: '#ff0000', position: 0 },
        { id: '2', color: '#0000ff', position: 100 }
      ]
    };
    expect(generateGradientCss(radialConfig)).toBe('radial-gradient(circle #ff0000 0%, #0000ff 100%)');

    const conicConfig: GradientConfig = {
      type: 'conic',
      colorSpace: 'oklab',
      angle: 90,
      radialShape: 'circle',
      stops: [
        { id: '1', color: '#fff', position: 0 },
        { id: '2', color: '#000', position: 100 }
      ]
    };
    expect(generateGradientCss(conicConfig)).toBe('conic-gradient(from 90deg in oklab, #fff 0%, #000 100%)');
  });

  it('should load presets correctly', () => {
    expect(SHADOW_PRESETS.length).toBeGreaterThanOrEqual(4);
    expect(GRADIENT_PRESETS.length).toBeGreaterThanOrEqual(4);
  });
});
