/**
 * Color Converter & WCAG 2.1 Contrast Checker Engine
 * 100% Client-Side, Zero External Dependencies
 * Standards compliant: sRGB, HSL, OKLCH, CMYK, WCAG 2.1 Relative Luminance & Contrast
 */

export interface RGBA {
  r: number; // 0..255
  g: number; // 0..255
  b: number; // 0..255
  a: number; // 0..1
}

export interface HSLA {
  h: number; // 0..360
  s: number; // 0..100 (%)
  l: number; // 0..100 (%)
  a: number; // 0..1
}

export interface OKLCH {
  l: number; // 0..1 (Lightness)
  c: number; // 0..0.4 (Chroma)
  h: number; // 0..360 (Hue)
  a: number; // 0..1
}

export interface CMYK {
  c: number; // 0..100 (%)
  m: number; // 0..100 (%)
  y: number; // 0..100 (%)
  k: number; // 0..100 (%)
}

export interface ColorConversionResult {
  hex: string;
  hex8: string;
  rgb: string;
  rgba: string;
  hsl: string;
  hsla: string;
  oklch: string;
  cmyk: string;
  rawRgba: RGBA;
  rawHsla: HSLA;
  rawOklch: OKLCH;
  rawCmyk: CMYK;
}

export interface ContrastResult {
  foregroundHex: string;
  backgroundHex: string;
  ratio: number; // e.g. 7.42
  ratioFormatted: string; // "7.42:1"
  scoreGrade: 'AAA' | 'AA' | 'AA Large' | 'Fail';
  aaNormal: boolean; // >= 4.5
  aaLarge: boolean; // >= 3.0
  aaaNormal: boolean; // >= 7.0
  aaaLarge: boolean; // >= 4.5
  uiComponents: boolean; // >= 3.0
}

export interface ColorHarmony {
  name: string;
  description: string;
  colors: string[]; // hex codes
}

export interface TintShadeStep {
  percent: number;
  hex: string;
  rgb: string;
}

// ==========================================
// sRGB Parsing & Formatting
// ==========================================

export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

/**
 * Parses any common color string (HEX, RGB, HSL) into an RGBA object.
 */
export function parseColor(input: string): RGBA | null {
  if (!input || typeof input !== 'string') return null;
  const str = input.trim().toLowerCase();

  // 1. HEX (#RGB, #RGBA, #RRGGBB, #RRGGBBAA or without #)
  const hexMatch = str.match(/^#?([0-9a-f]{3,8})$/i);
  if (hexMatch) {
    const raw = hexMatch[1];
    if (raw.length === 3) {
      return {
        r: parseInt(raw[0] + raw[0], 16),
        g: parseInt(raw[1] + raw[1], 16),
        b: parseInt(raw[2] + raw[2], 16),
        a: 1
      };
    }
    if (raw.length === 4) {
      return {
        r: parseInt(raw[0] + raw[0], 16),
        g: parseInt(raw[1] + raw[1], 16),
        b: parseInt(raw[2] + raw[2], 16),
        a: Math.round((parseInt(raw[3] + raw[3], 16) / 255) * 100) / 100
      };
    }
    if (raw.length === 6) {
      return {
        r: parseInt(raw.slice(0, 2), 16),
        g: parseInt(raw.slice(2, 4), 16),
        b: parseInt(raw.slice(4, 6), 16),
        a: 1
      };
    }
    if (raw.length === 8) {
      return {
        r: parseInt(raw.slice(0, 2), 16),
        g: parseInt(raw.slice(2, 4), 16),
        b: parseInt(raw.slice(4, 6), 16),
        a: Math.round((parseInt(raw.slice(6, 8), 16) / 255) * 100) / 100
      };
    }
  }

  // 2. rgb(...) / rgba(...)
  const rgbMatch = str.match(/^rgba?\s*\(\s*([\d.]+)\s*[,/ ]\s*([\d.]+)\s*[,/ ]\s*([\d.]+)(?:\s*[,/ ]\s*([\d.]+%?))?\s*\)$/);
  if (rgbMatch) {
    const r = clamp(parseFloat(rgbMatch[1]), 0, 255);
    const g = clamp(parseFloat(rgbMatch[2]), 0, 255);
    const b = clamp(parseFloat(rgbMatch[3]), 0, 255);
    let a = 1;
    if (rgbMatch[4]) {
      const aVal = rgbMatch[4];
      a = aVal.endsWith('%') ? parseFloat(aVal) / 100 : parseFloat(aVal);
      a = clamp(a, 0, 1);
    }
    return { r, g, b, a: Math.round(a * 100) / 100 };
  }

  // 3. hsl(...) / hsla(...)
  const hslMatch = str.match(/^hsla?\s*\(\s*([\d.]+)\s*[,/ ]\s*([\d.]+)%?\s*[,/ ]\s*([\d.]+)%?(?:\s*[,/ ]\s*([\d.]+%?))?\s*\)$/);
  if (hslMatch) {
    const h = ((parseFloat(hslMatch[1]) % 360) + 360) % 360;
    const s = clamp(parseFloat(hslMatch[2]), 0, 100);
    const l = clamp(parseFloat(hslMatch[3]), 0, 100);
    let a = 1;
    if (hslMatch[4]) {
      const aVal = hslMatch[4];
      a = aVal.endsWith('%') ? parseFloat(aVal) / 100 : parseFloat(aVal);
      a = clamp(a, 0, 1);
    }
    return hslaToRgba({ h, s, l, a: Math.round(a * 100) / 100 });
  }

  // 4. oklch(...)
  const oklchMatch = str.match(/^oklch\s*\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*[/ ]\s*([\d.]+%?))?\s*\)$/);
  if (oklchMatch) {
    let l = parseFloat(oklchMatch[1]);
    if (oklchMatch[1].endsWith('%')) l = l / 100;
    l = clamp(l, 0, 1);
    const c = clamp(parseFloat(oklchMatch[2]), 0, 0.4);
    const h = ((parseFloat(oklchMatch[3]) % 360) + 360) % 360;
    let a = 1;
    if (oklchMatch[4]) {
      const aVal = oklchMatch[4];
      a = aVal.endsWith('%') ? parseFloat(aVal) / 100 : parseFloat(aVal);
      a = clamp(a, 0, 1);
    }
    return oklchToRgba({ l, c, h, a });
  }

  return null;
}

