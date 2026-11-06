/**
 * Glassmorphism Generator Engine
 * 100% Client-Side
 * Computes frosted-glass effect with cross-browser backdrop-filter, specular highlights, and Tailwind CSS outputs.
 */

export interface GlassConfig {
  blur: number; // 0 to 40 px
  opacity: number; // 0 to 1
  color: string; // hex
  borderWidth: number; // 0 to 5 px
  borderColor: string; // hex
  borderOpacity: number; // 0 to 1
  shadowBlur: number; // 0 to 60 px
  shadowOpacity: number; // 0 to 1
  borderRadius: number; // 0 to 48 px
  innerHighlight: boolean;
  backdropSaturate: number; // 100 to 250%
}

export interface GlassPreset {
  name: string;
  description: string;
  config: GlassConfig;
}

export function hexToRgba(hex: string, opacity: number): string {
  const clean = hex.replace('#', '');
  let r = 0, g = 0, b = 0;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length >= 6) {
    r = parseInt(clean.slice(0, 2), 16);
    g = parseInt(clean.slice(2, 4), 16);
    b = parseInt(clean.slice(4, 6), 16);
  }
  const op = Math.min(Math.max(opacity, 0), 1);
  return `rgba(${r}, ${g}, ${b}, ${Math.round(op * 100) / 100})`;
}

/**
 * Generates standards-compliant vanilla CSS declarations with Safari -webkit prefix.
 */
export function generateGlassCss(config: GlassConfig): string {
  const bg = hexToRgba(config.color, config.opacity);
  const borderCol = hexToRgba(config.borderColor, config.borderOpacity);
  const shadowCol = `rgba(0, 0, 0, ${Math.round(config.shadowOpacity * 100) / 100})`;

  const blurFilter = `blur(${config.blur}px) saturate(${config.backdropSaturate}%)`;

  const shadowParts = [`0 8px ${config.shadowBlur}px 0 ${shadowCol}`];
  if (config.innerHighlight) {
    shadowParts.push('inset 0 1px 1px 0 rgba(255, 255, 255, 0.4)');
  }

  const borderLine = config.borderWidth > 0
    ? `border: ${config.borderWidth}px solid ${borderCol};`
    : 'border: none;';

  return `background: ${bg};
backdrop-filter: ${blurFilter};
-webkit-backdrop-filter: ${blurFilter};
border-radius: ${config.borderRadius}px;
${borderLine}
box-shadow: ${shadowParts.join(', ')};`;
}

/**
 * Generates Tailwind CSS classes representing the glassmorphism surface.
 */
export function generateTailwindClasses(config: GlassConfig): string {
  const blurClasses: Record<number, string> = {
    4: 'backdrop-blur-xs',
    8: 'backdrop-blur-sm',
    12: 'backdrop-blur-md',
    16: 'backdrop-blur-lg',
    24: 'backdrop-blur-xl',
    40: 'backdrop-blur-2xl'
  };

  const closestBlur = Object.keys(blurClasses)
    .map(Number)
    .reduce((prev, curr) => (Math.abs(curr - config.blur) < Math.abs(prev - config.blur) ? curr : prev));

  const blurCls = blurClasses[closestBlur] || 'backdrop-blur-md';
  const shadowCls = config.shadowBlur > 25 ? 'shadow-2xl' : config.shadowBlur > 15 ? 'shadow-xl' : 'shadow-lg';

  const isWhite = config.color.toLowerCase() === '#ffffff' || config.color.toLowerCase() === '#fff';
  const opPercent = Math.round(config.opacity * 100);
  const bgCls = isWhite ? `bg-white/${opPercent}` : `bg-[${config.color}]/${opPercent}`;

  return `${blurCls} ${bgCls} border border-white/20 ${shadowCls} rounded-2xl`;
}

export const GLASS_PRESETS: GlassPreset[] = [
  {
    name: 'Frosted Glass Card',
    description: 'Classic Apple iOS/macOS frosted acrylic aesthetic for modern cards.',
    config: {
      blur: 16,
      opacity: 0.25,
      color: '#ffffff',
      borderWidth: 1,
      borderColor: '#ffffff',
      borderOpacity: 0.35,
      shadowBlur: 32,
      shadowOpacity: 0.15,
      borderRadius: 24,
      innerHighlight: true,
      backdropSaturate: 180
    }
  },
  {
    name: 'Dark Obsidian Glass',
    description: 'Sleek, atmospheric dark glass for high-contrast dark themes.',
    config: {
      blur: 20,
      opacity: 0.45,
      color: '#0f172a',
      borderWidth: 1,
      borderColor: '#ffffff',
      borderOpacity: 0.12,
      shadowBlur: 40,
      shadowOpacity: 0.35,
      borderRadius: 24,
      innerHighlight: true,
      backdropSaturate: 160
    }
  },
  {
    name: 'Cyber Neon Tint',
    description: 'Vibrant indigo-violet tinted glass with glowing borders.',
    config: {
      blur: 14,
      opacity: 0.2,
      color: '#6366f1',
      borderWidth: 1.5,
      borderColor: '#a855f7',
      borderOpacity: 0.45,
      shadowBlur: 35,
      shadowOpacity: 0.25,
      borderRadius: 20,
      innerHighlight: true,
      backdropSaturate: 200
    }
  },
  {
    name: 'Minimalist Clean',
    description: 'Subtle translucent layer with razor-thin border.',
    config: {
      blur: 10,
      opacity: 0.12,
      color: '#ffffff',
      borderWidth: 1,
      borderColor: '#ffffff',
      borderOpacity: 0.2,
      shadowBlur: 20,
      shadowOpacity: 0.08,
      borderRadius: 16,
      innerHighlight: false,
      backdropSaturate: 140
    }
  },
  {
    name: 'Frosted Navigation Dock',
    description: 'High blur, pill-shaped floating navigation bar.',
    config: {
      blur: 24,
      opacity: 0.3,
      color: '#ffffff',
      borderWidth: 1,
      borderColor: '#ffffff',
      borderOpacity: 0.4,
      shadowBlur: 25,
      shadowOpacity: 0.18,
      borderRadius: 40,
      innerHighlight: true,
      backdropSaturate: 190
    }
  }
];

