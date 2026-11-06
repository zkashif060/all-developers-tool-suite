import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolRegistryService } from '../../core/services/tool-registry.service';
import { RecentToolsService } from '../../core/services/recent-tools.service';
import { ToolMetadata } from '../../core/models/tool.model';
import { ToolPageLayoutComponent } from '../../shared/components/tool-page-layout/tool-page-layout.component';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { CopyButtonComponent } from '../../shared/components/copy-button/copy-button.component';
import {
  ShadowLayer,
  GradientConfig,
  GradientType,
  GradientColorSpace,
  generateBoxShadowCss,
  generateFullBoxShadowRule,
  generateGradientCss,
  generateFullGradientRule,
  SHADOW_PRESETS,
  GRADIENT_PRESETS
} from './css-shadow-gradient.engine';

@Component({
  selector: 'app-css-shadow-gradient',
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
          <!-- Toolbar & Mode Switcher -->
          <div class="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <!-- Mode Switcher -->
            <div class="flex items-center gap-1 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-xs">
              <button
                type="button"
                (click)="activeMode.set('shadow')"
                class="px-3.5 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5"
                [class.bg-white]="activeMode() === 'shadow'"
                [class.dark:bg-slate-900]="activeMode() === 'shadow'"
                [class.text-indigo-600]="activeMode() === 'shadow'"
                [class.dark:text-indigo-400]="activeMode() === 'shadow'"
                [class.text-slate-600]="activeMode() !== 'shadow'"
                [class.dark:text-slate-400]="activeMode() !== 'shadow'"
              >
                <app-icon name="layers" size="14" />
                Box Shadow Builder
              </button>
              <button
                type="button"
                (click)="activeMode.set('gradient')"
                class="px-3.5 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5"
                [class.bg-white]="activeMode() === 'gradient'"
                [class.dark:bg-slate-900]="activeMode() === 'gradient'"
                [class.text-indigo-600]="activeMode() === 'gradient'"
                [class.dark:text-indigo-400]="activeMode() === 'gradient'"
                [class.text-slate-600]="activeMode() !== 'gradient'"
                [class.dark:text-slate-400]="activeMode() !== 'gradient'"
              >
                <app-icon name="palette" size="14" />
                Gradient Builder
              </button>
            </div>

            <!-- Presets Bar -->
            <div class="flex flex-wrap items-center gap-1.5 text-xs">
              <span class="font-semibold text-slate-500 mr-1">Presets:</span>
              @if (activeMode() === 'shadow') {
                @for (p of shadowPresets; track p.name) {
                  <button
                    type="button"
                    (click)="applyShadowPreset(p)"
                    class="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                  >
                    {{ p.name }}
                  </button>
                }
              } @else {
                @for (p of gradientPresets; track p.name) {
                  <button
                    type="button"
                    (click)="applyGradientPreset(p)"
                    class="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                  >
                    {{ p.name }}
                  </button>
                }
              }
            </div>
          </div>

          <!-- Main Studio Stage -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Left Column: Controls & Layers / Stops -->
            <div class="lg:col-span-6 flex flex-col gap-5">
              <!-- MODE 1: BOX SHADOW CONTROLS -->
              @if (activeMode() === 'shadow') {
                <div class="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col gap-4">
                  <div class="flex items-center justify-between">
                    <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <app-icon name="layers" size="16" className="text-indigo-600 dark:text-indigo-400" />
                      Shadow Layers ({{ shadowLayers().length }})
                    </h3>
                    <button
                      type="button"
                      (click)="addShadowLayer()"
                      class="px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 transition-colors"
                    >
                      <app-icon name="plus" size="12" />
                      Add Layer
                    </button>
                  </div>

                  <!-- Layer Selector Pills -->
                  <div class="flex flex-wrap gap-2">
                    @for (layer of shadowLayers(); track layer.id; let idx = $index) {
                      <div
                        class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs cursor-pointer transition-all"
                        [class.bg-indigo-50]="selectedLayerId() === layer.id"
                        [class.dark:bg-indigo-950]="selectedLayerId() === layer.id"
                        [class.border-indigo-400]="selectedLayerId() === layer.id"
                        [class.text-indigo-700]="selectedLayerId() === layer.id"
                        [class.dark:text-indigo-300]="selectedLayerId() === layer.id"
                        [class.border-slate-200]="selectedLayerId() !== layer.id"
                        [class.dark:border-slate-800]="selectedLayerId() !== layer.id"
                        (click)="selectedLayerId.set(layer.id)"
                      >
                        <input
                          type="checkbox"
                          [checked]="layer.active"
                          (change)="toggleLayerActive(layer.id, $event); $event.stopPropagation()"
                          class="rounded accent-indigo-600"
                        />
                        <span class="font-medium">Layer {{ idx + 1 }}</span>
                        @if (shadowLayers().length > 1) {
                          <button
                            type="button"
                            (click)="removeShadowLayer(layer.id); $event.stopPropagation()"
                            class="text-slate-400 hover:text-rose-500 ml-1 p-0.5"
                          >
                            <app-icon name="trash" size="12" />
                          </button>
                        }
                      </div>
                    }
                  </div>

                  @if (selectedLayer(); as sel) {
                    <!-- Layer Sliders & Properties -->
                    <div class="flex flex-col gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <!-- X Offset -->
                      <div class="flex flex-col gap-1">
                        <div class="flex justify-between">
                          <span class="text-slate-600 dark:text-slate-400">Horizontal Offset (X)</span>
                          <span class="font-mono font-semibold">{{ sel.x }}px</span>
                        </div>
                        <input
                          type="range"
                          min="-60"
                          max="60"
                          [value]="sel.x"
                          (input)="updateSelectedLayer('x', $any($event.target).value)"
                          class="w-full accent-indigo-600"
                        />
                      </div>

                      <!-- Y Offset -->
                      <div class="flex flex-col gap-1">
                        <div class="flex justify-between">
                          <span class="text-slate-600 dark:text-slate-400">Vertical Offset (Y)</span>
                          <span class="font-mono font-semibold">{{ sel.y }}px</span>
                        </div>
                        <input
                          type="range"
                          min="-60"
                          max="60"
                          [value]="sel.y"
                          (input)="updateSelectedLayer('y', $any($event.target).value)"
                          class="w-full accent-indigo-600"
                        />
                      </div>

                      <!-- Blur Radius -->
                      <div class="flex flex-col gap-1">
                        <div class="flex justify-between">
                          <span class="text-slate-600 dark:text-slate-400">Blur Radius</span>
                          <span class="font-mono font-semibold">{{ sel.blur }}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          [value]="sel.blur"
                          (input)="updateSelectedLayer('blur', $any($event.target).value)"
                          class="w-full accent-indigo-600"
                        />
                      </div>

                      <!-- Spread Radius -->
                      <div class="flex flex-col gap-1">
                        <div class="flex justify-between">
                          <span class="text-slate-600 dark:text-slate-400">Spread Radius</span>
                          <span class="font-mono font-semibold">{{ sel.spread }}px</span>
                        </div>
                        <input
                          type="range"
                          min="-30"
                          max="60"
                          [value]="sel.spread"
                          (input)="updateSelectedLayer('spread', $any($event.target).value)"
                          class="w-full accent-indigo-600"
                        />
                      </div>

                      <!-- Opacity & Color -->
                      <div class="grid grid-cols-2 gap-4 items-center">
                        <div class="flex flex-col gap-1">
                          <div class="flex justify-between">
                            <span class="text-slate-600 dark:text-slate-400">Opacity</span>
                            <span class="font-mono font-semibold">{{ Math.round(sel.opacity * 100) }}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            [value]="sel.opacity"
                            (input)="updateSelectedLayer('opacity', $any($event.target).value)"
                            class="w-full accent-indigo-600"
                          />
                        </div>

                        <div class="flex flex-col gap-1">
                          <span class="text-slate-600 dark:text-slate-400">Color &amp; Inset</span>
                          <div class="flex items-center gap-3">
                            <input
                              type="color"
                              [value]="sel.color"
                              (input)="updateSelectedLayer('color', $any($event.target).value)"
                              class="w-8 h-8 rounded-md p-0 cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent"
                            />
                            <label class="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                              <input
                                type="checkbox"
                                [checked]="sel.inset"
                                (change)="updateSelectedLayer('inset', $any($event.target).checked)"
                                class="rounded accent-indigo-600"
                              />
                              Inset
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- MODE 2: GRADIENT CONTROLS -->
              @if (activeMode() === 'gradient') {
                <div class="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col gap-4 text-xs">
                  <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <app-icon name="palette" size="16" className="text-indigo-600 dark:text-indigo-400" />
                    Gradient Parameters
                  </h3>

                  <!-- Type & Color Space Row -->
                  <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                      <label class="font-medium text-slate-600 dark:text-slate-400">Gradient Type</label>
                      <select
                        [ngModel]="gradientConfig().type"
                        (ngModelChange)="updateGradientType($event)"
                        class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                      >
                        <option value="linear">Linear Gradient</option>
                        <option value="radial">Radial Gradient</option>
                        <option value="conic">Conic Gradient</option>
                      </select>
                    </div>

                    <div class="flex flex-col gap-1">
                      <label class="font-medium text-slate-600 dark:text-slate-400">Color Space (Modern)</label>
                      <select
                        [ngModel]="gradientConfig().colorSpace"
                        (ngModelChange)="updateGradientSpace($event)"
                        class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                      >
                        <option value="oklch">in oklch (Vibrant &amp; Smooth)</option>
                        <option value="oklab">in oklab (Perceptual Linear)</option>
                        <option value="srgb">in srgb (Classic Standard)</option>
                      </select>
                    </div>
                  </div>

                  <!-- Angle Slider (for Linear and Conic) -->
                  @if (gradientConfig().type !== 'radial') {
                    <div class="flex flex-col gap-1.5">
                      <div class="flex justify-between">
                        <span class="text-slate-600 dark:text-slate-400">Angle</span>
                        <span class="font-mono font-semibold">{{ gradientConfig().angle }}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        [value]="gradientConfig().angle"
                        (input)="updateGradientAngle($any($event.target).value)"
                        class="w-full accent-indigo-600"
                      />
                      <!-- Quick Direction Buttons -->
                      <div class="flex flex-wrap gap-1 pt-1">
                        @for (dir of angleButtons; track dir.angle) {
                          <button
                            type="button"
                            (click)="updateGradientAngle(dir.angle)"
                            class="px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                            [class.bg-indigo-50]="gradientConfig().angle === dir.angle"
                            [class.text-indigo-600]="gradientConfig().angle === dir.angle"
                          >
                            {{ dir.label }}
                          </button>
                        }
                      </div>
                    </div>
                  }

                  <!-- Color Stops Manager -->
                  <div class="flex flex-col gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div class="flex items-center justify-between">
                      <span class="font-semibold text-slate-800 dark:text-slate-200">Color Stops</span>
                      <button
                        type="button"
                        (click)="addGradientStop()"
                        class="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1"
                      >
                        <app-icon name="plus" size="11" />
                        Add Color Stop
                      </button>
                    </div>

                    <div class="flex flex-col gap-2">
                      @for (stop of gradientConfig().stops; track stop.id; let idx = $index) {
                        <div class="flex items-center gap-3 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                          <input
                            type="color"
                            [value]="stop.color"
                            (input)="updateStopColor(stop.id, $any($event.target).value)"
                            class="w-7 h-7 rounded-md p-0 cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent"
                          />
                          <input
                            type="text"
                            [ngModel]="stop.color"
                            (ngModelChange)="updateStopColor(stop.id, $event)"
                            class="w-20 px-2 py-1 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                          <div class="flex-1 flex items-center gap-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              [value]="stop.position"
                              (input)="updateStopPosition(stop.id, $any($event.target).value)"
                              class="w-full accent-indigo-600"
                            />
                            <span class="font-mono text-[11px] w-8 text-right">{{ stop.position }}%</span>
                          </div>
                          @if (gradientConfig().stops.length > 2) {
                            <button
                              type="button"
                              (click)="removeGradientStop(stop.id)"
                              class="text-slate-400 hover:text-rose-500 p-1"
                            >
                              <app-icon name="trash" size="13" />
                            </button>
                          }
                        </div>
                      }
                    </div>
                  </div>
                </div>
              }

              <!-- Code Output Box -->
              <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 flex flex-col gap-2">
                <div class="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>Generated CSS Code</span>
                  <app-copy-button [text]="activeGeneratedCss()" label="Copy CSS" />
                </div>
                <pre class="font-mono text-xs text-indigo-300 overflow-x-auto whitespace-pre-wrap select-all">{{ activeGeneratedCss() }}</pre>
              </div>
            </div>

            <!-- Right Column: Live Interactive Preview Stage -->
            <div class="lg:col-span-6 flex flex-col gap-4">
              <!-- Stage Controls Bar -->
              <div class="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-slate-500">Stage:</span>
                  <button
                    type="button"
                    (click)="stageBg.set('light')"
                    class="px-2 py-1 rounded border text-slate-700 dark:text-slate-300"
                    [class.border-indigo-500]="stageBg() === 'light'"
                    [class.font-semibold]="stageBg() === 'light'"
                  >
                    Light
                  </button>
                  <button
                    type="button"
                    (click)="stageBg.set('dark')"
                    class="px-2 py-1 rounded border text-slate-700 dark:text-slate-300"
                    [class.border-indigo-500]="stageBg() === 'dark'"
                    [class.font-semibold]="stageBg() === 'dark'"
                  >
                    Dark
                  </button>
                  <button
                    type="button"
                    (click)="stageBg.set('checkerboard')"
                    class="px-2 py-1 rounded border text-slate-700 dark:text-slate-300"
                    [class.border-indigo-500]="stageBg() === 'checkerboard'"
                    [class.font-semibold]="stageBg() === 'checkerboard'"
                  >
                    Checkers
                  </button>
                </div>

                <div class="flex items-center gap-2">
                  <span class="font-semibold text-slate-500">Element:</span>
                  <button
                    type="button"
                    (click)="elementShape.set('card')"
                    class="px-2 py-1 rounded border text-slate-700 dark:text-slate-300"
                    [class.border-indigo-500]="elementShape() === 'card'"
                  >
                    Card
                  </button>
                  <button
                    type="button"
                    (click)="elementShape.set('button')"
                    class="px-2 py-1 rounded border text-slate-700 dark:text-slate-300"
                    [class.border-indigo-500]="elementShape() === 'button'"
                  >
                    Button
                  </button>
                  <button
                    type="button"
                    (click)="elementShape.set('circle')"
                    class="px-2 py-1 rounded border text-slate-700 dark:text-slate-300"
                    [class.border-indigo-500]="elementShape() === 'circle'"
                  >
                    Circle
                  </button>
                </div>
              </div>

              <!-- Live Interactive Canvas Stage -->
              <div
                class="min-h-[440px] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 flex items-center justify-center transition-colors relative overflow-hidden"
                [class.bg-slate-100]="stageBg() === 'light'"
                [class.bg-slate-950]="stageBg() === 'dark'"
                [style.background]="stageBg() === 'checkerboard' ? 'repeating-conic-gradient(#cbd5e1 0% 25%, #f1f5f9 0% 50%) 50% / 20px 20px' : null"
              >
                <!-- Rendered Element -->
                @if (activeMode() === 'shadow') {
                  <div
                    class="transition-all duration-150 flex flex-col items-center justify-center text-center p-6"
                    [style.boxShadow]="shadowStyleString()"
                    [style.backgroundColor]="cardBgColor()"
                    [class.w-64]="elementShape() === 'card'"
                    [class.h-48]="elementShape() === 'card'"
                    [class.rounded-2xl]="elementShape() === 'card'"
                    [class.w-48]="elementShape() === 'button'"
                    [class.h-14]="elementShape() === 'button'"
                    [class.rounded-xl]="elementShape() === 'button'"
                    [class.w-48]="elementShape() === 'circle'"
                    [class.h-48]="elementShape() === 'circle'"
                    [class.rounded-full]="elementShape() === 'circle'"
                  >
                    @if (elementShape() === 'card') {
                      <div class="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center mb-3">
                        <app-icon name="layers" size="20" />
                      </div>
                      <h4 class="font-bold text-sm text-slate-800 dark:text-slate-100">Elevated Surface</h4>
                      <p class="text-xs text-slate-500 mt-1">Realistic depth shadow</p>
                    } @else if (elementShape() === 'button') {
                      <span class="font-bold text-sm text-slate-800 dark:text-slate-100">Action Button</span>
                    } @else {
                      <app-icon name="sparkles" size="24" className="text-indigo-600" />
                    }
                  </div>
                } @else {
                  <div
                    class="transition-all duration-150 flex flex-col items-center justify-center text-center p-6 text-white shadow-xl"
                    [style.background]="gradientStyleString()"
                    [class.w-72]="elementShape() === 'card'"
                    [class.h-56]="elementShape() === 'card'"
                    [class.rounded-2xl]="elementShape() === 'card'"
                    [class.w-52]="elementShape() === 'button'"
                    [class.h-14]="elementShape() === 'button'"
                    [class.rounded-xl]="elementShape() === 'button'"
                    [class.w-52]="elementShape() === 'circle'"
                    [class.h-52]="elementShape() === 'circle'"
                    [class.rounded-full]="elementShape() === 'circle'"
                  >
                    @if (elementShape() === 'card') {
                      <h4 class="font-extrabold text-lg drop-shadow-md">Modern Gradient</h4>
                      <p class="text-xs text-white/90 drop-shadow-sm mt-1">Interpolated in {{ gradientConfig().colorSpace }}</p>
                    } @else if (elementShape() === 'button') {
                      <span class="font-bold text-sm drop-shadow-md">Gradient CTA</span>
                    } @else {
                      <app-icon name="sparkles" size="28" className="text-white drop-shadow-md" />
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </app-tool-page-layout>
    }
  `
})
export class CssShadowGradientComponent implements OnInit {
  protected readonly Math = Math;

  private readonly toolRegistry = inject(ToolRegistryService);
  private readonly recentToolsService = inject(RecentToolsService);

  public readonly tool = signal<ToolMetadata | undefined>(
    this.toolRegistry.getToolById('css-shadow-gradient')
  );

  public readonly activeMode = signal<'shadow' | 'gradient'>('shadow');
  public readonly stageBg = signal<'light' | 'dark' | 'checkerboard'>('light');
  public readonly elementShape = signal<'card' | 'button' | 'circle'>('card');

  public readonly shadowPresets = SHADOW_PRESETS;
  public readonly gradientPresets = GRADIENT_PRESETS;

  // Box Shadow state
  public readonly shadowLayers = signal<ShadowLayer[]>([
    { id: '1', name: 'Direct Floor', x: 0, y: 10, blur: 25, spread: -5, color: '#000000', opacity: 0.15, inset: false, active: true },
    { id: '2', name: 'Ambient Penumbra', x: 0, y: 4, blur: 10, spread: -2, color: '#000000', opacity: 0.1, inset: false, active: true }
  ]);
  public readonly selectedLayerId = signal<string>('1');

  // Gradient state
  public readonly gradientConfig = signal<GradientConfig>({
    type: 'linear',
    colorSpace: 'oklch',
    angle: 135,
    radialShape: 'ellipse',
    stops: [
      { id: '1', color: '#6366f1', position: 0 },
      { id: '2', color: '#a855f7', position: 50 },
      { id: '3', color: '#ec4899', position: 100 }
    ]
  });

  public readonly angleButtons = [
    { label: '0° ↑', angle: 0 },
    { label: '45° ↗', angle: 45 },
    { label: '90° →', angle: 90 },
    { label: '135° ↘', angle: 135 },
    { label: '180° ↓', angle: 180 },
    { label: '270° ←', angle: 270 }
  ];

  public readonly selectedLayer = computed(() => {
    return this.shadowLayers().find(l => l.id === this.selectedLayerId()) || this.shadowLayers()[0];
  });

  public readonly shadowStyleString = computed(() => {
    return generateBoxShadowCss(this.shadowLayers());
  });

  public readonly gradientStyleString = computed(() => {
    return generateGradientCss(this.gradientConfig());
  });

  public readonly activeGeneratedCss = computed(() => {
    if (this.activeMode() === 'shadow') {
      return generateFullBoxShadowRule(this.shadowLayers());
    }
    return generateFullGradientRule(this.gradientConfig());
  });

  public readonly cardBgColor = computed(() => {
    return this.stageBg() === 'dark' ? '#1e293b' : '#ffffff';
  });

  public ngOnInit(): void {
    this.recentToolsService.recordUsage('css-shadow-gradient');
  }

  // Shadow methods
  public addShadowLayer(): void {
    const nextId = String(Date.now());
    const newLayer: ShadowLayer = {
      id: nextId,
      name: `Layer ${this.shadowLayers().length + 1}`,
      x: 0,
      y: 8,
      blur: 16,
      spread: 0,
      color: '#000000',
      opacity: 0.12,
      inset: false,
      active: true
    };
    this.shadowLayers.update(layers => [...layers, newLayer]);
    this.selectedLayerId.set(nextId);
  }

  public removeShadowLayer(id: string): void {
    if (this.shadowLayers().length <= 1) return;
    this.shadowLayers.update(layers => layers.filter(l => l.id !== id));
    if (this.selectedLayerId() === id) {
      this.selectedLayerId.set(this.shadowLayers()[0].id);
    }
  }

  public toggleLayerActive(id: string, e: Event): void {
    const checked = (e.target as HTMLInputElement).checked;
    this.shadowLayers.update(layers =>
      layers.map(l => (l.id === id ? { ...l, active: checked } : l))
    );
  }

  public updateSelectedLayer(field: keyof ShadowLayer, val: any): void {
    const id = this.selectedLayerId();
    this.shadowLayers.update(layers =>
      layers.map(l => {
        if (l.id === id) {
          if (field === 'x' || field === 'y' || field === 'blur' || field === 'spread' || field === 'opacity') {
            return { ...l, [field]: parseFloat(val) || 0 };
          }
          return { ...l, [field]: val };
        }
        return l;
      })
    );
  }

  public applyShadowPreset(preset: typeof SHADOW_PRESETS[0]): void {
    this.shadowLayers.set(JSON.parse(JSON.stringify(preset.layers)));
    this.selectedLayerId.set(preset.layers[0].id);
  }

  // Gradient methods
  public updateGradientType(type: GradientType): void {
    this.gradientConfig.update(c => ({ ...c, type }));
  }

  public updateGradientSpace(colorSpace: GradientColorSpace): void {
    this.gradientConfig.update(c => ({ ...c, colorSpace }));
  }

  public updateGradientAngle(val: any): void {
    const angle = parseInt(val, 10) || 0;
    this.gradientConfig.update(c => ({ ...c, angle }));
  }

  public addGradientStop(): void {
    const nextId = String(Date.now());
    this.gradientConfig.update(c => {
      const stops = [...c.stops];
      const pos = Math.round(stops[stops.length - 1].position + 15);
      stops.push({ id: nextId, color: '#06b6d4', position: Math.min(pos, 100) });
      return { ...c, stops };
    });
  }

  public removeGradientStop(id: string): void {
    this.gradientConfig.update(c => {
      if (c.stops.length <= 2) return c;
      return { ...c, stops: c.stops.filter(s => s.id !== id) };
    });
  }

  public updateStopColor(id: string, color: string): void {
    this.gradientConfig.update(c => ({
      ...c,
      stops: c.stops.map(s => (s.id === id ? { ...s, color } : s))
    }));
  }

  public updateStopPosition(id: string, val: any): void {
    const position = Math.min(Math.max(parseInt(val, 10) || 0, 0), 100);
    this.gradientConfig.update(c => ({
      ...c,
      stops: c.stops.map(s => (s.id === id ? { ...s, position } : s))
    }));
  }

  public applyGradientPreset(preset: typeof GRADIENT_PRESETS[0]): void {
    this.gradientConfig.set(JSON.parse(JSON.stringify(preset.config)));
  }
}