// ==========================================
// Color Space Conversions
// ==========================================

export function rgbaToHex(rgba: RGBA, includeAlpha = false): string {
  const r = Math.round(clamp(rgba.r, 0, 255)).toString(16).padStart(2, '0');
  const g = Math.round(clamp(rgba.g, 0, 255)).toString(16).padStart(2, '0');
  const b = Math.round(clamp(rgba.b, 0, 255)).toString(16).padStart(2, '0');
  if (includeAlpha) {
    const a = Math.round(clamp(rgba.a, 0, 1) * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}${a}`;
  }
  return `#${r}${g}${b}`;
}

export function rgbaToHsla(rgba: RGBA): HSLA {
  const r = rgba.r / 255;
  const g = rgba.g / 255;
  const b = rgba.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h = h / 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
    a: rgba.a
  };
}

export function hslaToRgba(hsla: HSLA): RGBA {
  const h = hsla.h / 360;
  const s = hsla.s / 100;
  const l = hsla.l / 100;

  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v, a: hsla.a };
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    let val = t;
    if (val < 0) val += 1;
    if (val > 1) val -= 1;
    if (val < 1 / 6) return p + (q - p) * 6 * val;
    if (val < 1 / 2) return q;
    if (val < 2 / 3) return p + (q - p) * (2 / 3 - val) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

  return { r, g, b, a: hsla.a };
}

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  return c <= 0.0031308
    ? 12.92 * c * 255
    : (1.055 * Math.pow(c, 1 / 2.4) - 0.055) * 255;
}

export function rgbaToOklch(rgba: RGBA): OKLCH {
  const r = srgbToLinear(rgba.r);
  const g = srgbToLinear(rgba.g);
  const b = srgbToLinear(rgba.b);

  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const b_val = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  const C = Math.hypot(a, b_val);
  let h = (Math.atan2(b_val, a) * 180) / Math.PI;
  if (h < 0) h += 360;

  return {
    l: Math.round(L * 1000) / 1000,
    c: Math.round(C * 1000) / 1000,
    h: Math.round(h * 10) / 10,
    a: rgba.a
  };
}

export function oklchToRgba(oklch: OKLCH): RGBA {
  const L = oklch.l;
  const C = oklch.c;
  const hRad = (oklch.h * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b_val = C * Math.sin(hRad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b_val;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b_val;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b_val;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const rLin = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const gLin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bLin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  return {
    r: Math.round(clamp(linearToSrgb(rLin), 0, 255)),
    g: Math.round(clamp(linearToSrgb(gLin), 0, 255)),
    b: Math.round(clamp(linearToSrgb(bLin), 0, 255)),
    a: oklch.a
  };
}

export function rgbaToCmyk(rgba: RGBA): CMYK {
  const r = rgba.r / 255;
  const g = rgba.g / 255;
  const b = rgba.b / 255;

  const k = 1 - Math.max(r, g, b);
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }
  const c = (1 - r - k) / (1 - k);
  const m = (1 - g - k) / (1 - k);
  const y = (1 - b - k) / (1 - k);

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100)
  };
}

/**
 * Produces full representation in all standard formats for any input color.
 */
