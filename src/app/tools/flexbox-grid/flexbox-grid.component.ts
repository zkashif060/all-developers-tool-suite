import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolRegistryService } from '../../core/services/tool-registry.service';
import { RecentToolsService } from '../../core/services/recent-tools.service';
import { ToolMetadata } from '../../core/models/tool.model';
import { ToolPageLayoutComponent } from '../../shared/components/tool-page-layout/tool-page-layout.component';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { CopyButtonComponent } from '../../shared/components/copy-button/copy-button.component';
import {
  LayoutMode,
  FlexContainerConfig,
  GridContainerConfig,
  LayoutItemConfig,
  LayoutPreset,
  DEFAULT_FLEX_CONFIG,
  DEFAULT_GRID_CONFIG,
  FLEX_PRESETS,
  GRID_PRESETS,
  createDefaultItem,
  computeGridTemplateColumns,
  computeGridTemplateRows,
  generateFlexContainerCss,
  generateFlexItemCss,
  generateFlexTailwindClasses,
  generateFlexItemTailwindClasses,
  generateGridContainerCss,
  generateGridItemCss,
  generateGridTailwindClasses,
  generateGridItemTailwindClasses
} from './flexbox-grid.engine';

@Component({
  selector: 'app-flexbox-grid',
  standalone: true,
  imports: [
    FormsModule,
    ToolPageLayoutComponent,
    AppIconComponent,
    CopyButtonComponent
  ],
  template: `
    @if (tool(); as t) {
      <app-tool-page-layout [tool]="t">
        <div class="flex flex-col gap-6">

          <!-- Top Toolbar: Mode Switcher, Presets, and Actions -->
          <div class="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <!-- Mode Selector (Flexbox vs CSS Grid) -->
            <div class="flex items-center gap-1 p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 text-xs">
              <button
                type="button"
                (click)="switchMode('flexbox')"
                class="px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 cursor-pointer"
                [class.bg-white]="mode() === 'flexbox'"
                [class.dark:bg-slate-900]="mode() === 'flexbox'"
                [class.text-indigo-600]="mode() === 'flexbox'"
                [class.dark:text-indigo-400]="mode() === 'flexbox'"
                [class.shadow-xs]="mode() === 'flexbox'"
                [class.text-slate-600]="mode() !== 'flexbox'"
                [class.dark:text-slate-400]="mode() !== 'flexbox'"
              >
                <app-icon name="layout" [size]="15" />
                <span>Flexbox Playground</span>
              </button>

              <button
                type="button"
                (click)="switchMode('grid')"
                class="px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 cursor-pointer"
                [class.bg-white]="mode() === 'grid'"
                [class.dark:bg-slate-900]="mode() === 'grid'"
                [class.text-indigo-600]="mode() === 'grid'"
                [class.dark:text-indigo-400]="mode() === 'grid'"
                [class.shadow-xs]="mode() === 'grid'"
                [class.text-slate-600]="mode() !== 'grid'"
                [class.dark:text-slate-400]="mode() !== 'grid'"
              >
                <app-icon name="grid" [size]="15" />
                <span>CSS Grid Playground</span>
              </button>
            </div>

            <!-- Presets Bar -->
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-xs text-slate-400 mr-1 font-medium hidden sm:inline">Presets:</span>
              @for (preset of activePresets(); track preset.id) {
                <button
                  type="button"
                  (click)="loadPreset(preset)"
                  class="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  [title]="preset.description"
                >
                  {{ preset.name }}
                </button>
              }
            </div>

            <!-- Reset Button -->
            <button
              type="button"
              (click)="resetToDefaults()"
              class="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Reset to defaults"
            >
              <app-icon name="rotate-cw" [size]="13" />
              <span>Reset</span>
            </button>
          </div>

          <!-- Main Studio Stage & Controls (2 Columns) -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            <!-- Left Stage Column: Interactive Visual Canvas (Cols 1-7) -->
            <div class="lg:col-span-7 flex flex-col gap-4">

              <!-- Stage Header Toolbar (Viewport Width & Item Counter) -->
              <div class="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
                <!-- Viewport Preset Sizing -->
                <div class="flex items-center gap-1.5">
                  <span class="text-slate-400 font-medium">Stage Viewport:</span>
                  <button
                    type="button"
                    (click)="viewportWidth.set('100%')"
                    class="px-2 py-0.5 rounded font-mono transition-colors cursor-pointer"
                    [class.bg-indigo-50]="viewportWidth() === '100%'"
                    [class.dark:bg-indigo-950]="viewportWidth() === '100%'"
                    [class.text-indigo-600]="viewportWidth() === '100%'"
                    [class.dark:text-indigo-400]="viewportWidth() === '100%'"
                    [class.text-slate-500]="viewportWidth() !== '100%'"
                  >
                    Fluid (100%)
                  </button>
                  <button
                    type="button"
                    (click)="viewportWidth.set('768px')"
                    class="px-2 py-0.5 rounded font-mono transition-colors cursor-pointer"
                    [class.bg-indigo-50]="viewportWidth() === '768px'"
                    [class.dark:bg-indigo-950]="viewportWidth() === '768px'"
                    [class.text-indigo-600]="viewportWidth() === '768px'"
                    [class.dark:text-indigo-400]="viewportWidth() === '768px'"
                    [class.text-slate-500]="viewportWidth() !== '768px'"
                  >
                    Tablet (768px)
                  </button>
                  <button
                    type="button"
                    (click)="viewportWidth.set('420px')"
                    class="px-2 py-0.5 rounded font-mono transition-colors cursor-pointer"
                    [class.bg-indigo-50]="viewportWidth() === '420px'"
                    [class.dark:bg-indigo-950]="viewportWidth() === '420px'"
                    [class.text-indigo-600]="viewportWidth() === '420px'"
                    [class.dark:text-indigo-400]="viewportWidth() === '420px'"
                    [class.text-slate-500]="viewportWidth() !== '420px'"
                  >
                    Mobile (420px)
                  </button>
                </div>

                <!-- Item Controls -->
                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    (click)="addItem()"
                    class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <app-icon name="plus" [size]="13" />
                    <span>Add Item</span>
                  </button>
                  <button
                    type="button"
                    (click)="removeLastItem()"
                    [disabled]="items().length <= 1"
                    class="px-2 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Remove last item"
                  >
                    <app-icon name="trash" [size]="14" />
                  </button>
                </div>
              </div>

              <!-- Interactive Visual Canvas Container -->
              <div class="relative w-full rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 bg-slate-50/50 dark:bg-slate-950/40 p-4 min-h-[380px] flex items-center justify-center overflow-x-auto transition-all">
                
                <!-- The Container Div -->
                <div
                  class="rounded-xl border border-indigo-400/50 dark:border-indigo-600/50 bg-white/70 dark:bg-slate-900/70 shadow-sm p-4 transition-all"
                  [style.width]="viewportWidth()"
                  [style.max-width]="'100%'"
                  [style.min-height]="'260px'"
                  [style.display]="mode() === 'flexbox' ? 'flex' : 'grid'"
                  [style.flex-direction]="mode() === 'flexbox' ? flexConfig().flexDirection : null"
                  [style.flex-wrap]="mode() === 'flexbox' ? flexConfig().flexWrap : null"
                  [style.justify-content]="mode() === 'flexbox' ? flexConfig().justifyContent : gridConfig().justifyContent"
                  [style.align-items]="mode() === 'flexbox' ? flexConfig().alignItems : gridConfig().alignItems"
                  [style.align-content]="mode() === 'flexbox' ? flexConfig().alignContent : gridConfig().alignContent"
                  [style.justify-items]="mode() === 'grid' ? gridConfig().justifyItems : null"
                  [style.grid-template-columns]="mode() === 'grid' ? computedGridCols() : null"
                  [style.grid-template-rows]="mode() === 'grid' ? computedGridRows() : null"
                  [style.gap.px]="mode() === 'flexbox' ? flexConfig().gap : gridConfig().gap"
                >
                  <!-- Child Items -->
                  @for (item of items(); track item.id; let idx = $index) {
                    <div
                      (click)="selectedItemId.set(item.id)"
                      class="relative group rounded-xl p-3 border cursor-pointer select-none transition-all flex flex-col justify-between"
                      [class]="selectedItemId() === item.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-400 dark:ring-indigo-300'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-xs'"
                      [style.flex]="mode() === 'flexbox' ? (item.flexGrow + ' ' + item.flexShrink + ' ' + item.flexBasis) : null"
                      [style.align-self]="mode() === 'flexbox'
                        ? (item.flexAlignSelf !== 'auto' ? item.flexAlignSelf : null)
                        : (item.gridAlignSelf !== 'auto' ? item.gridAlignSelf : null)"
                      [style.justify-self]="mode() === 'grid' && item.gridJustifySelf !== 'auto' ? item.gridJustifySelf : null"
                      [style.order]="mode() === 'flexbox' && item.order !== 0 ? item.order : null"
                      [style.grid-column]="mode() === 'grid' && item.gridColSpan > 1 ? ('span ' + item.gridColSpan) : null"
                      [style.grid-row]="mode() === 'grid' && item.gridRowSpan > 1 ? ('span ' + item.gridRowSpan) : null"
                      [style.min-height]="mode() === 'grid' && gridConfig().rowHeight ? (gridConfig().rowHeight + 'px') : '70px'"
                    >
                      <!-- Item Header -->
                      <div class="flex items-center justify-between gap-1">
                        <span class="text-xs font-semibold truncate">{{ item.label }}</span>
                        <span
                          class="text-[10px] font-mono px-1.5 py-0.5 rounded"
                          [class]="selectedItemId() === item.id
                            ? 'bg-indigo-700/80 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'"
                        >
                          #{{ idx + 1 }}
                        </span>
                      </div>

                      <!-- Sub-badges for child overrides -->
                      <div class="mt-2 flex flex-wrap gap-1 text-[9px] font-mono opacity-80">
                        @if (mode() === 'flexbox') {
                          @if (item.flexGrow > 0) { <span>grow:{{ item.flexGrow }}</span> }
                          @if (item.flexBasis !== 'auto') { <span>basis:{{ item.flexBasis }}</span> }
                          @if (item.flexAlignSelf !== 'auto') { <span>{{ item.flexAlignSelf }}</span> }
                        } @else {
                          @if (item.gridColSpan > 1) { <span>col:{{ item.gridColSpan }}</span> }
                          @if (item.gridRowSpan > 1) { <span>row:{{ item.gridRowSpan }}</span> }
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Selected Item Inspector Banner -->
              @if (selectedItem(); as current) {
                <div class="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/40 flex flex-col gap-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                      <span class="font-semibold text-xs text-indigo-900 dark:text-indigo-200">
                        Editing Selected Item: {{ current.label }}
                      </span>
                    </div>
                    <button
                      type="button"
                      (click)="selectedItemId.set(null)"
                      class="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                    >
                      Deselect
                    </button>
                  </div>

                  <!-- Inspector Controls depending on Mode -->
                  @if (mode() === 'flexbox') {
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label class="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">flex-grow</label>
                        <input
                          type="number"
                          [ngModel]="current.flexGrow"
                          (ngModelChange)="updateSelectedItem({ flexGrow: $event })"
                          min="0"
                          max="10"
                          class="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label class="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">flex-shrink</label>
                        <input
                          type="number"
                          [ngModel]="current.flexShrink"
                          (ngModelChange)="updateSelectedItem({ flexShrink: $event })"
                          min="0"
                          max="10"
                          class="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label class="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">flex-basis</label>
                        <input
                          type="text"
                          [ngModel]="current.flexBasis"
                          (ngModelChange)="updateSelectedItem({ flexBasis: $event })"
                          placeholder="auto, 0, 200px"
                          class="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label class="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">align-self</label>
                        <select
                          [ngModel]="current.flexAlignSelf"
                          (ngModelChange)="updateSelectedItem({ flexAlignSelf: $event })"
                          class="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                        >
                          <option value="auto">auto</option>
                          <option value="flex-start">flex-start</option>
                          <option value="center">center</option>
                          <option value="flex-end">flex-end</option>
                          <option value="baseline">baseline</option>
                          <option value="stretch">stretch</option>
                        </select>
                      </div>
                    </div>
                  } @else {
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label class="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">Column Span</label>
                        <input
                          type="number"
                          [ngModel]="current.gridColSpan"
                          (ngModelChange)="updateSelectedItem({ gridColSpan: $event })"
                          min="1"
                          max="12"
                          class="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label class="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">Row Span</label>
                        <input
                          type="number"
                          [ngModel]="current.gridRowSpan"
                          (ngModelChange)="updateSelectedItem({ gridRowSpan: $event })"
                          min="1"
                          max="6"
                          class="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label class="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">justify-self</label>
                        <select
                          [ngModel]="current.gridJustifySelf"
                          (ngModelChange)="updateSelectedItem({ gridJustifySelf: $event })"
                          class="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                        >
                          <option value="auto">auto</option>
                          <option value="start">start</option>
                          <option value="center">center</option>
                          <option value="end">end</option>
                          <option value="stretch">stretch</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">align-self</label>
                        <select
                          [ngModel]="current.gridAlignSelf"
                          (ngModelChange)="updateSelectedItem({ gridAlignSelf: $event })"
                          class="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                        >
                          <option value="auto">auto</option>
                          <option value="start">start</option>
                          <option value="center">center</option>
                          <option value="end">end</option>
                          <option value="stretch">stretch</option>
                        </select>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Right Controls & Code Column (Cols 8-12) -->
            <div class="lg:col-span-5 flex flex-col gap-6">

              <!-- Container Settings Card -->
              <div class="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col gap-4">
                <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <app-icon name="tools" [size]="16" className="text-indigo-500" />
                  <span>{{ mode() === 'flexbox' ? 'Flex Container Properties' : 'Grid Container Properties' }}</span>
                </h3>

                <!-- FLEXBOX CONTROLS -->
                @if (mode() === 'flexbox') {
                  <div class="flex flex-col gap-3.5 text-xs">
                    <!-- flex-direction -->
                    <div>
                      <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">flex-direction</label>
                      <div class="grid grid-cols-2 gap-1.5">
                        @for (dir of ['row', 'row-reverse', 'column', 'column-reverse']; track dir) {
                          <button
                            type="button"
                            (click)="updateFlex({ flexDirection: $any(dir) })"
                            class="px-2.5 py-1.5 rounded-lg border font-mono transition-colors text-left cursor-pointer"
                            [class]="flexConfig().flexDirection === dir
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'"
                          >
                            {{ dir }}
                          </button>
                        }
                      </div>
                    </div>

                    <!-- flex-wrap -->
                    <div>
                      <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">flex-wrap</label>
                      <div class="grid grid-cols-3 gap-1.5">
                        @for (wrap of ['nowrap', 'wrap', 'wrap-reverse']; track wrap) {
                          <button
                            type="button"
                            (click)="updateFlex({ flexWrap: $any(wrap) })"
                            class="px-2 py-1.5 rounded-lg border font-mono transition-colors text-center cursor-pointer"
                            [class]="flexConfig().flexWrap === wrap
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'"
                          >
                            {{ wrap }}
                          </button>
                        }
                      </div>
                    </div>

                    <!-- justify-content (Main Axis) -->
                    <div>
                      <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        justify-content <span class="text-slate-400 font-normal">(main axis)</span>
                      </label>
                      <select
                        [ngModel]="flexConfig().justifyContent"
                        (ngModelChange)="updateFlex({ justifyContent: $event })"
                        class="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
                      >
                        <option value="flex-start">flex-start</option>
                        <option value="center">center</option>
                        <option value="flex-end">flex-end</option>
                        <option value="space-between">space-between</option>
                        <option value="space-around">space-around</option>
                        <option value="space-evenly">space-evenly</option>
                      </select>
                    </div>

                    <!-- align-items (Cross Axis) -->
                    <div>
                      <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        align-items <span class="text-slate-400 font-normal">(cross axis)</span>
                      </label>
                      <select
                        [ngModel]="flexConfig().alignItems"
                        (ngModelChange)="updateFlex({ alignItems: $event })"
                        class="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
                      >
                        <option value="stretch">stretch</option>
                        <option value="flex-start">flex-start</option>
                        <option value="center">center</option>
                        <option value="flex-end">flex-end</option>
                        <option value="baseline">baseline</option>
                      </select>
                    </div>

                    <!-- align-content (Multi-line cross axis) -->
                    @if (flexConfig().flexWrap !== 'nowrap') {
                      <div>
                        <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          align-content <span class="text-slate-400 font-normal">(multi-line)</span>
                        </label>
                        <select
                          [ngModel]="flexConfig().alignContent"
                          (ngModelChange)="updateFlex({ alignContent: $event })"
                          class="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
                        >
                          <option value="stretch">stretch</option>
                          <option value="flex-start">flex-start</option>
                          <option value="center">center</option>
                          <option value="flex-end">flex-end</option>
                          <option value="space-between">space-between</option>
                          <option value="space-around">space-around</option>
                          <option value="space-evenly">space-evenly</option>
                        </select>
                      </div>
                    }

                    <!-- gap slider -->
                    <div>
                      <div class="flex justify-between items-center mb-1">
                        <label class="font-medium text-slate-700 dark:text-slate-300">gap</label>
                        <span class="font-mono text-slate-500">{{ flexConfig().gap }}px</span>
                      </div>
                      <input
                        type="range"
                        [ngModel]="flexConfig().gap"
                        (ngModelChange)="updateFlex({ gap: $event })"
                        min="0"
                        max="64"
                        step="4"
                        class="w-full accent-indigo-600"
                      />
                    </div>
                  </div>
                }

                <!-- GRID CONTROLS -->
                @if (mode() === 'grid') {
                  <div class="flex flex-col gap-3.5 text-xs">
                    <!-- Column Strategy -->
                    <div>
                      <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">grid-template-columns</label>
                      <div class="grid grid-cols-2 gap-1.5 mb-2">
                        <button
                          type="button"
                          (click)="updateGrid({ columnsType: 'repeat' })"
                          class="px-2 py-1.5 rounded-lg border font-mono transition-colors text-center cursor-pointer"
                          [class]="gridConfig().columnsType === 'repeat'
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'"
                        >
                          repeat(N, 1fr)
                        </button>
                        <button
                          type="button"
                          (click)="updateGrid({ columnsType: 'auto-fit' })"
                          class="px-2 py-1.5 rounded-lg border font-mono transition-colors text-center cursor-pointer"
                          [class]="gridConfig().columnsType === 'auto-fit'
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'"
                        >
                          auto-fit minmax
                        </button>
                      </div>

                      @if (gridConfig().columnsType === 'repeat') {
                        <div class="flex justify-between items-center mb-1">
                          <span class="text-slate-500">Columns Count:</span>
                          <span class="font-mono font-bold">{{ gridConfig().columnsCount }}</span>
                        </div>
                        <input
                          type="range"
                          [ngModel]="gridConfig().columnsCount"
                          (ngModelChange)="updateGrid({ columnsCount: $event })"
                          min="1"
                          max="12"
                          class="w-full accent-indigo-600"
                        />
                      } @else if (gridConfig().columnsType === 'auto-fit' || gridConfig().columnsType === 'auto-fill') {
                        <div class="flex justify-between items-center mb-1">
                          <span class="text-slate-500">Min Column Width:</span>
                          <span class="font-mono font-bold">{{ gridConfig().minColumnWidth }}px</span>
                        </div>
                        <input
                          type="range"
                          [ngModel]="gridConfig().minColumnWidth"
                          (ngModelChange)="updateGrid({ minColumnWidth: $event })"
                          min="100"
                          max="350"
                          step="10"
                          class="w-full accent-indigo-600"
                        />
                      }
                    </div>

                    <!-- Row Height / Rows -->
                    <div>
                      <div class="flex justify-between items-center mb-1">
                        <label class="font-medium text-slate-700 dark:text-slate-300">Row Minimum Height</label>
                        <span class="font-mono text-slate-500">{{ gridConfig().rowHeight }}px</span>
                      </div>
                      <input
                        type="range"
                        [ngModel]="gridConfig().rowHeight"
                        (ngModelChange)="updateGrid({ rowHeight: $event })"
                        min="60"
                        max="240"
                        step="10"
                        class="w-full accent-indigo-600"
                      />
                    </div>

                    <!-- gap slider -->
                    <div>
                      <div class="flex justify-between items-center mb-1">
                        <label class="font-medium text-slate-700 dark:text-slate-300">gap</label>
                        <span class="font-mono text-slate-500">{{ gridConfig().gap }}px</span>
                      </div>
                      <input
                        type="range"
                        [ngModel]="gridConfig().gap"
                        (ngModelChange)="updateGrid({ gap: $event })"
                        min="0"
                        max="64"
                        step="4"
                        class="w-full accent-indigo-600"
                      />
                    </div>

                    <!-- Alignment in Tracks -->
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1">justify-items</label>
                        <select
                          [ngModel]="gridConfig().justifyItems"
                          (ngModelChange)="updateGrid({ justifyItems: $event })"
                          class="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                        >
                          <option value="stretch">stretch</option>
                          <option value="start">start</option>
                          <option value="center">center</option>
                          <option value="end">end</option>
                        </select>
                      </div>
                      <div>
                        <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1">align-items</label>
                        <select
                          [ngModel]="gridConfig().alignItems"
                          (ngModelChange)="updateGrid({ alignItems: $event })"
                          class="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                        >
                          <option value="stretch">stretch</option>
                          <option value="start">start</option>
                          <option value="center">center</option>
                          <option value="end">end</option>
                        </select>
                      </div>
                    </div>
                  </div>
                }
              </div>

              <!-- Generated Code Outputs Card -->
              <div class="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col gap-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-1.5 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-xs">
                    <button
                      type="button"
                      (click)="codeTab.set('css')"
                      class="px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer"
                      [class.bg-white]="codeTab() === 'css'"
                      [class.dark:bg-slate-900]="codeTab() === 'css'"
                      [class.text-indigo-600]="codeTab() === 'css'"
                      [class.dark:text-indigo-400]="codeTab() === 'css'"
                    >
                      CSS Rules
                    </button>
                    <button
                      type="button"
                      (click)="codeTab.set('tailwind')"
                      class="px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer"
                      [class.bg-white]="codeTab() === 'tailwind'"
                      [class.dark:bg-slate-900]="codeTab() === 'tailwind'"
                      [class.text-indigo-600]="codeTab() === 'tailwind'"
                      [class.dark:text-indigo-400]="codeTab() === 'tailwind'"
                    >
                      Tailwind CSS
                    </button>
                  </div>

                  <app-copy-button
                    [text]="codeTab() === 'css' ? fullGeneratedCss() : fullGeneratedTailwind()"
                    label="Copy Code"
                  />
                </div>

                <!-- Code Pre/Code block -->
                <pre class="p-3.5 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800 selection:bg-indigo-900">{{ codeTab() === 'css' ? fullGeneratedCss() : fullGeneratedTailwind() }}</pre>
              </div>

            </div>
          </div>

        </div>
      </app-tool-page-layout>
    }
  `
})
export class FlexboxGridComponent implements OnInit {
  private readonly toolRegistry = inject(ToolRegistryService);
  private readonly recentToolsService = inject(RecentToolsService);

