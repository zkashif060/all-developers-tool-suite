import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolRegistryService } from '../../core/services/tool-registry.service';
import { RecentToolsService } from '../../core/services/recent-tools.service';
import { ToolMetadata } from '../../core/models/tool.model';
import { ToolPageLayoutComponent } from '../../shared/components/tool-page-layout/tool-page-layout.component';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { CopyButtonComponent } from '../../shared/components/copy-button/copy-button.component';
import { DownloadButtonComponent } from '../../shared/components/download-button/download-button.component';
import {
  convertYamlToJson,
  convertJsonToYaml,
  ConversionDirection,
  ConverterIndent,
  YAML_SAMPLES
} from './yaml-json-converter.engine';

@Component({
  selector: 'app-yaml-json-converter',
  standalone: true,
  imports: [
    FormsModule,
    ToolPageLayoutComponent,
    AppIconComponent,
    CopyButtonComponent,
    DownloadButtonComponent
  ],
  template: `
    @if (tool(); as t) {
      <app-tool-page-layout [tool]="t">
        <div class="flex flex-col gap-6">
          <!-- Toolbar & Presets -->
          <div class="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Sample Configs:</span>
              <button
                type="button"
                (click)="loadSample('dockerCompose')"
                class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Docker Compose
              </button>
              <button
                type="button"
                (click)="loadSample('k8sDeployment')"
                class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Kubernetes Pod
              </button>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="swapDirection()"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                title="Swap conversion direction and texts"
              >
                <app-icon name="arrow-left-right" [size]="14" />
                Swap Direction
              </button>
              <button
                type="button"
                (click)="clearAll()"
                class="px-2.5 py-1 text-xs font-medium rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          <!-- Configuration Controls Bar -->
          <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-wrap items-center gap-6 text-xs">
            <!-- Mode Switcher -->
            <div class="flex items-center gap-1 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                (click)="direction.set('yaml-to-json')"
                class="px-3 py-1.5 rounded-md font-semibold transition-colors"
                [class.bg-white]="direction() === 'yaml-to-json'"
                [class.dark:bg-slate-900]="direction() === 'yaml-to-json'"
                [class.text-primary]="direction() === 'yaml-to-json'"
                [class.shadow-xs]="direction() === 'yaml-to-json'"
                [class.text-slate-600]="direction() !== 'yaml-to-json'"
                [class.dark:text-slate-400]="direction() !== 'yaml-to-json'"
              >
                YAML → JSON
              </button>
              <button
                type="button"
                (click)="direction.set('json-to-yaml')"
                class="px-3 py-1.5 rounded-md font-semibold transition-colors"
                [class.bg-white]="direction() === 'json-to-yaml'"
                [class.dark:bg-slate-900]="direction() === 'json-to-yaml'"
                [class.text-primary]="direction() === 'json-to-yaml'"
                [class.shadow-xs]="direction() === 'json-to-yaml'"
                [class.text-slate-600]="direction() !== 'json-to-yaml'"
                [class.dark:text-slate-400]="direction() !== 'json-to-yaml'"
              >
                JSON → YAML
              </button>
            </div>

            <!-- Indentation -->
            <div class="flex items-center gap-2">
              <span class="font-semibold text-slate-600 dark:text-slate-400">Indentation:</span>
              <select
                [(ngModel)]="indent"
                class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-primary/20"
              >
                <option value="2-spaces">2 Spaces</option>
                <option value="4-spaces">4 Spaces</option>
              </select>
            </div>

            <!-- Context Options -->
            @if (direction() === 'yaml-to-json') {
              <label class="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" [(ngModel)]="minifyJson" class="rounded border-slate-300 text-primary focus:ring-primary" />
                <span>Minify JSON</span>
              </label>
            } @else {
              <label class="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" [(ngModel)]="sortKeys" class="rounded border-slate-300 text-primary focus:ring-primary" />
                <span>Sort Keys Alphabetically</span>
              </label>
            }

            <!-- Metrics -->
            @if (result(); as res) {
              <div class="ml-auto flex items-center gap-4 text-slate-500 dark:text-slate-400">
                <span>Input: <strong class="font-mono text-slate-700 dark:text-slate-300">{{ res.originalSize }} B</strong></span>
                <span>Output: <strong class="font-mono text-slate-700 dark:text-slate-300">{{ res.outputSize }} B</strong></span>
                <span>Lines: <strong class="font-mono text-slate-700 dark:text-slate-300">{{ res.lineCount }}</strong></span>
              </div>
            }
          </div>

          <!-- Dual Monospace Panes -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Left Pane: Input -->
            <div class="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <div class="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span class="flex items-center gap-2">
                  <app-icon name="file-text" [size]="14" />
                  {{ direction() === 'yaml-to-json' ? 'YAML INPUT' : 'JSON INPUT' }}
                </span>
                <span class="text-slate-400 font-mono text-[11px]">{{ inputText().length }} chars</span>
              </div>
              <textarea
                [(ngModel)]="inputText"
                rows="20"
                [placeholder]="direction() === 'yaml-to-json' ? 'Paste YAML configuration here...' : 'Paste JSON content here...'"
                class="w-full p-4 font-mono text-xs leading-relaxed bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none resize-y"
              ></textarea>
            </div>

            <!-- Right Pane: Output -->
            <div class="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <div class="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span class="flex items-center gap-2">
                  <app-icon name="check-circle" [size]="14" class="text-emerald-500" />
                  {{ direction() === 'yaml-to-json' ? 'JSON OUTPUT' : 'YAML OUTPUT' }}
                </span>
                <div class="flex items-center gap-2">
                  @if (outputText()) {
                    <app-copy-button [text]="outputText()" [label]="direction() === 'yaml-to-json' ? 'Copy JSON' : 'Copy YAML'" />
                    <app-download-button
                      [content]="outputText()"
                      [filename]="direction() === 'yaml-to-json' ? 'config.json' : 'config.yaml'"
                      [label]="direction() === 'yaml-to-json' ? 'Download .json' : 'Download .yaml'"
                    />
                  }
                </div>
              </div>
              <div class="relative flex-1 bg-slate-50/40 dark:bg-slate-950/40">
                @if (result().error; as err) {
                  <div class="p-4 m-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-mono">
                    <div class="font-bold flex items-center gap-1.5 mb-1">
                      <app-icon name="alert-circle" [size]="14" />
                      Parsing Syntax Error
                      @if (result().errorLine) {
                        (Line {{ result().errorLine }}, Col {{ result().errorColumn }})
                      }
                    </div>
                    <pre class="whitespace-pre-wrap">{{ err }}</pre>
                  </div>
                }
                <textarea
                  [value]="outputText()"
                  readonly
                  rows="20"
                  [placeholder]="direction() === 'yaml-to-json' ? 'Converted JSON will generate here...' : 'Converted YAML will generate here...'"
                  class="w-full p-4 font-mono text-xs leading-relaxed bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none resize-y select-text"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </app-tool-page-layout>
    }
  `
})
export class YamlJsonConverterComponent implements OnInit {
  private readonly toolRegistry = inject(ToolRegistryService);
  private readonly recentToolsService = inject(RecentToolsService);