export function convertColor(input: string): ColorConversionResult | null {
  const rgba = parseColor(input);
  if (!rgba) return null;

  const hsla = rgbaToHsla(rgba);
  const oklch = rgbaToOklch(rgba);
  const cmyk = rgbaToCmyk(rgba);

  const hex = rgbaToHex(rgba, false);
  const hex8 = rgbaToHex(rgba, true);
  const rgb = `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`;
  const rgbaStr = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
  const hsl = `hsl(${hsla.h}, ${hsla.s}%, ${hsla.l}%)`;
  const hslaStr = `hsla(${hsla.h}, ${hsla.s}%, ${hsla.l}%, ${hsla.a})`;
  const oklchStr = rgba.a === 1
    ? `oklch(${oklch.l} ${oklch.c} ${oklch.h})`
    : `oklch(${oklch.l} ${oklch.c} ${oklch.h} / ${oklch.a})`;
  const cmykStr = `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;

  return {
    hex,
    hex8,
    rgb,
    rgba: rgbaStr,
    hsl,
    hsla: hslaStr,
    oklch: oklchStr,
    cmyk: cmykStr,
    rawRgba: rgba,
    rawHsla: hsla,
    rawOklch: oklch,
    rawCmyk: cmyk
  };
}

// ==========================================
// WCAG 2.1 Luminance & Contrast Checker
// ==========================================

export function calculateLuminance(rgba: RGBA): number {
  const r = srgbToLinear(rgba.r);
  const g = srgbToLinear(rgba.g);
  const b = srgbToLinear(rgba.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function checkContrast(fg: string, bg: string): ContrastResult {
  const fgColor = parseColor(fg) || { r: 15, g: 23, b: 42, a: 1 };
  const bgColor = parseColor(bg) || { r: 255, g: 255, b: 255, a: 1 };

  const l1 = calculateLuminance(fgColor);
  const l2 = calculateLuminance(bgColor);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;

  const aaNormal = ratio >= 4.5;
  const aaLarge = ratio >= 3.0;
  const aaaNormal = ratio >= 7.0;
  const aaaLarge = ratio >= 4.5;
  const uiComponents = ratio >= 3.0;

  let scoreGrade: 'AAA' | 'AA' | 'AA Large' | 'Fail' = 'Fail';
  if (aaaNormal) scoreGrade = 'AAA';
  else if (aaNormal) scoreGrade = 'AA';
  else if (aaLarge) scoreGrade = 'AA Large';

  return {
    foregroundHex: rgbaToHex(fgColor),
    backgroundHex: rgbaToHex(bgColor),
    ratio,
    ratioFormatted: `${ratio.toFixed(2)}:1`,
    scoreGrade,
    aaNormal,
    aaLarge,
    aaaNormal,
    aaaLarge,
    uiComponents
  };
}

// ==========================================
// Color Harmonies & Palettes
// ==========================================

export function generateHarmonies(hex: string): ColorHarmony[] {
  const rgba = parseColor(hex);
  if (!rgba) return [];
  const hsla = rgbaToHsla(rgba);

  const makeColor = (hueOffset: number): string => {
    if (hueOffset === 0) return rgbaToHex(rgba, false);
    const newH = ((hsla.h + hueOffset) % 360 + 360) % 360;
    return rgbaToHex(hslaToRgba({ ...hsla, h: newH }));
  };

  return [
    {
      name: 'Complementary',
      description: 'Opposite side of color wheel. Provides high energy and bold contrast.',
      colors: [makeColor(0), makeColor(180)]
    },
    {
      name: 'Analogous',
      description: 'Adjacent colors on the wheel. Smooth, serene, and comfortable to the eye.',
      colors: [makeColor(-30), makeColor(0), makeColor(30)]
    },
    {
      name: 'Triadic',
      description: 'Equally spaced (120°) vibrant scheme with high visual balance.',
      colors: [makeColor(0), makeColor(120), makeColor(240)]
    },
    {
      name: 'Split-Complementary',
      description: 'Base color plus two adjacent to its complement. High contrast with less tension.',
      colors: [makeColor(0), makeColor(150), makeColor(210)]
    },
    {
      name: 'Tetradic (Square)',
      description: 'Four colors arranged in two complementary pairs for rich variation.',
      colors: [makeColor(0), makeColor(90), makeColor(180), makeColor(270)]
    }
  ];
}

// ==========================================
// Tints & Shades Generator
// ==========================================

export function generateTintsAndShades(hex: string): { tints: TintShadeStep[]; shades: TintShadeStep[] } {
  const base = parseColor(hex);
  if (!base) return { tints: [], shades: [] };

  const mix = (c1: RGBA, c2: RGBA, weight: number): RGBA => {
    return {
      r: Math.round(c1.r * (1 - weight) + c2.r * weight),
      g: Math.round(c1.g * (1 - weight) + c2.g * weight),
      b: Math.round(c1.b * (1 - weight) + c2.b * weight),
      a: 1
    };
  };

  const white: RGBA = { r: 255, g: 255, b: 255, a: 1 };
  const black: RGBA = { r: 0, g: 0, b: 0, a: 1 };

  const steps = [10, 20, 30, 40, 50, 60, 70, 80, 90];

  const tints: TintShadeStep[] = steps.map(pct => {
    const res = mix(base, white, pct / 100);
    return {
      percent: pct,
      hex: rgbaToHex(res),
      rgb: `rgb(${res.r}, ${res.g}, ${res.b})`
    };
  });

  const shades: TintShadeStep[] = steps.map(pct => {
    const res = mix(base, black, pct / 100);
    return {
      percent: pct,
      hex: rgbaToHex(res),
      rgb: `rgb(${res.r}, ${res.g}, ${res.b})`
    };
  });

  return { tints, shades };
}
