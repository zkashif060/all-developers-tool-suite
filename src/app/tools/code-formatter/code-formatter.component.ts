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
  formatCode,
  minifyCode,
  CodeLanguage,
  FormatterIndent,
  CODE_SAMPLES
} from './code-formatter.engine';

@Component({
  selector: 'app-code-formatter',
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
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Sample:</span>
              <button
                type="button"
                (click)="loadLanguageSample()"
                class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Load {{ language().toUpperCase() }} Sample
              </button>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="minify()"
                [disabled]="!inputCode().trim()"
                class="px-3 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 transition-colors cursor-pointer"
                title="Minify code into single compact stream"
              >
                Minify Code
              </button>
              <button
                type="button"
                (click)="beautify()"
                [disabled]="!inputCode().trim()"
                class="px-3 py-1 text-xs font-medium rounded-md bg-primary hover:bg-primary-hover text-white disabled:opacity-50 transition-colors cursor-pointer"
              >
                Beautify
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
            <!-- Language Selector Tabs -->
            <div class="flex items-center gap-1 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                (click)="selectLanguage('html')"
                class="px-3 py-1.5 rounded-md font-semibold transition-colors"
                [class.bg-white]="language() === 'html'"
                [class.dark:bg-slate-900]="language() === 'html'"
                [class.text-primary]="language() === 'html'"
                [class.shadow-xs]="language() === 'html'"
                [class.text-slate-600]="language() !== 'html'"
                [class.dark:text-slate-400]="language() !== 'html'"
              >
                HTML
              </button>
              <button
                type="button"
                (click)="selectLanguage('css')"
                class="px-3 py-1.5 rounded-md font-semibold transition-colors"
                [class.bg-white]="language() === 'css'"
                [class.dark:bg-slate-900]="language() === 'css'"
                [class.text-primary]="language() === 'css'"
                [class.shadow-xs]="language() === 'css'"
                [class.text-slate-600]="language() !== 'css'"
                [class.dark:text-slate-400]="language() !== 'css'"
              >
                CSS
              </button>
              <button
                type="button"
                (click)="selectLanguage('javascript')"
                class="px-3 py-1.5 rounded-md font-semibold transition-colors"
                [class.bg-white]="language() === 'javascript'"
                [class.dark:bg-slate-900]="language() === 'javascript'"
                [class.text-primary]="language() === 'javascript'"
                [class.shadow-xs]="language() === 'javascript'"
                [class.text-slate-600]="language() !== 'javascript'"
                [class.dark:text-slate-400]="language() !== 'javascript'"
              >
                JavaScript
              </button>
            </div>

            <!-- Indentation -->
            <div class="flex items-center gap-2">
              <span class="font-semibold text-slate-600 dark:text-slate-400">Indent:</span>
              <select
                [(ngModel)]="indent"
                class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-primary/20"
              >
                <option value="2-spaces">2 Spaces</option>
                <option value="4-spaces">4 Spaces</option>
                <option value="tabs">Tabs</option>
              </select>
            </div>

            <!-- Line Wrap -->
            <div class="flex items-center gap-2">
              <span class="font-semibold text-slate-600 dark:text-slate-400">Line Wrap:</span>
              <select
                [(ngModel)]="wrapLineLength"
                class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-primary/20"
              >
                <option [ngValue]="0">Disabled (No Wrap)</option>
                <option [ngValue]="80">80 Columns</option>
                <option [ngValue]="100">100 Columns</option>
                <option [ngValue]="120">120 Columns</option>
              </select>
            </div>

            <!-- Metrics -->
            @if (result(); as res) {
              <div class="ml-auto flex items-center gap-4 text-slate-500 dark:text-slate-400">
                <span>Input: <strong class="font-mono text-slate-700 dark:text-slate-300">{{ res.originalSize }} B</strong></span>
                <span>Output: <strong class="font-mono text-slate-700 dark:text-slate-300">{{ res.formattedSize }} B</strong></span>
                <span>Lines: <strong class="font-mono text-slate-700 dark:text-slate-300">{{ res.lineCount }}</strong></span>
              </div>
            }
          </div>

          <!-- Dual Monospace Panes -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Left Pane: Input Code -->
            <div class="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <div class="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span class="flex items-center gap-2 uppercase">
                  <app-icon name="code" [size]="14" />
                  RAW {{ language() }} INPUT
                </span>
                <span class="text-slate-400 font-mono text-[11px]">{{ inputCode().length }} chars</span>
              </div>
              <textarea
                [(ngModel)]="inputCode"
                rows="20"
                [placeholder]="'Paste ' + language().toUpperCase() + ' code here...'"
                class="w-full p-4 font-mono text-xs leading-relaxed bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none resize-y"
              ></textarea>
            </div>

            <!-- Right Pane: Formatted Output -->
            <div class="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <div class="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span class="flex items-center gap-2 uppercase">
                  <app-icon name="check-circle" [size]="14" class="text-emerald-500" />
                  FORMATTED {{ language() }} OUTPUT
                </span>
                <div class="flex items-center gap-2">
                  @if (outputCode()) {
                    <app-copy-button [text]="outputCode()" label="Copy Code" />
                    <app-download-button
                      [content]="outputCode()"
                      [filename]="getDownloadFilename()"
                      label="Download"
                    />
                  }
                </div>
              </div>
              <div class="relative flex-1 bg-slate-50/40 dark:bg-slate-950/40">
                @if (result().error; as err) {
                  <div class="p-4 m-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-mono">
                    <strong>Formatting Error:</strong> {{ err }}
                  </div>
                }
                <textarea
                  [value]="outputCode()"
                  readonly
                  rows="20"
                  placeholder="Formatted code will generate here automatically..."
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
export class CodeFormatterComponent implements OnInit {
  private readonly toolRegistry = inject(ToolRegistryService);
  private readonly recentToolsService = inject(RecentToolsService);

  public readonly tool = signal<ToolMetadata | undefined>(
    this.toolRegistry.getToolById('code-formatter')
  );

  public readonly language = signal<CodeLanguage>('html');
  public readonly inputCode = signal<string>(CODE_SAMPLES.html.code);
  public readonly indent = signal<FormatterIndent>('2-spaces');
  public readonly wrapLineLength = signal<number>(0);
  public readonly isMinifyMode = signal<boolean>(false);

  public readonly result = computed(() => {
    if (this.isMinifyMode()) {
      return minifyCode(this.inputCode(), this.language());
    }
    return formatCode(this.inputCode(), {
      language: this.language(),
      indent: this.indent(),
      wrapLineLength: this.wrapLineLength(),
      preserveNewlines: true,
      maxPreserveNewlines: 2,
      indentInnerHtml: true
    });
  });

  public readonly outputCode = computed(() => this.result().formatted);

  public ngOnInit(): void {
    this.recentToolsService.recordUsage('code-formatter');
  }

  public selectLanguage(lang: CodeLanguage): void {
    this.language.set(lang);
    this.isMinifyMode.set(false);
    this.inputCode.set(CODE_SAMPLES[lang].code);
  }

  public loadLanguageSample(): void {
    this.isMinifyMode.set(false);
    this.inputCode.set(CODE_SAMPLES[this.language()].code);
  }

  public beautify(): void {
    this.isMinifyMode.set(false);
  }

  public minify(): void {
    this.isMinifyMode.set(true);
  }

  public clearAll(): void {
    this.inputCode.set('');
  }

  public getDownloadFilename(): string {
    switch (this.language()) {
      case 'html':
        return 'formatted.html';
      case 'css':
        return 'formatted.css';
      case 'javascript':
        return 'formatted.js';
    }
  }
}
