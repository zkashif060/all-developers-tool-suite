/**
 * CSS Box Shadow & Gradient Builder Engine
 * 100% Client-Side
 * Supports multi-layer realistic depth shadows and modern gradients with OKLCH/OKLab color spaces.
 */

export interface ShadowLayer {
  id: string;
  name: string;
  x: number; // px (-100 to 100)
  y: number; // px (-100 to 100)
  blur: number; // px (0 to 150)
  spread: number; // px (-50 to 100)
  color: string; // hex #rrggbb
  opacity: number; // 0 to 1
  inset: boolean;
  active: boolean;
}

export type GradientType = 'linear' | 'radial' | 'conic';
export type GradientColorSpace = 'oklch' | 'oklab' | 'srgb';

export interface GradientStop {
  id: string;
  color: string;
  position: number; // 0 to 100%
}

export interface GradientConfig {
  type: GradientType;
  colorSpace: GradientColorSpace;
  angle: number; // 0 to 360 degrees
  radialShape: 'circle' | 'ellipse';
  stops: GradientStop[];
}

export interface ShadowPreset {
  name: string;
  layers: ShadowLayer[];
}

export interface GradientPreset {
  name: string;
  config: GradientConfig;
}

// ==========================================
// Box Shadow Serialization & Generation
// ==========================================

export function hexToRgbaString(hex: string, opacity: number): string {
  const cleanHex = hex.replace('#', '');
  let r = 0, g = 0, b = 0;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length >= 6) {
    r = parseInt(cleanHex.slice(0, 2), 16);
    g = parseInt(cleanHex.slice(2, 4), 16);
    b = parseInt(cleanHex.slice(4, 6), 16);
  }
  const op = Math.min(Math.max(opacity, 0), 1);
  return `rgba(${r}, ${g}, ${b}, ${op})`;
}

export function formatSingleShadow(layer: ShadowLayer): string {
  const colorStr = hexToRgbaString(layer.color, layer.opacity);
  const parts = [
    `${layer.x}px`,
    `${layer.y}px`,
    `${layer.blur}px`,
    `${layer.spread}px`,
    colorStr
  ];
  if (layer.inset) {
    parts.unshift('inset');
  }
  return parts.join(' ');
}

export function generateBoxShadowCss(layers: ShadowLayer[]): string {
  const activeLayers = layers.filter(l => l.active);
  if (activeLayers.length === 0) return 'none';
  return activeLayers.map(formatSingleShadow).join(',\n    ');
}

export function generateFullBoxShadowRule(layers: ShadowLayer[]): string {
  const shadowValue = generateBoxShadowCss(layers);
  return `box-shadow: ${shadowValue};`;
}

// ==========================================
// Gradient Serialization & Generation
// ==========================================

export function generateGradientCss(config: GradientConfig): string {
  const sortedStops = [...config.stops].sort((a, b) => a.position - b.position);
  const stopsStr = sortedStops
    .map(s => `${s.color} ${s.position}%`)
    .join(', ');

  const spacePrefix = config.colorSpace !== 'srgb' ? `in ${config.colorSpace}, ` : '';

  switch (config.type) {
    case 'linear':
      return `linear-gradient(${config.angle}deg ${spacePrefix}${stopsStr})`;
    case 'radial':
      return `radial-gradient(${config.radialShape} ${spacePrefix}${stopsStr})`;
    case 'conic':
      return `conic-gradient(from ${config.angle}deg ${spacePrefix}${stopsStr})`;
    default:
      return `linear-gradient(${config.angle}deg, ${stopsStr})`;
  }
}

export function generateFullGradientRule(config: GradientConfig): string {
  return `background: ${generateGradientCss(config)};`;
}

// ==========================================
// Curated Presets
// ==========================================

