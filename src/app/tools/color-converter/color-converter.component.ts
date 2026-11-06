import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolRegistryService } from '../../core/services/tool-registry.service';
import { RecentToolsService } from '../../core/services/recent-tools.service';
import { ToolMetadata } from '../../core/models/tool.model';
import { ToolPageLayoutComponent } from '../../shared/components/tool-page-layout/tool-page-layout.component';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { CopyButtonComponent } from '../../shared/components/copy-button/copy-button.component';
import {
  convertColor,
  checkContrast,
  generateHarmonies,
  generateTintsAndShades,
  ColorConversionResult,
  ContrastResult,
  ColorHarmony,
  TintShadeStep
} from './color-converter.engine';

@Component({
  selector: 'app-color-converter',
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
          <!-- Toolbar & Presets Bar -->
          <div class="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Presets:</span>
              @for (preset of presets; track preset.name) {
                <button
                  type="button"
                  (click)="applyPreset(preset.hex)"
                  class="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <span class="w-2.5 h-2.5 rounded-full border border-black/10 dark:border-white/10" [style.backgroundColor]="preset.hex"></span>
                  {{ preset.name }}
                </button>
              }
            </div>

            <!-- View Mode Switcher -->
            <div class="flex items-center gap-1 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-xs">
              <button
                type="button"
                (click)="activeTab.set('converter')"
                class="px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5"
                [class.bg-white]="activeTab() === 'converter'"
                [class.dark:bg-slate-900]="activeTab() === 'converter'"
                [class.text-indigo-600]="activeTab() === 'converter'"
                [class.dark:text-indigo-400]="activeTab() === 'converter'"
                [class.text-slate-600]="activeTab() !== 'converter'"
                [class.dark:text-slate-400]="activeTab() !== 'converter'"
              >
                <app-icon name="palette" size="14" />
                Color Converter
              </button>
              <button
                type="button"
                (click)="activeTab.set('contrast')"
                class="px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5"
                [class.bg-white]="activeTab() === 'contrast'"
                [class.dark:bg-slate-900]="activeTab() === 'contrast'"
                [class.text-indigo-600]="activeTab() === 'contrast'"
                [class.dark:text-indigo-400]="activeTab() === 'contrast'"
                [class.text-slate-600]="activeTab() !== 'contrast'"
                [class.dark:text-slate-400]="activeTab() !== 'contrast'"
              >
                <app-icon name="check-circle" size="14" />
                WCAG Contrast Checker
              </button>
            </div>
          </div>

          <!-- TAB 1: COLOR CONVERTER & HARMONIES -->
          @if (activeTab() === 'converter') {
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <!-- Left Column: Master Color Input & Swatch -->
              <div class="lg:col-span-5 flex flex-col gap-5 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <app-icon name="palette" size="16" className="text-indigo-600 dark:text-indigo-400" />
                    Source Color
                  </h3>
                  <span class="text-xs font-mono text-slate-400">{{ currentColorHex() }}</span>
                </div>

                <!-- Big Interactive Swatch & Native Picker -->
                <div
                  class="relative h-36 w-full rounded-xl overflow-hidden border border-black/10 dark:border-white/10 shadow-inner flex items-center justify-center transition-all group"
                  [style.backgroundColor]="currentColorHex()"
                >
                  <label class="cursor-pointer bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm text-xs font-medium px-3 py-1.5 rounded-lg opacity-90 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <app-icon name="palette" size="14" />
                    Change Color
                    <input
                      type="color"
                      [value]="currentColorHex()"
                      (input)="onColorPickerChange($event)"
                      class="sr-only"
                    />
                  </label>
                </div>

                <!-- Input Text Box with auto-format support -->
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Input Color (HEX, RGB, HSL, or OKLCH)
                  </label>
                  <div class="relative">
                    <input
                      type="text"
                      [ngModel]="rawColorInput()"
                      (ngModelChange)="onRawInputChange($event)"
                      placeholder="#3b82f6 or rgb(59, 130, 246) or oklch(0.62 0.21 260)"
                      class="w-full pl-3 pr-20 py-2.5 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                    <div class="absolute right-2 top-1/2 -translate-y-1/2">
                      <app-copy-button [text]="currentColorHex()" label="Copy" />
                    </div>
                  </div>
                </div>

                <!-- Quick Alpha / Opacity Slider -->
                <div class="flex flex-col gap-1.5">
                  <div class="flex justify-between text-xs text-slate-500">
                    <span>Alpha / Opacity</span>
                    <span class="font-mono font-semibold">{{ currentAlphaPercent() }}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    [value]="currentAlpha()"
                    (input)="onAlphaChange($event)"
                    class="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <!-- CSS Relative Color Syntax Snippet (Modern Web Guidance) -->
                <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col gap-1.5 text-xs">
                  <div class="flex items-center justify-between text-slate-500 dark:text-slate-400 font-semibold">
                    <span>Modern CSS Dynamic Contrast</span>
                    <app-copy-button [text]="rcsSnippet()" label="Copy" />
                  </div>
                  <code class="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 break-all select-all">
                    {{ rcsSnippet() }}
                  </code>
                </div>
              </div>

              <!-- Right Column: Formatted Output Codes & Specifications -->
              <div class="lg:col-span-7 flex flex-col gap-4">
                <div class="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col gap-4">
                  <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Standard CSS Formats
                  </h3>

                  @if (convertedColor(); as res) {
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <!-- HEX -->
                      <div class="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                        <div>
                          <span class="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">HEX</span>
                          <span class="font-mono font-semibold text-slate-900 dark:text-slate-100">{{ res.hex }}</span>
                        </div>
                        <app-copy-button [text]="res.hex" label="Copy" />
                      </div>

                      <!-- HEX8 (with Alpha) -->
                      <div class="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                        <div>
                          <span class="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">HEX (with alpha)</span>
                          <span class="font-mono font-semibold text-slate-900 dark:text-slate-100">{{ res.hex8 }}</span>
                        </div>
                        <app-copy-button [text]="res.hex8" label="Copy" />
                      </div>

                      <!-- RGB / RGBA -->
                      <div class="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                        <div>
                          <span class="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">RGB / RGBA</span>
                          <span class="font-mono font-semibold text-slate-900 dark:text-slate-100">{{ res.rgba }}</span>
                        </div>
                        <app-copy-button [text]="res.rgba" label="Copy" />
                      </div>

                      <!-- HSL / HSLA -->
                      <div class="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                        <div>
                          <span class="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">HSL / HSLA</span>
                          <span class="font-mono font-semibold text-slate-900 dark:text-slate-100">{{ res.hsla }}</span>
                        </div>
                        <app-copy-button [text]="res.hsla" label="Copy" />
                      </div>

                      <!-- Modern OKLCH -->
                      <div class="p-3 rounded-lg border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 flex items-center justify-between">
                        <div>
                          <div class="flex items-center gap-1.5 mb-0.5">
                            <span class="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">OKLCH</span>
                            <span class="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">Modern CSS</span>
                          </div>
                          <span class="font-mono font-semibold text-slate-900 dark:text-slate-100">{{ res.oklch }}</span>
                        </div>
                        <app-copy-button [text]="res.oklch" label="Copy" />
                      </div>

                      <!-- CMYK -->
                      <div class="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                        <div>
                          <span class="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">CMYK (Print)</span>
                          <span class="font-mono font-semibold text-slate-900 dark:text-slate-100">{{ res.cmyk }}</span>
                        </div>
                        <app-copy-button [text]="res.cmyk" label="Copy" />
                      </div>
                    </div>
                  }
                </div>

                <!-- Tints & Shades Palette Strip -->
                <div class="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col gap-3">
                  <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Tints & Shades (10% - 90%)
                  </h3>

                  <!-- Tints (Lighter) -->
                  <div>
                    <span class="text-xs font-medium text-slate-500 mb-1.5 block">Tints (Mix with White)</span>
                    <div class="grid grid-cols-9 gap-1.5">
                      @for (t of tintsAndShades().tints; track t.percent) {
                        <button
                          type="button"
                          (click)="applyPreset(t.hex)"
                          [title]="t.percent + '% Tint: ' + t.hex"
                          class="h-9 rounded-md border border-black/10 dark:border-white/10 hover:scale-105 transition-transform"
                          [style.backgroundColor]="t.hex"
                        ></button>
                      }
                    </div>
                  </div>

                  <!-- Shades (Darker) -->
                  <div>
                    <span class="text-xs font-medium text-slate-500 mb-1.5 block">Shades (Mix with Black)</span>
                    <div class="grid grid-cols-9 gap-1.5">
                      @for (s of tintsAndShades().shades; track s.percent) {
                        <button
                          type="button"
                          (click)="applyPreset(s.hex)"
                          [title]="s.percent + '% Shade: ' + s.hex"
                          class="h-9 rounded-md border border-black/10 dark:border-white/10 hover:scale-105 transition-transform"
                          [style.backgroundColor]="s.hex"
                        ></button>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Harmonies Section -->
            <div class="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col gap-4">
              <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Color Harmonies & Palettes
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                @for (h of harmonies(); track h.name) {
                  <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-2.5">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">{{ h.name }}</span>
                      <app-copy-button [text]="h.colors.join(', ')" label="Copy All" />
                    </div>
                    <div class="flex h-10 rounded-lg overflow-hidden border border-black/10 dark:border-white/10">
                      @for (c of h.colors; track c) {
                        <button
                          type="button"
                          (click)="applyPreset(c)"
                          [title]="c"
                          class="flex-1 h-full hover:opacity-90 transition-opacity"
                          [style.backgroundColor]="c"
                        ></button>
                      }
                    </div>
                    <p class="text-[11px] text-slate-500 leading-normal">{{ h.description }}</p>
                  </div>
                }
              </div>
            </div>
          }

          <!-- TAB 2: WCAG 2.1 CONTRAST CHECKER -->
          @if (activeTab() === 'contrast') {
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <!-- Controls Column: Foreground & Background Pickers -->
              <div class="lg:col-span-5 flex flex-col gap-5 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <app-icon name="check-circle" size="16" className="text-emerald-600 dark:text-emerald-400" />
                    Contrast Parameters
                  </h3>
                  <button
                    type="button"
                    (click)="swapForegroundAndBackground()"
                    class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
                  >
                    <app-icon name="arrow-left-right" size="13" />
                    Swap Colors
                  </button>
                </div>

                <!-- Text / Foreground Color Input -->
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span class="w-3.5 h-3.5 rounded-full border border-black/10" [style.backgroundColor]="fgColor()"></span>
                    Text / Foreground Color
                  </label>
                  <div class="flex items-center gap-2">
                    <input
                      type="color"
                      [value]="fgColor()"
                      (input)="fgColor.set($any($event.target).value)"
                      class="w-10 h-10 p-0 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent"
                    />
                    <input
                      type="text"
                      [ngModel]="fgColor()"
                      (ngModelChange)="fgColor.set($event)"
                      class="flex-1 px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <!-- Background Color Input -->
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span class="w-3.5 h-3.5 rounded-full border border-black/10" [style.backgroundColor]="bgColor()"></span>
                    Background Surface Color
                  </label>
                  <div class="flex items-center gap-2">
                    <input
                      type="color"
                      [value]="bgColor()"
                      (input)="bgColor.set($any($event.target).value)"
                      class="w-10 h-10 p-0 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent"
                    />
                    <input
                      type="text"
                      [ngModel]="bgColor()"
                      (ngModelChange)="bgColor.set($event)"
                      class="flex-1 px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <!-- Standard WCAG Ratios Legend -->
                <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-400 flex flex-col gap-1.5">
                  <span class="font-semibold text-slate-900 dark:text-slate-100">WCAG 2.1 Thresholds:</span>
                  <div class="flex justify-between"><span>Normal Text (&lt; 18pt / 24px):</span> <strong class="font-mono text-slate-900 dark:text-slate-100">4.5:1 (AA), 7.0:1 (AAA)</strong></div>
                  <div class="flex justify-between"><span>Large Text (&ge; 18pt / 14pt bold):</span> <strong class="font-mono text-slate-900 dark:text-slate-100">3.0:1 (AA), 4.5:1 (AAA)</strong></div>
                  <div class="flex justify-between"><span>UI Components &amp; Icons:</span> <strong class="font-mono text-slate-900 dark:text-slate-100">3.0:1 (AA)</strong></div>
                </div>
              </div>

              <!-- Right Column: Live Ratio Score & Card Preview Stage -->
              <div class="lg:col-span-7 flex flex-col gap-5">
                @if (contrastResult(); as cr) {
                  <!-- Score Banner -->
                  <div class="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span class="text-xs uppercase tracking-wider text-slate-400 font-bold block mb-1">Contrast Ratio</span>
                      <div class="flex items-baseline gap-3">
                        <span class="text-4xl font-extrabold font-mono text-slate-900 dark:text-slate-50">{{ cr.ratioFormatted }}</span>
                        <span
                          class="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider"
                          [class.bg-emerald-100]="cr.scoreGrade === 'AAA' || cr.scoreGrade === 'AA'"
                          [class.text-emerald-800]="cr.scoreGrade === 'AAA' || cr.scoreGrade === 'AA'"
                          [class.dark:bg-emerald-950]="cr.scoreGrade === 'AAA' || cr.scoreGrade === 'AA'"
                          [class.dark:text-emerald-300]="cr.scoreGrade === 'AAA' || cr.scoreGrade === 'AA'"
                          [class.bg-amber-100]="cr.scoreGrade === 'AA Large'"
                          [class.text-amber-800]="cr.scoreGrade === 'AA Large'"
                          [class.dark:bg-amber-950]="cr.scoreGrade === 'AA Large'"
                          [class.dark:text-amber-300]="cr.scoreGrade === 'AA Large'"
                          [class.bg-rose-100]="cr.scoreGrade === 'Fail'"
                          [class.text-rose-800]="cr.scoreGrade === 'Fail'"
                          [class.dark:bg-rose-950]="cr.scoreGrade === 'Fail'"
                          [class.dark:text-rose-300]="cr.scoreGrade === 'Fail'"
                        >
                          {{ cr.scoreGrade }} Compliant
                        </span>
                      </div>
                    </div>

                    <!-- Pass/Fail Chips Grid -->
                    <div class="grid grid-cols-2 gap-2 text-xs">
                      <div class="flex items-center gap-1.5 font-medium" [class.text-emerald-600]="cr.aaNormal" [class.text-rose-500]="!cr.aaNormal">
                        <app-icon [name]="cr.aaNormal ? 'check' : 'x'" size="14" />
                        <span>AA Normal (4.5:1)</span>
                      </div>
                      <div class="flex items-center gap-1.5 font-medium" [class.text-emerald-600]="cr.aaLarge" [class.text-rose-500]="!cr.aaLarge">
                        <app-icon [name]="cr.aaLarge ? 'check' : 'x'" size="14" />
                        <span>AA Large (3:1)</span>
                      </div>
                      <div class="flex items-center gap-1.5 font-medium" [class.text-emerald-600]="cr.aaaNormal" [class.text-rose-500]="!cr.aaaNormal">
                        <app-icon [name]="cr.aaaNormal ? 'check' : 'x'" size="14" />
                        <span>AAA Normal (7:1)</span>
                      </div>
                      <div class="flex items-center gap-1.5 font-medium" [class.text-emerald-600]="cr.uiComponents" [class.text-rose-500]="!cr.uiComponents">
                        <app-icon [name]="cr.uiComponents ? 'check' : 'x'" size="14" />
                        <span>UI Controls (3:1)</span>
                      </div>
                    </div>
                  </div>

                  <!-- Live Rendered Preview Card -->
                  <div
                    class="p-6 rounded-2xl border border-black/10 dark:border-white/10 shadow-md transition-colors flex flex-col gap-4"
                    [style.backgroundColor]="cr.backgroundHex"
                    [style.color]="cr.foregroundHex"
                  >
                    <div class="flex items-center justify-between border-b pb-3" [style.borderColor]="cr.foregroundHex + '25'">
                      <span class="text-xs uppercase tracking-wider font-semibold opacity-75">Live UI Preview</span>
                      <span class="text-xs font-mono">{{ cr.foregroundHex }} on {{ cr.backgroundHex }}</span>
                    </div>

                    <h2 class="text-2xl font-bold leading-tight">
                      Large Heading (24px Bold)
                    </h2>

                    <p class="text-base leading-relaxed">
                      This is a sample paragraph rendered at normal reading size (16px). High contrast ensures that users with varying visual abilities, color blindness, or working in bright environments can read comfortably without strain.
                    </p>

                    <div class="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        type="button"
                        class="px-4 py-2 rounded-lg font-semibold text-xs border"
                        [style.backgroundColor]="cr.foregroundHex"
                        [style.color]="cr.backgroundHex"
                        [style.borderColor]="cr.foregroundHex"
                      >
                        Sample Solid Button
                      </button>

                      <button
                        type="button"
                        class="px-4 py-2 rounded-lg font-semibold text-xs border"
                        [style.borderColor]="cr.foregroundHex"
                        [style.color]="cr.foregroundHex"
                        style="background: transparent;"
                      >
                        Outlined Button
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </app-tool-page-layout>
    }
  `
})
export class ColorConverterComponent implements OnInit {
  private readonly toolRegistry = inject(ToolRegistryService);
  private readonly recentToolsService = inject(RecentToolsService);

  public readonly tool = signal<ToolMetadata | undefined>(
    this.toolRegistry.getToolById('color-converter')
  );

  public readonly activeTab = signal<'converter' | 'contrast'>('converter');

  // Converter state
  public readonly rawColorInput = signal<string>('#3b82f6');
  public readonly currentAlpha = signal<number>(1);

  // Contrast Checker state
  public readonly fgColor = signal<string>('#0f172a');
  public readonly bgColor = signal<string>('#ffffff');

  public readonly presets = [
    { name: 'Tailwind Blue', hex: '#3b82f6' },
    { name: 'Brand Indigo', hex: '#6366f1' },
    { name: 'Emerald Green', hex: '#10b981' },
    { name: 'Amber Warning', hex: '#f59e0b' },
    { name: 'Rose Red', hex: '#f43f5e' },
    { name: 'Dark Slate', hex: '#0f172a' }
  ];

  public readonly convertedColor = computed<ColorConversionResult | null>(() => {
    return convertColor(this.rawColorInput());
  });

  public readonly currentColorHex = computed<string>(() => {
    return this.convertedColor()?.hex || '#3b82f6';
  });

  public readonly currentAlphaPercent = computed<number>(() => {
    return Math.round(this.currentAlpha() * 100);
  });

  public readonly rcsSnippet = computed<string>(() => {
    const hex = this.currentColorHex();
    return `color: oklch(from ${hex} calc(sign(0.623 - l) * 0.5 + 0.5) 0 h);`;
  });

  public readonly harmonies = computed<ColorHarmony[]>(() => {
    return generateHarmonies(this.currentColorHex());
  });

  public readonly tintsAndShades = computed<{ tints: TintShadeStep[]; shades: TintShadeStep[] }>(() => {
    return generateTintsAndShades(this.currentColorHex());
  });

  public readonly contrastResult = computed<ContrastResult>(() => {
    return checkContrast(this.fgColor(), this.bgColor());
  });

  public ngOnInit(): void {
    this.recentToolsService.recordUsage('color-converter');
  }

  public onRawInputChange(val: string): void {
    this.rawColorInput.set(val);
  }

  public onColorPickerChange(e: Event): void {
    const val = (e.target as HTMLInputElement).value;
    this.rawColorInput.set(val);
  }

  public onAlphaChange(e: Event): void {
    const a = parseFloat((e.target as HTMLInputElement).value);
    this.currentAlpha.set(a);
  }

  public applyPreset(hex: string): void {
    this.rawColorInput.set(hex);
    this.fgColor.set(hex);
  }

  public swapForegroundAndBackground(): void {
    const currentFg = this.fgColor();
    const currentBg = this.bgColor();
    this.fgColor.set(currentBg);
    this.bgColor.set(currentFg);
  }
}
