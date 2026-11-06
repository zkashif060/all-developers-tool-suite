/**
 * CSS Flexbox & Grid Layout Engine
 * 100% Client-side deterministic layout generator and code exporter
 * Adheres to Modern Web Guidance: logical properties, intrinsic sizing, and subgrid patterns
 */

export type LayoutMode = 'flexbox' | 'grid';

export interface FlexContainerConfig {
  flexDirection: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  flexWrap: 'nowrap' | 'wrap' | 'wrap-reverse';
  justifyContent: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems: 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline';
  alignContent: 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  gap: number; // in pixels
  rowGap?: number;
  columnGap?: number;
}

export interface GridContainerConfig {
  columnsType: 'repeat' | 'auto-fit' | 'auto-fill' | 'custom';
  columnsCount: number;
  minColumnWidth: number; // in pixels (e.g. 200)
  columnUnit: 'fr' | 'px' | '%' | 'auto';
  customColumns: string; // e.g. "200px 1fr 2fr"
  rowsType: 'auto' | 'repeat' | 'custom';
  rowsCount: number;
  rowHeight: number; // in pixels (e.g. 100)
  customRows: string;
  justifyContent: 'start' | 'end' | 'center' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly';
  alignContent: 'start' | 'end' | 'center' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly';
  justifyItems: 'start' | 'end' | 'center' | 'stretch';
  alignItems: 'start' | 'end' | 'center' | 'stretch';
  gap: number;
  rowGap?: number;
  columnGap?: number;
}

export interface LayoutItemConfig {
  id: number;
  label: string;
  color?: string;
  // Flex child properties
  flexGrow: number;
  flexShrink: number;
  flexBasis: string; // e.g. "auto", "0", "150px"
  flexAlignSelf: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
  order: number;
  // Grid child properties
  gridColSpan: number;
  gridRowSpan: number;
  gridColStart?: number | 'auto';
  gridRowStart?: number | 'auto';
  gridJustifySelf: 'auto' | 'start' | 'end' | 'center' | 'stretch';
  gridAlignSelf: 'auto' | 'start' | 'end' | 'center' | 'stretch';
}

export interface LayoutPreset {
  id: string;
  name: string;
  description: string;
  mode: LayoutMode;
  flexConfig?: Partial<FlexContainerConfig>;
  gridConfig?: Partial<GridContainerConfig>;
  items: LayoutItemConfig[];
}

/**
 * Creates a default flex item
 */
export function createDefaultItem(id: number, label?: string): LayoutItemConfig {
  return {
    id,
    label: label || `Item ${id}`,
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: 'auto',
    flexAlignSelf: 'auto',
    order: 0,
    gridColSpan: 1,
    gridRowSpan: 1,
    gridColStart: 'auto',
    gridRowStart: 'auto',
    gridJustifySelf: 'auto',
    gridAlignSelf: 'auto'
  };
}

/**
 * Default Flex Container configuration
 */
export const DEFAULT_FLEX_CONFIG: FlexContainerConfig = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'flex-start',
  alignItems: 'stretch',
  alignContent: 'stretch',
  gap: 16
};

/**
 * Default Grid Container configuration
 */
export const DEFAULT_GRID_CONFIG: GridContainerConfig = {
  columnsType: 'repeat',
  columnsCount: 3,
  minColumnWidth: 200,
  columnUnit: 'fr',
  customColumns: 'repeat(3, 1fr)',
  rowsType: 'auto',
  rowsCount: 2,
  rowHeight: 120,
  customRows: 'auto',
  justifyContent: 'stretch',
  alignContent: 'stretch',
  justifyItems: 'stretch',
  alignItems: 'stretch',
  gap: 16
};

/**
 * Derives the CSS grid-template-columns value
 */
export function computeGridTemplateColumns(config: GridContainerConfig): string {
  switch (config.columnsType) {
    case 'repeat':
      return `repeat(${config.columnsCount}, 1fr)`;
    case 'auto-fit':
      return `repeat(auto-fit, minmax(${config.minColumnWidth}px, 1fr))`;
    case 'auto-fill':
      return `repeat(auto-fill, minmax(${config.minColumnWidth}px, 1fr))`;
    case 'custom':
      return config.customColumns.trim() || 'repeat(3, 1fr)';
  }
}