export const SHADOW_PRESETS: ShadowPreset[] = [
  {
    name: 'Elevated Card',
    layers: [
      { id: '1', name: 'Ambient', x: 0, y: 1, blur: 3, spread: 0, color: '#000000', opacity: 0.1, inset: false, active: true },
      { id: '2', name: 'Direct', x: 0, y: 1, blur: 2, spread: -1, color: '#000000', opacity: 0.1, inset: false, active: true }
    ]
  },
  {
    name: 'Floating Modal (Multi-Layer Depth)',
    layers: [
      { id: '1', name: 'Deep Floor', x: 0, y: 25, blur: 50, spread: -12, color: '#000000', opacity: 0.25, inset: false, active: true },
      { id: '2', name: 'Ambient Mid', x: 0, y: 12, blur: 24, spread: -4, color: '#000000', opacity: 0.15, inset: false, active: true },
      { id: '3', name: 'Contact Penumbra', x: 0, y: 4, blur: 6, spread: -2, color: '#000000', opacity: 0.1, inset: false, active: true }
    ]
  },
  {
    name: 'Cyberpunk Neon Glow',
    layers: [
      { id: '1', name: 'Indigo Core', x: 0, y: 0, blur: 15, spread: 2, color: '#6366f1', opacity: 0.7, inset: false, active: true },
      { id: '2', name: 'Pink Aura', x: 0, y: 0, blur: 35, spread: 8, color: '#ec4899', opacity: 0.5, inset: false, active: true },
      { id: '3', name: 'Cyan Highlight', x: 0, y: 0, blur: 60, spread: 15, color: '#06b6d4', opacity: 0.3, inset: false, active: true }
    ]
  },
  {
    name: 'Retro Brutalist Drop',
    layers: [
      { id: '1', name: 'Hard Solid Drop', x: 6, y: 6, blur: 0, spread: 0, color: '#0f172a', opacity: 1, inset: false, active: true }
    ]
  },
  {
    name: 'Inset Recessed Well',
    layers: [
      { id: '1', name: 'Top Shadow', x: 0, y: 4, blur: 8, spread: 0, color: '#000000', opacity: 0.2, inset: true, active: true },
      { id: '2', name: 'Bottom Glow', x: 0, y: -2, blur: 4, spread: 0, color: '#ffffff', opacity: 0.1, inset: true, active: true }
    ]
  }
];

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    name: 'Ocean Breeze (Modern OKLCH)',
    config: {
      type: 'linear',
      colorSpace: 'oklch',
      angle: 135,
      radialShape: 'ellipse',
      stops: [
        { id: '1', color: '#06b6d4', position: 0 },
        { id: '2', color: '#3b82f6', position: 50 },
        { id: '3', color: '#6366f1', position: 100 }
      ]
    }
  },
  {
    name: 'Sunset Flare',
    config: {
      type: 'linear',
      colorSpace: 'oklch',
      angle: 90,
      radialShape: 'ellipse',
      stops: [
        { id: '1', color: '#f59e0b', position: 0 },
        { id: '2', color: '#f43f5e', position: 55 },
        { id: '3', color: '#8b5cf6', position: 100 }
      ]
    }
  },
  {
    name: 'Aurora Glow',
    config: {
      type: 'linear',
      colorSpace: 'oklch',
      angle: 45,
      radialShape: 'ellipse',
      stops: [
        { id: '1', color: '#10b981', position: 0 },
        { id: '2', color: '#06b6d4', position: 50 },
        { id: '3', color: '#3b82f6', position: 100 }
      ]
    }
  },
  {
    name: 'Dark Velvet',
    config: {
      type: 'radial',
      colorSpace: 'oklab',
      angle: 0,
      radialShape: 'circle',
      stops: [
        { id: '1', color: '#1e1b4b', position: 0 },
        { id: '2', color: '#0f172a', position: 70 },
        { id: '3', color: '#020617', position: 100 }
      ]
    }
  },
  {
    name: 'Conic Spectrum Mesh',
    config: {
      type: 'conic',
      colorSpace: 'oklch',
      angle: 0,
      radialShape: 'circle',
      stops: [
        { id: '1', color: '#6366f1', position: 0 },
        { id: '2', color: '#ec4899', position: 33 },
        { id: '3', color: '#f59e0b', position: 66 },
        { id: '4', color: '#6366f1', position: 100 }
      ]
    }
  }
];