  public readonly tool = signal<ToolMetadata | undefined>(
    this.toolRegistry.getToolById('yaml-json-converter')
  );

  public readonly direction = signal<ConversionDirection>('yaml-to-json');
  public readonly inputText = signal<string>(YAML_SAMPLES.dockerCompose.yaml);
  public readonly indent = signal<ConverterIndent>('2-spaces');
  public readonly minifyJson = signal<boolean>(false);
  public readonly sortKeys = signal<boolean>(false);

  public readonly result = computed(() => {
    if (this.direction() === 'yaml-to-json') {
      return convertYamlToJson(this.inputText(), this.indent(), this.minifyJson());
    } else {
      return convertJsonToYaml(this.inputText(), this.indent(), this.sortKeys());
    }
  });

  public readonly outputText = computed(() => this.result().output);

  public ngOnInit(): void {
    this.recentToolsService.recordUsage('yaml-json-converter');
  }

  public loadSample(key: 'dockerCompose' | 'k8sDeployment'): void {
    this.direction.set('yaml-to-json');
    this.inputText.set(YAML_SAMPLES[key].yaml);
  }

  public swapDirection(): void {
    const currentOutput = this.outputText();
    const newDir: ConversionDirection = this.direction() === 'yaml-to-json' ? 'json-to-yaml' : 'yaml-to-json';

    this.direction.set(newDir);
    if (currentOutput) {
      this.inputText.set(currentOutput);
    }
  }

  public clearAll(): void {
    this.inputText.set('');
  }
}