  public readonly tool = signal<ToolMetadata | null>(null);

  public readonly mode = signal<LayoutMode>('flexbox');
  public readonly codeTab = signal<'css' | 'tailwind'>('css');
  public readonly viewportWidth = signal<string>('100%');

  // Flex State
  public readonly flexConfig = signal<FlexContainerConfig>({ ...DEFAULT_FLEX_CONFIG });

  // Grid State
  public readonly gridConfig = signal<GridContainerConfig>({ ...DEFAULT_GRID_CONFIG });

  // Items State
  public readonly items = signal<LayoutItemConfig[]>([
    createDefaultItem(1, 'Item 1'),
    createDefaultItem(2, 'Item 2'),
    createDefaultItem(3, 'Item 3'),
    createDefaultItem(4, 'Item 4'),
    createDefaultItem(5, 'Item 5')
  ]);

  public readonly selectedItemId = signal<number | null>(null);

  public readonly selectedItem = computed(() => {
    const id = this.selectedItemId();
    if (id === null) return null;
    return this.items().find(i => i.id === id) || null;
  });

  public readonly activePresets = computed(() => {
    return this.mode() === 'flexbox' ? FLEX_PRESETS : GRID_PRESETS;
  });

  public readonly computedGridCols = computed(() => {
    return computeGridTemplateColumns(this.gridConfig());
  });

