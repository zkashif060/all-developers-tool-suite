import { describe, it, expect } from 'vitest';
import {
  computeGridTemplateColumns,
  computeGridTemplateRows,
  generateFlexContainerCss,
  generateFlexItemCss,
  generateFlexTailwindClasses,
  generateFlexItemTailwindClasses,
  generateGridContainerCss,
  generateGridItemCss,
  generateGridTailwindClasses,
  generateGridItemTailwindClasses,
  createDefaultItem,
  DEFAULT_FLEX_CONFIG,
  DEFAULT_GRID_CONFIG,
  FLEX_PRESETS,
  GRID_PRESETS
} from './flexbox-grid.engine';

describe('FlexboxGridEngine', () => {
  it('should compute grid template columns correctly', () => {
    expect(computeGridTemplateColumns({ ...DEFAULT_GRID_CONFIG, columnsType: 'repeat', columnsCount: 4 })).toBe('repeat(4, 1fr)');
    expect(computeGridTemplateColumns({ ...DEFAULT_GRID_CONFIG, columnsType: 'auto-fit', minColumnWidth: 250 })).toBe('repeat(auto-fit, minmax(250px, 1fr))');
    expect(computeGridTemplateColumns({ ...DEFAULT_GRID_CONFIG, columnsType: 'auto-fill', minColumnWidth: 180 })).toBe('repeat(auto-fill, minmax(180px, 1fr))');
    expect(computeGridTemplateColumns({ ...DEFAULT_GRID_CONFIG, columnsType: 'custom', customColumns: '200px 1fr 2fr' })).toBe('200px 1fr 2fr');
  });

  it('should compute grid template rows correctly', () => {
    expect(computeGridTemplateRows({ ...DEFAULT_GRID_CONFIG, rowsType: 'auto' })).toBe('auto');
    expect(computeGridTemplateRows({ ...DEFAULT_GRID_CONFIG, rowsType: 'repeat', rowsCount: 3, rowHeight: 150 })).toBe('repeat(3, 150px)');
    expect(computeGridTemplateRows({ ...DEFAULT_GRID_CONFIG, rowsType: 'custom', customRows: '60px 1fr 40px' })).toBe('60px 1fr 40px');
  });

  it('should generate valid Flex container CSS', () => {
    const css = generateFlexContainerCss({
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      alignContent: 'stretch',
      gap: 20
    });

    expect(css).toContain('display: flex;');
    expect(css).toContain('flex-direction: row;');
    expect(css).toContain('flex-wrap: wrap;');
    expect(css).toContain('justify-content: space-between;');
    expect(css).toContain('align-items: center;');
    expect(css).toContain('gap: 20px;');
  });

  it('should generate valid Flex child CSS', () => {
    const item = {
      ...createDefaultItem(1, 'Card'),
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: '250px',
      flexAlignSelf: 'center' as const,
      order: 2
    };

    const css = generateFlexItemCss(item);
    expect(css).toContain('.item-1 {');
    expect(css).toContain('flex: 1 1 250px;');
    expect(css).toContain('align-self: center;');
    expect(css).toContain('order: 2;');
  });

  it('should generate valid Flex Tailwind utility classes', () => {
    const tw = generateFlexTailwindClasses({
      flexDirection: 'column',
      flexWrap: 'nowrap',
      justifyContent: 'center',
      alignItems: 'center',
      alignContent: 'stretch',
      gap: 16
    });

    expect(tw).toContain('flex');
    expect(tw).toContain('flex-col');
    expect(tw).toContain('flex-nowrap');
    expect(tw).toContain('justify-center');
    expect(tw).toContain('items-center');
    expect(tw).toContain('gap-4');
  });

  it('should generate valid Grid container CSS', () => {
    const css = generateGridContainerCss({
      ...DEFAULT_GRID_CONFIG,
      columnsType: 'repeat',
      columnsCount: 3,
      rowsType: 'auto',
      gap: 24,
      justifyItems: 'center',
      alignItems: 'start'
    });

    expect(css).toContain('display: grid;');
    expect(css).toContain('grid-template-columns: repeat(3, 1fr);');
    expect(css).toContain('gap: 24px;');
    expect(css).toContain('justify-items: center;');
    expect(css).toContain('align-items: start;');
  });

  it('should generate valid Grid child CSS and Tailwind', () => {
    const item = {
      ...createDefaultItem(2, 'Featured'),
      gridColSpan: 2,
      gridRowSpan: 3,
      gridJustifySelf: 'center' as const,
      gridAlignSelf: 'stretch' as const
    };

    const css = generateGridItemCss(item);
    expect(css).toContain('grid-column: span 2;');
    expect(css).toContain('grid-row: span 3;');
    expect(css).toContain('justify-self: center;');
    expect(css).toContain('align-self: stretch;');

    const tw = generateGridItemTailwindClasses(item);
    expect(tw).toContain('col-span-2');
    expect(tw).toContain('row-span-3');
    expect(tw).toContain('justify-self-center');
    expect(tw).toContain('self-stretch');
  });

  it('should contain rich and valid presets for both Flex and Grid', () => {
    expect(FLEX_PRESETS.length).toBeGreaterThanOrEqual(4);
    expect(GRID_PRESETS.length).toBeGreaterThanOrEqual(4);

    const bento = GRID_PRESETS.find(p => p.id === 'bento-grid');
    expect(bento).toBeDefined();
    expect(bento?.items.some(i => i.gridColSpan > 1)).toBe(true);
  });
});