/**
 * Derives the CSS grid-template-rows value
 */
export function computeGridTemplateRows(config: GridContainerConfig): string {
  switch (config.rowsType) {
    case 'auto':
      return 'auto';
    case 'repeat':
      return `repeat(${config.rowsCount}, ${config.rowHeight > 0 ? `${config.rowHeight}px` : '1fr'})`;
    case 'custom':
      return config.customRows.trim() || 'auto';
  }
}

/**
 * Generates pure CSS rule block for Flex container
 */
export function generateFlexContainerCss(config: FlexContainerConfig, className = 'flex-container'): string {
  const lines: string[] = [
    `.${className} {`,
    '  display: flex;',
    `  flex-direction: ${config.flexDirection};`,
    `  flex-wrap: ${config.flexWrap};`,
    `  justify-content: ${config.justifyContent};`,
    `  align-items: ${config.alignItems};`
  ];

  if (config.flexWrap !== 'nowrap' && config.alignContent !== 'stretch') {
    lines.push(`  align-content: ${config.alignContent};`);
  }

  const effectiveRowGap = config.rowGap !== undefined ? config.rowGap : config.gap;
  const effectiveColGap = config.columnGap !== undefined ? config.columnGap : config.gap;

  if (effectiveRowGap === effectiveColGap) {
    lines.push(`  gap: ${effectiveRowGap}px;`);
  } else {
    lines.push(`  gap: ${effectiveRowGap}px ${effectiveColGap}px;`);
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * Generates pure CSS rule block for an individual Flex child item
 */
export function generateFlexItemCss(item: LayoutItemConfig, className?: string): string {
  const selector = className ? `.${className}` : `.item-${item.id}`;
  const lines: string[] = [`${selector} {`];

  // Flex shorthand: flex: <grow> <shrink> <basis>
  lines.push(`  flex: ${item.flexGrow} ${item.flexShrink} ${item.flexBasis};`);

  if (item.flexAlignSelf !== 'auto') {
    lines.push(`  align-self: ${item.flexAlignSelf};`);
  }

  if (item.order !== 0) {
    lines.push(`  order: ${item.order};`);
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * Generates Tailwind utility classes for Flex container
 */
export function generateFlexTailwindClasses(config: FlexContainerConfig): string {
  const classes: string[] = ['flex'];

  // Direction
  const dirMap: Record<string, string> = {
    row: 'flex-row',
    'row-reverse': 'flex-row-reverse',
    column: 'flex-col',
    'column-reverse': 'flex-col-reverse'
  };
  classes.push(dirMap[config.flexDirection] || 'flex-row');

  // Wrap
  const wrapMap: Record<string, string> = {
    nowrap: 'flex-nowrap',
    wrap: 'flex-wrap',
    'wrap-reverse': 'flex-wrap-reverse'
  };
  classes.push(wrapMap[config.flexWrap] || 'flex-wrap');

  // Justify
  const justifyMap: Record<string, string> = {
    'flex-start': 'justify-start',
    'flex-end': 'justify-end',
    center: 'justify-center',
    'space-between': 'justify-between',
    'space-around': 'justify-around',
    'space-evenly': 'justify-evenly'
  };
  classes.push(justifyMap[config.justifyContent] || 'justify-start');

  // Align items
  const itemsMap: Record<string, string> = {
    stretch: 'items-stretch',
    'flex-start': 'items-start',
    'flex-end': 'items-end',
    center: 'items-center',
    baseline: 'items-baseline'
  };
  classes.push(itemsMap[config.alignItems] || 'items-stretch');

  // Align content (when wrapped)
  if (config.flexWrap !== 'nowrap' && config.alignContent !== 'stretch') {
    const contentMap: Record<string, string> = {
      'flex-start': 'content-start',
      'flex-end': 'content-end',
      center: 'content-center',
      'space-between': 'content-between',
      'space-around': 'content-around',
      'space-evenly': 'content-evenly',
      stretch: 'content-stretch'
    };
    if (contentMap[config.alignContent]) {
      classes.push(contentMap[config.alignContent]);
    }
  }

  // Gap
  const gapRem = config.gap / 4; // standard 4px per Tailwind step
  if (Number.isInteger(gapRem)) {
    classes.push(`gap-${gapRem}`);
  } else {
    classes.push(`gap-[${config.gap}px]`);
  }

  return classes.join(' ');
}

/**
 * Generates Tailwind utility classes for Flex child item
 */
export function generateFlexItemTailwindClasses(item: LayoutItemConfig): string {
  const classes: string[] = [];

  if (item.flexGrow === 1 && item.flexShrink === 1 && item.flexBasis === '0%') {
    classes.push('flex-1');
  } else if (item.flexGrow === 1 && item.flexShrink === 1 && item.flexBasis === 'auto') {
    classes.push('flex-auto');
  } else if (item.flexGrow === 0 && item.flexShrink === 0 && item.flexBasis === 'auto') {
    classes.push('flex-none');
  } else {
    if (item.flexGrow === 1) classes.push('grow');
    else if (item.flexGrow === 0) classes.push('grow-0');
    else classes.push(`grow-[${item.flexGrow}]`);

    if (item.flexShrink === 1) classes.push('shrink');
    else if (item.flexShrink === 0) classes.push('shrink-0');
    else classes.push(`shrink-[${item.flexShrink}]`);

    if (item.flexBasis !== 'auto') {
      classes.push(`basis-[${item.flexBasis}]`);
    }
  }

  if (item.flexAlignSelf !== 'auto') {
    const selfMap: Record<string, string> = {
      'flex-start': 'self-start',
      'flex-end': 'self-end',
      center: 'self-center',
      baseline: 'self-baseline',
      stretch: 'self-stretch'
    };
    if (selfMap[item.flexAlignSelf]) classes.push(selfMap[item.flexAlignSelf]);
  }

  if (item.order !== 0) {
    classes.push(`order-[${item.order}]`);
  }

  return classes.join(' ') || '/* default */';
}

/**
 * Generates pure CSS rule block for Grid container
 */
export function generateGridContainerCss(config: GridContainerConfig, className = 'grid-container'): string {
  const cols = computeGridTemplateColumns(config);
  const rows = computeGridTemplateRows(config);

  const lines: string[] = [
    `.${className} {`,
    '  display: grid;',
    `  grid-template-columns: ${cols};`
  ];

  if (rows !== 'auto') {
    lines.push(`  grid-template-rows: ${rows};`);
  }

  const effectiveRowGap = config.rowGap !== undefined ? config.rowGap : config.gap;
  const effectiveColGap = config.columnGap !== undefined ? config.columnGap : config.gap;

  if (effectiveRowGap === effectiveColGap) {
    lines.push(`  gap: ${effectiveRowGap}px;`);
  } else {
    lines.push(`  gap: ${effectiveRowGap}px ${effectiveColGap}px;`);
  }

  if (config.justifyItems !== 'stretch') {
    lines.push(`  justify-items: ${config.justifyItems};`);
  }
  if (config.alignItems !== 'stretch') {
    lines.push(`  align-items: ${config.alignItems};`);
  }
  if (config.justifyContent !== 'stretch') {
    lines.push(`  justify-content: ${config.justifyContent};`);
  }
  if (config.alignContent !== 'stretch') {
    lines.push(`  align-content: ${config.alignContent};`);
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * Generates pure CSS rule block for an individual Grid child item
 */
export function generateGridItemCss(item: LayoutItemConfig, className?: string): string {
  const selector = className ? `.${className}` : `.item-${item.id}`;
  const lines: string[] = [`${selector} {`];

  if (item.gridColSpan > 1) {
    lines.push(`  grid-column: span ${item.gridColSpan};`);
  }
  if (item.gridRowSpan > 1) {
    lines.push(`  grid-row: span ${item.gridRowSpan};`);
  }
  if (item.gridColStart && item.gridColStart !== 'auto') {
    lines.push(`  grid-column-start: ${item.gridColStart};`);
  }
  if (item.gridRowStart && item.gridRowStart !== 'auto') {
    lines.push(`  grid-row-start: ${item.gridRowStart};`);
  }
  if (item.gridJustifySelf !== 'auto') {
    lines.push(`  justify-self: ${item.gridJustifySelf};`);
  }
  if (item.gridAlignSelf !== 'auto') {
    lines.push(`  align-self: ${item.gridAlignSelf};`);
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * Generates Tailwind utility classes for Grid container
 */
export function generateGridTailwindClasses(config: GridContainerConfig): string {
  const classes: string[] = ['grid'];

  if (config.columnsType === 'repeat') {
    classes.push(`grid-cols-${config.columnsCount}`);
  } else if (config.columnsType === 'auto-fit') {
    classes.push(`grid-cols-[repeat(auto-fit,minmax(${config.minColumnWidth}px,1fr))]`);
  } else if (config.columnsType === 'auto-fill') {
    classes.push(`grid-cols-[repeat(auto-fill,minmax(${config.minColumnWidth}px,1fr))]`);
  } else if (config.columnsType === 'custom') {
    classes.push(`grid-cols-[${config.customColumns.replace(/\s+/g, '_')}]`);
  }

  if (config.rowsType === 'repeat') {
    classes.push(`grid-rows-${config.rowsCount}`);
  }

  const gapRem = config.gap / 4;
  if (Number.isInteger(gapRem)) {
    classes.push(`gap-${gapRem}`);
  } else {
    classes.push(`gap-[${config.gap}px]`);
  }

  if (config.justifyItems !== 'stretch') {
    classes.push(`justify-items-${config.justifyItems}`);
  }
  if (config.alignItems !== 'stretch') {
    classes.push(`items-${config.alignItems}`);
  }
  if (config.justifyContent !== 'stretch') {
    const jcMap: Record<string, string> = {
      start: 'justify-start',
      end: 'justify-end',
      center: 'justify-center',
      'space-between': 'justify-between',
      'space-around': 'justify-around',
      'space-evenly': 'justify-evenly'
    };
    if (jcMap[config.justifyContent]) classes.push(jcMap[config.justifyContent]);
  }
  if (config.alignContent !== 'stretch') {
    const acMap: Record<string, string> = {
      start: 'content-start',
      end: 'content-end',
      center: 'content-center',
      'space-between': 'content-between',
      'space-around': 'content-around',
      'space-evenly': 'content-evenly'
    };
    if (acMap[config.alignContent]) classes.push(acMap[config.alignContent]);
  }

  return classes.join(' ');
}

/**
 * Generates Tailwind utility classes for Grid child item
 */
export function generateGridItemTailwindClasses(item: LayoutItemConfig): string {
  const classes: string[] = [];

  if (item.gridColSpan > 1) {
    classes.push(`col-span-${item.gridColSpan}`);
  }
  if (item.gridRowSpan > 1) {
    classes.push(`row-span-${item.gridRowSpan}`);
  }
  if (item.gridJustifySelf !== 'auto') {
    classes.push(`justify-self-${item.gridJustifySelf}`);
  }
  if (item.gridAlignSelf !== 'auto') {
    classes.push(`self-${item.gridAlignSelf}`);
  }

  return classes.join(' ') || '/* default */';
}

/**
 * Curated Flexbox Layout Presets
 */
export const FLEX_PRESETS: LayoutPreset[] = [
  {
    id: 'navbar',
    name: 'Navbar / Application Header',
    description: 'Header with brand on left, navigation in center, and action CTA on right.',
    mode: 'flexbox',
    flexConfig: {
      flexDirection: 'row',
      flexWrap: 'nowrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 16
    },
    items: [
      { ...createDefaultItem(1, 'Brand Logo'), flexGrow: 0, flexShrink: 0, flexBasis: 'auto' },
      { ...createDefaultItem(2, 'Nav Links (Center)'), flexGrow: 1, flexShrink: 1, flexBasis: 'auto' },
      { ...createDefaultItem(3, 'User Profile / CTA'), flexGrow: 0, flexShrink: 0, flexBasis: 'auto' }
    ]
  },
  {
    id: 'centered-card',
    name: 'Centered Modal / Hero',
    description: 'Perfect horizontal and vertical centering for auth cards or hero banners.',
    mode: 'flexbox',
    flexConfig: {
      flexDirection: 'column',
      flexWrap: 'nowrap',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 20
    },
    items: [
      { ...createDefaultItem(1, 'Avatar / Icon'), flexGrow: 0, flexShrink: 0, flexBasis: 'auto' },
      { ...createDefaultItem(2, 'Card Heading & Text'), flexGrow: 0, flexShrink: 0, flexBasis: 'auto' },
      { ...createDefaultItem(3, 'Action Buttons'), flexGrow: 0, flexShrink: 0, flexBasis: 'auto' }
    ]
  },
  {
    id: 'responsive-cards',
    name: 'Responsive Wrapping Cards',
    description: 'Evenly distributed card list with auto-wrap and consistent gaps.',
    mode: 'flexbox',
    flexConfig: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      gap: 16
    },
    items: [
      { ...createDefaultItem(1, 'Feature 1'), flexGrow: 1, flexShrink: 1, flexBasis: '220px' },
      { ...createDefaultItem(2, 'Feature 2'), flexGrow: 1, flexShrink: 1, flexBasis: '220px' },
      { ...createDefaultItem(3, 'Feature 3'), flexGrow: 1, flexShrink: 1, flexBasis: '220px' },
      { ...createDefaultItem(4, 'Feature 4'), flexGrow: 1, flexShrink: 1, flexBasis: '220px' }
    ]
  },
  {
    id: 'sidebar-main',
    name: 'Sidebar + Main Content',
    description: 'Fixed-width sidebar paired with flexible expanding main view.',
    mode: 'flexbox',
    flexConfig: {
      flexDirection: 'row',
      flexWrap: 'nowrap',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      gap: 24
    },
    items: [
      { ...createDefaultItem(1, 'Navigation Sidebar'), flexGrow: 0, flexShrink: 0, flexBasis: '240px' },
      { ...createDefaultItem(2, 'Primary Main View'), flexGrow: 1, flexShrink: 1, flexBasis: '0%' }
    ]
  },
  {
    id: 'footer-cols',
    name: 'Evenly Spaced Multi-Column Footer',
    description: 'Footer links distributed cleanly with space-around alignment.',
    mode: 'flexbox',
    flexConfig: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-around',
      alignItems: 'flex-start',
      gap: 24
    },
    items: [
      { ...createDefaultItem(1, 'Product Column'), flexGrow: 0, flexShrink: 1, flexBasis: '160px' },
      { ...createDefaultItem(2, 'Resources Column'), flexGrow: 0, flexShrink: 1, flexBasis: '160px' },
      { ...createDefaultItem(3, 'Company Column'), flexGrow: 0, flexShrink: 1, flexBasis: '160px' },
      { ...createDefaultItem(4, 'Legal & Privacy'), flexGrow: 0, flexShrink: 1, flexBasis: '160px' }
    ]
  }
];

/**
 * Curated CSS Grid Layout Presets
 */
export const GRID_PRESETS: LayoutPreset[] = [
  {
    id: 'responsive-autofit',
    name: 'Responsive Auto-Fit Grid',
    description: 'Cards automatically wrap into new columns as viewport size changes without media queries.',
    mode: 'grid',
    gridConfig: {
      columnsType: 'auto-fit',
      minColumnWidth: 200,
      rowsType: 'auto',
      gap: 16,
      justifyItems: 'stretch',
      alignItems: 'stretch'
    },
    items: [
      createDefaultItem(1, 'Metric 1'),
      createDefaultItem(2, 'Metric 2'),
      createDefaultItem(3, 'Metric 3'),
      createDefaultItem(4, 'Metric 4'),
      createDefaultItem(5, 'Metric 5'),
      createDefaultItem(6, 'Metric 6')
    ]
  },
  {
    id: 'bento-grid',
    name: 'Modern Bento Feature Grid',
    description: 'Asymmetric high-visual-impact feature grid with spanning hero elements.',
    mode: 'grid',
    gridConfig: {
      columnsType: 'repeat',
      columnsCount: 3,
      rowsType: 'repeat',
      rowsCount: 2,
      rowHeight: 140,
      gap: 16
    },
    items: [
      { ...createDefaultItem(1, 'Featured Hero Box'), gridColSpan: 2, gridRowSpan: 2 },
      { ...createDefaultItem(2, 'Quick Insight'), gridColSpan: 1, gridRowSpan: 1 },
      { ...createDefaultItem(3, 'Performance Badge'), gridColSpan: 1, gridRowSpan: 1 }
    ]
  },
  {
    id: 'holy-grail',
    name: 'Holy Grail App Layout',
    description: 'Header, Sidebar, Main Content, Aside, and Footer in classic 3-column architecture.',
    mode: 'grid',
    gridConfig: {
      columnsType: 'custom',
      customColumns: '220px 1fr 200px',
      rowsType: 'custom',
      customRows: '60px 1fr 50px',
      gap: 12
    },
    items: [
      { ...createDefaultItem(1, 'Header Bar'), gridColSpan: 3, gridRowSpan: 1 },
      { ...createDefaultItem(2, 'Left Sidebar'), gridColSpan: 1, gridRowSpan: 1 },
      { ...createDefaultItem(3, 'Main Stage Content'), gridColSpan: 1, gridRowSpan: 1 },
      { ...createDefaultItem(4, 'Right Info Panel'), gridColSpan: 1, gridRowSpan: 1 },
      { ...createDefaultItem(5, 'Footer Bar'), gridColSpan: 3, gridRowSpan: 1 }
    ]
  },
  {
    id: 'dashboard-12col',
    name: '12-Column Responsive Dashboard',
    description: 'Standard 12-column grid system used in enterprise UI dashboards.',
    mode: 'grid',
    gridConfig: {
      columnsType: 'repeat',
      columnsCount: 12,
      rowsType: 'auto',
      gap: 16
    },
    items: [
      { ...createDefaultItem(1, 'Top Banner (12 cols)'), gridColSpan: 12, gridRowSpan: 1 },
      { ...createDefaultItem(2, 'Analytics Chart (8 cols)'), gridColSpan: 8, gridRowSpan: 1 },
      { ...createDefaultItem(3, 'Recent Activity (4 cols)'), gridColSpan: 4, gridRowSpan: 1 },
      { ...createDefaultItem(4, 'Stat A (4 cols)'), gridColSpan: 4, gridRowSpan: 1 },
      { ...createDefaultItem(5, 'Stat B (4 cols)'), gridColSpan: 4, gridRowSpan: 1 },
      { ...createDefaultItem(6, 'Stat C (4 cols)'), gridColSpan: 4, gridRowSpan: 1 }
    ]
  },
  {
    id: 'photo-mosaic',
    name: 'Photo Mosaic / Magazine Grid',
    description: 'Dynamic visual magazine mosaic with varying column and row spans.',
    mode: 'grid',
    gridConfig: {
      columnsType: 'repeat',
      columnsCount: 4,
      rowsType: 'repeat',
      rowsCount: 2,
      rowHeight: 120,
      gap: 12
    },
    items: [
      { ...createDefaultItem(1, 'Large Photo (2x2)'), gridColSpan: 2, gridRowSpan: 2 },
      { ...createDefaultItem(2, 'Photo Top 1'), gridColSpan: 1, gridRowSpan: 1 },
      { ...createDefaultItem(3, 'Photo Top 2'), gridColSpan: 1, gridRowSpan: 1 },
      { ...createDefaultItem(4, 'Wide Bottom Photo (2x1)'), gridColSpan: 2, gridRowSpan: 1 }
    ]
  }
];