  public readonly computedGridRows = computed(() => {
    return computeGridTemplateRows(this.gridConfig());
  });

  public readonly fullGeneratedCss = computed(() => {
    if (this.mode() === 'flexbox') {
      const containerCss = generateFlexContainerCss(this.flexConfig());
      const itemRules = this.items()
        .filter(i => i.flexGrow > 0 || i.flexShrink !== 1 || i.flexBasis !== 'auto' || i.flexAlignSelf !== 'auto' || i.order !== 0)
        .map(i => generateFlexItemCss(i))
        .join('\n\n');

      return itemRules ? `${containerCss}\n\n/* Child Item Overrides */\n${itemRules}` : containerCss;
    } else {
      const containerCss = generateGridContainerCss(this.gridConfig());
      const itemRules = this.items()
        .filter(i => i.gridColSpan > 1 || i.gridRowSpan > 1 || i.gridJustifySelf !== 'auto' || i.gridAlignSelf !== 'auto')
        .map(i => generateGridItemCss(i))
        .join('\n\n');

      return itemRules ? `${containerCss}\n\n/* Child Item Overrides */\n${itemRules}` : containerCss;
    }
  });

  public readonly fullGeneratedTailwind = computed(() => {
    if (this.mode() === 'flexbox') {
      const containerClasses = generateFlexTailwindClasses(this.flexConfig());
      const itemOverrides = this.items()
        .filter(i => i.flexGrow > 0 || i.flexShrink !== 1 || i.flexBasis !== 'auto' || i.flexAlignSelf !== 'auto' || i.order !== 0)
        .map(i => `Item ${i.id}: "${generateFlexItemTailwindClasses(i)}"`)
        .join('\n');

      return itemOverrides
        ? `<!-- Container -->\nclass="${containerClasses}"\n\n<!-- Child Overrides -->\n${itemOverrides}`
        : `class="${containerClasses}"`;
    } else {
      const containerClasses = generateGridTailwindClasses(this.gridConfig());
      const itemOverrides = this.items()
        .filter(i => i.gridColSpan > 1 || i.gridRowSpan > 1 || i.gridJustifySelf !== 'auto' || i.gridAlignSelf !== 'auto')
        .map(i => `Item ${i.id}: "${generateGridItemTailwindClasses(i)}"`)
        .join('\n');

      return itemOverrides
        ? `<!-- Container -->\nclass="${containerClasses}"\n\n<!-- Child Overrides -->\n${itemOverrides}`
        : `class="${containerClasses}"`;
    }
  });

