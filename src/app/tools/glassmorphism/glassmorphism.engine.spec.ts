import { describe, it, expect } from 'vitest';
import {
  hexToRgba,
  generateGlassCss,
  generateTailwindClasses,
  GLASS_PRESETS,
  GlassConfig
} from './glassmorphism.engine';

describe('GlassmorphismEngine', () => {
  it('should convert hex and opacity to valid rgba string', () => {
    expect(hexToRgba('#ffffff', 0.2)).toBe('rgba(255, 255, 255, 0.2)');
    expect(hexToRgba('#0f172a', 0.5)).toBe('rgba(15, 23, 42, 0.5)');
    expect(hexToRgba('#6366f1', 1)).toBe('rgba(99, 102, 241, 1)');
  });

  it('should generate complete CSS declarations with backdrop-filter and -webkit fallback', () => {
    const config: GlassConfig = {
      blur: 16,
      opacity: 0.2,
      color: '#ffffff',
      borderWidth: 1,
      borderColor: '#ffffff',
      borderOpacity: 0.3,
      shadowBlur: 32,
      shadowOpacity: 0.1,
      borderRadius: 20,
      innerHighlight: true,
      backdropSaturate: 180
    };

    const css = generateGlassCss(config);
    expect(css).toContain('backdrop-filter: blur(16px) saturate(180%);');
    expect(css).toContain('-webkit-backdrop-filter: blur(16px) saturate(180%);');
    expect(css).toContain('border-radius: 20px;');
    expect(css).toContain('border: 1px solid rgba(255, 255, 255, 0.3);');
    expect(css).toContain('inset 0 1px 1px 0 rgba(255, 255, 255, 0.4)');
  });

  it('should handle zero border width cleanly', () => {
    const config: GlassConfig = {
      blur: 10,
      opacity: 0.2,
      color: '#000000',
      borderWidth: 0,
      borderColor: '#ffffff',
      borderOpacity: 0,
      shadowBlur: 10,
      shadowOpacity: 0.1,
      borderRadius: 12,
      innerHighlight: false,
      backdropSaturate: 100
    };

    const css = generateGlassCss(config);
    expect(css).toContain('border: none;');
    expect(css).not.toContain('inset');
  });

  it('should generate reasonable Tailwind utility classes', () => {
    const preset = GLASS_PRESETS[0];
    const tw = generateTailwindClasses(preset.config);
    expect(tw).toContain('backdrop-blur-');
    expect(tw).toContain('border');
    expect(tw).toContain('rounded-2xl');
  });

  it('should load all curated presets', () => {
    expect(GLASS_PRESETS.length).toBeGreaterThanOrEqual(4);
    expect(GLASS_PRESETS.some(p => p.name === 'Frosted Glass Card')).toBe(true);
    expect(GLASS_PRESETS.some(p => p.name === 'Dark Obsidian Glass')).toBe(true);
  });
});

