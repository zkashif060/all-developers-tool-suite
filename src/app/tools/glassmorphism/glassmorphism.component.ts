import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolRegistryService } from '../../core/services/tool-registry.service';
import { RecentToolsService } from '../../core/services/recent-tools.service';
import { ToolMetadata } from '../../core/models/tool.model';
import { ToolPageLayoutComponent } from '../../shared/components/tool-page-layout/tool-page-layout.component';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { CopyButtonComponent } from '../../shared/components/copy-button/copy-button.component';
import {
  GlassConfig,
  GlassPreset,
  generateGlassCss,
  generateTailwindClasses,
  hexToRgba,
  GLASS_PRESETS
} from './glassmorphism.engine';

@Component({
  selector: 'app-glassmorphism',
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
            <div class="flex flex-wrap items-center gap-1.5 text-xs">
              <span class="font-semibold text-slate-500 mr-1">Presets:</span>
              @for (preset of presets; track preset.name) {
                <button
                  type="button"
                  (click)="applyPreset(preset)"
                  class="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                >
                  {{ preset.name }}
                </button>
              }
            </div>

            <!-- Backdrop Scenery Switcher -->
            <div class="flex items-center gap-1.5 text-xs">
              <span class="font-semibold text-slate-500">Backdrop:</span>
              <button
                type="button"
                (click)="backdropTheme.set('mesh')"
                class="px-2 py-1 rounded border text-slate-700 dark:text-slate-300"
                [class.border-indigo-500]="backdropTheme() === 'mesh'"
                [class.font-semibold]="backdropTheme() === 'mesh'"
              >
                Mesh Gradient
              </button>
              <button
                type="button"
                (click)="backdropTheme.set('spheres')"
                class="px-2 py-1 rounded border text-slate-700 dark:text-slate-300"
                [class.border-indigo-500]="backdropTheme() === 'spheres'"
                [class.font-semibold]="backdropTheme() === 'spheres'"
              >
                Vibrant Bubbles
              </button>
              <button
                type="button"
                (click)="backdropTheme.set('dark-cyber')"
                class="px-2 py-1 rounded border text-slate-700 dark:text-slate-300"
                [class.border-indigo-500]="backdropTheme() === 'dark-cyber'"
                [class.font-semibold]="backdropTheme() === 'dark-cyber'"
              >
                Dark Glow
              </button>
            </div>
          </div>

          <!-- Main Studio Stage -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Left Column: Glass Properties Controls -->
            <div class="lg:col-span-5 flex flex-col gap-5">
              <div class="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col gap-4 text-xs">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <app-icon name="box" size="16" className="text-indigo-600 dark:text-indigo-400" />
                    Glass Properties
                  </h3>
                  <span class="text-slate-400 font-mono text-[11px]">backdrop-filter</span>
                </div>

                <!-- Backdrop Blur Slider -->
                <div class="flex flex-col gap-1">
                  <div class="flex justify-between">
                    <span class="text-slate-600 dark:text-slate-400 font-medium">Blur Radius</span>
                    <span class="font-mono font-semibold">{{ config().blur }}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    [value]="config().blur"
                    (input)="updateProp('blur', $any($event.target).value)"
                    class="w-full accent-indigo-600"
                  />
                </div>

                <!-- Glass Opacity / Transparency -->
                <div class="flex flex-col gap-1">
                  <div class="flex justify-between">
                    <span class="text-slate-600 dark:text-slate-400 font-medium">Glass Opacity</span>
                    <span class="font-mono font-semibold">{{ Math.round(config().opacity * 100) }}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    [value]="config().opacity"
                    (input)="updateProp('opacity', $any($event.target).value)"
                    class="w-full accent-indigo-600"
                  />
                </div>

                <!-- Glass Color & Saturation -->
                <div class="grid grid-cols-2 gap-4 items-center">
                  <div class="flex flex-col gap-1">
                    <span class="text-slate-600 dark:text-slate-400 font-medium">Tint Color</span>
                    <div class="flex items-center gap-2">
                      <input
                        type="color"
                        [value]="config().color"
                        (input)="updateProp('color', $any($event.target).value)"
                        class="w-8 h-8 rounded-md p-0 cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent"
                      />
                      <span class="font-mono text-slate-700 dark:text-slate-300">{{ config().color }}</span>
                    </div>
                  </div>

                  <div class="flex flex-col gap-1">
                    <div class="flex justify-between">
                      <span class="text-slate-600 dark:text-slate-400 font-medium">Saturation</span>
                      <span class="font-mono font-semibold">{{ config().backdropSaturate }}%</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="250"
                      [value]="config().backdropSaturate"
                      (input)="updateProp('backdropSaturate', $any($event.target).value)"
                      class="w-full accent-indigo-600"
                    />
                  </div>
                </div>

                <!-- Border Outline Controls -->
                <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                  <span class="font-semibold text-slate-800 dark:text-slate-200">Border Highlight</span>

                  <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                      <div class="flex justify-between">
                        <span class="text-slate-600 dark:text-slate-400">Width</span>
                        <span class="font-mono">{{ config().borderWidth }}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.5"
                        [value]="config().borderWidth"
                        (input)="updateProp('borderWidth', $any($event.target).value)"
                        class="w-full accent-indigo-600"
                      />
                    </div>

                    <div class="flex flex-col gap-1">
                      <div class="flex justify-between">
                        <span class="text-slate-600 dark:text-slate-400">Opacity</span>
                        <span class="font-mono">{{ Math.round(config().borderOpacity * 100) }}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        [value]="config().borderOpacity"
                        (input)="updateProp('borderOpacity', $any($event.target).value)"
                        class="w-full accent-indigo-600"
                      />
                    </div>
                  </div>
                </div>

                <!-- Corner Radius & Specular Highlight -->
                <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                  <div class="flex flex-col gap-1">
                    <div class="flex justify-between">
                      <span class="text-slate-600 dark:text-slate-400 font-medium">Corner Radius</span>
                      <span class="font-mono font-semibold">{{ config().borderRadius }}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="48"
                      [value]="config().borderRadius"
                      (input)="updateProp('borderRadius', $any($event.target).value)"
                      class="w-full accent-indigo-600"
                    />
                  </div>

                  <label class="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      [checked]="config().innerHighlight"
                      (change)="updateProp('innerHighlight', $any($event.target).checked)"
                      class="rounded accent-indigo-600"
                    />
                    Specular Inner Highlight (Realistic Acrylic Edge)
                  </label>
                </div>
              </div>

              <!-- Code Export Boxes -->
              <div class="flex flex-col gap-3">
                <!-- CSS Code Output -->
                <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 flex flex-col gap-2">
                  <div class="flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span>Vanilla CSS</span>
                    <app-copy-button [text]="generatedCss()" label="Copy CSS" />
                  </div>
                  <pre class="font-mono text-xs text-indigo-300 overflow-x-auto whitespace-pre-wrap select-all">{{ generatedCss() }}</pre>
                </div>

                <!-- Tailwind Classes Output -->
                <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col gap-1.5 text-xs">
                  <div class="flex items-center justify-between text-slate-500 font-semibold">
                    <span>Tailwind CSS Classes</span>
                    <app-copy-button [text]="generatedTailwind()" label="Copy Classes" />
                  </div>
                  <code class="font-mono text-xs text-indigo-600 dark:text-indigo-400 break-all select-all">
                    {{ generatedTailwind() }}
                  </code>
                </div>
              </div>
            </div>

            <!-- Right Column: Live Backdrop Visual Stage -->
            <div class="lg:col-span-7 flex flex-col gap-4">
              <!-- Visual Stage Container -->
              <div
                class="min-h-[560px] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 flex items-center justify-center relative overflow-hidden transition-all shadow-md"
                [style.background]="stageBackgroundStyle()"
              >
                <!-- Decorative Graphic Shapes Behind Glass for Real Refraction -->
                @if (backdropTheme() === 'mesh') {
                  <div class="absolute -top-12 -left-12 w-72 h-72 rounded-full bg-pink-500/80 blur-2xl animate-pulse"></div>
                  <div class="absolute -bottom-12 -right-12 w-80 h-80 rounded-full bg-indigo-500/80 blur-2xl"></div>
                  <div class="absolute top-1/3 left-1/4 w-52 h-52 rounded-full bg-amber-400/70 blur-xl"></div>
                } @else if (backdropTheme() === 'spheres') {
                  <div class="absolute top-10 left-12 w-32 h-32 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 shadow-xl"></div>
                  <div class="absolute bottom-12 right-16 w-44 h-44 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 shadow-xl"></div>
                  <div class="absolute top-1/2 right-1/3 w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 shadow-lg"></div>
                  <div class="absolute -bottom-6 left-1/3 w-36 h-36 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 shadow-lg"></div>
                } @else {
                  <div class="absolute top-8 left-16 w-60 h-60 rounded-full bg-indigo-600/40 blur-3xl"></div>
                  <div class="absolute bottom-12 right-12 w-72 h-72 rounded-full bg-fuchsia-600/40 blur-3xl"></div>
                }

                <!-- The Interactive Frosted Glass Surface Card -->
                <div
                  class="relative z-10 w-full max-w-md p-7 transition-all duration-150 flex flex-col gap-5 text-white"
                  [style.background]="glassBgStyle()"
                  [style.backdropFilter]="glassBackdropFilter()"
                  [style.webkitBackdropFilter]="glassBackdropFilter()"
                  [style.borderRadius]="config().borderRadius + 'px'"
                  [style.border]="config().borderWidth > 0 ? config().borderWidth + 'px solid ' + glassBorderColor() : 'none'"
                  [style.boxShadow]="glassBoxShadow()"
                >
                  <div class="flex items-center justify-between border-b pb-3" [style.borderColor]="'rgba(255, 255, 255, 0.2)'">
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-xs">
                        <app-icon name="sparkles" size="16" />
                      </div>
                      <span class="font-bold text-sm tracking-wide">Glassmorphism UI</span>
                    </div>
                    <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs">
                      Blur: {{ config().blur }}px
                    </span>
                  </div>

                  <div>
                    <h4 class="text-xl font-extrabold tracking-tight">
                      Frosted Acrylic Card
                    </h4>
                    <p class="text-xs text-white/90 leading-relaxed mt-2">
                      Experience realistic optical blur and translucent depth. Objects beneath this glass card are organically refracted with soft frosted illumination.
                    </p>
                  </div>

                  <div class="flex items-center justify-between pt-2">
                    <span class="text-xs font-mono text-white/80">
                      {{ config().color }} ({{ Math.round(config().opacity * 100) }}%)
                    </span>
                    <button
                      type="button"
                      class="px-4 py-2 rounded-xl font-bold text-xs bg-white text-slate-900 hover:bg-white/90 shadow-md transition-all active:scale-95"
                    >
                      Interactive Action
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </app-tool-page-layout>
    }
  `
})
export class GlassmorphismComponent implements OnInit {
  protected readonly Math = Math;

  private readonly toolRegistry = inject(ToolRegistryService);
  private readonly recentToolsService = inject(RecentToolsService);

  public readonly tool = signal<ToolMetadata | undefined>(
    this.toolRegistry.getToolById('glassmorphism')
  );

  public readonly presets = GLASS_PRESETS;
  public readonly backdropTheme = signal<'mesh' | 'spheres' | 'dark-cyber'>('mesh');

  public readonly config = signal<GlassConfig>({
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
  });

  public readonly generatedCss = computed(() => {
    return generateGlassCss(this.config());
  });

  public readonly generatedTailwind = computed(() => {
    return generateTailwindClasses(this.config());
  });

  public readonly glassBgStyle = computed(() => {
    const c = this.config();
    return hexToRgba(c.color, c.opacity);
  });

  public readonly glassBorderColor = computed(() => {
    const c = this.config();
    return hexToRgba(c.borderColor, c.borderOpacity);
  });

  public readonly glassBackdropFilter = computed(() => {
    const c = this.config();
    return `blur(${c.blur}px) saturate(${c.backdropSaturate}%)`;
  });

  public readonly glassBoxShadow = computed(() => {
    const c = this.config();
    const parts = [`0 8px ${c.shadowBlur}px 0 rgba(0, 0, 0, ${c.shadowOpacity})`];
    if (c.innerHighlight) {
      parts.push('inset 0 1px 1px 0 rgba(255, 255, 255, 0.4)');
    }
    return parts.join(', ');
  });

  public readonly stageBackgroundStyle = computed(() => {
    const theme = this.backdropTheme();
    if (theme === 'mesh') {
      return 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)';
    }
    if (theme === 'spheres') {
      return 'radial-gradient(ellipse at top left, #1e1b4b 0%, #0f172a 100%)';
    }
    return 'linear-gradient(to bottom, #020617, #0f172a)';
  });

  public ngOnInit(): void {
    this.recentToolsService.recordUsage('glassmorphism');
  }

  public updateProp(field: keyof GlassConfig, val: any): void {
    this.config.update(c => {
      if (typeof c[field] === 'number') {
        return { ...c, [field]: parseFloat(val) || 0 };
      }
      return { ...c, [field]: val };
    });
  }

  public applyPreset(preset: GlassPreset): void {
    this.config.set(JSON.parse(JSON.stringify(preset.config)));
  }
}