  public ngOnInit(): void {
    const found = this.toolRegistry.getToolById('flexbox-grid');
    if (found) {
      this.tool.set(found);
      this.recentToolsService.recordUsage(found.id);
    }
  }

  public switchMode(newMode: LayoutMode): void {
    this.mode.set(newMode);
    this.selectedItemId.set(null);
  }

  public updateFlex(patch: Partial<FlexContainerConfig>): void {
    this.flexConfig.update(c => ({ ...c, ...patch }));
  }

  public updateGrid(patch: Partial<GridContainerConfig>): void {
    this.gridConfig.update(c => ({ ...c, ...patch }));
  }

  public addItem(): void {
    const newId = this.items().length > 0 ? Math.max(...this.items().map(i => i.id)) + 1 : 1;
    this.items.update(list => [...list, createDefaultItem(newId)]);
  }

  public removeLastItem(): void {
    if (this.items().length > 1) {
      this.items.update(list => list.slice(0, list.length - 1));
      if (this.selectedItemId() !== null && !this.items().some(i => i.id === this.selectedItemId())) {
        this.selectedItemId.set(null);
      }
    }
  }

  public updateSelectedItem(patch: Partial<LayoutItemConfig>): void {
    const id = this.selectedItemId();
    if (id === null) return;
    this.items.update(list => list.map(item => item.id === id ? { ...item, ...patch } : item));
  }

  public loadPreset(preset: LayoutPreset): void {
    this.mode.set(preset.mode);
    if (preset.mode === 'flexbox' && preset.flexConfig) {
      this.flexConfig.set({ ...DEFAULT_FLEX_CONFIG, ...preset.flexConfig });
    } else if (preset.mode === 'grid' && preset.gridConfig) {
      this.gridConfig.set({ ...DEFAULT_GRID_CONFIG, ...preset.gridConfig });
    }
    this.items.set(JSON.parse(JSON.stringify(preset.items)));
    this.selectedItemId.set(null);
  }

  public resetToDefaults(): void {
    if (this.mode() === 'flexbox') {
      this.flexConfig.set({ ...DEFAULT_FLEX_CONFIG });
    } else {
      this.gridConfig.set({ ...DEFAULT_GRID_CONFIG });
    }
    this.items.set([
      createDefaultItem(1, 'Item 1'),
      createDefaultItem(2, 'Item 2'),
      createDefaultItem(3, 'Item 3'),
      createDefaultItem(4, 'Item 4'),
      createDefaultItem(5, 'Item 5')
    ]);
    this.selectedItemId.set(null);
  }
}
