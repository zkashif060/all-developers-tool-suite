import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolRegistryService } from '../../core/services/tool-registry.service';
import { RecentToolsService } from '../../core/services/recent-tools.service';
import { ToolMetadata } from '../../core/models/tool.model';
import { ToolPageLayoutComponent } from '../../shared/components/tool-page-layout/tool-page-layout.component';
import { ToolInputComponent } from '../../shared/components/tool-input/tool-input.component';
import { ToolOutputComponent } from '../../shared/components/tool-output/tool-output.component';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { JsonIndentOption, formatJson } from './json-formatter.engine';

@Component({
  selector: 'app-json-formatter',
  standalone: true,
  imports: [
    FormsModule,
    ToolPageLayoutComponent,
    ToolInputComponent,
    ToolOutputComponent,
    AppIconComponent,
    ErrorMessageComponent
  ],
  template: `
    @if (tool(); as t) {
      <app-tool-page-layout [tool]="t">
        <!-- Control Toolbar -->
        <div class="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div class="flex flex-wrap items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-slate-600 dark:text-slate-400">Indentation:</span>
              <div class="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800">
                <button
                  type="button"
                  (click)="setIndent(2)"
                  class="px-2.5 py-1 text-xs font-medium rounded-md transition-all"
                  [class]="indent() === 2 ? 'bg-white dark:bg-slate-700 text-primary-500 shadow-xs font-semibold' : 'text-slate-600 dark:text-slate-400'"
                >
                  2 Spaces
                </button>
                <button
                  type="button"
                  (click)="setIndent(4)"
                  class="px-2.5 py-1 text-xs font-medium rounded-md transition-all"
                  [class]="indent() === 4 ? 'bg-white dark:bg-slate-700 text-primary-500 shadow-xs font-semibold' : 'text-slate-600 dark:text-slate-400'"
                >
                  4 Spaces
                </button>
                <button
                  type="button"
                  (click)="setIndent('minify')"
                  class="px-2.5 py-1 text-xs font-medium rounded-md transition-all"
                  [class]="indent() === 'minify' ? 'bg-white dark:bg-slate-700 text-primary-500 shadow-xs font-semibold' : 'text-slate-600 dark:text-slate-400'"
                >
                  Minify
                </button>
              </div>
            </div>

            <label class="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                [ngModel]="sortKeys()"
                (ngModelChange)="sortKeys.set($event)"
                class="rounded text-primary-500 focus:ring-primary-500"
              />
              <span>Sort Keys Alphabetically</span>
            </label>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="triggerFormat()"
              class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <app-icon name="code" [size]="14" />
              <span>{{ indent() === 'minify' ? 'Minify JSON' : 'Format JSON' }}</span>
            </button>
          </div>
        </div>

        <!-- Error Alert Banner -->
        @if (errorDetails(); as err) {
          <app-error-message
            title="JSON Syntax Error"
            [message]="err.error"
            [line]="err.line"
            [column]="err.column"
            [dismissible]="true"
            (dismissed)="errorDetails.set(null)"
          />
        }

        <!-- Metrics Banner -->
        @if (metrics(); as m) {
          <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-2 rounded-lg bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400">
            <div>
              Original Size: <strong class="text-slate-900 dark:text-slate-200">{{ m.originalByteSize }} B</strong> &middot;
              Output Size: <strong class="text-slate-900 dark:text-slate-200">{{ m.byteSize }} B</strong>
            </div>
            <div>
              Lines: <strong class="text-slate-900 dark:text-slate-200">{{ m.lineCount }}</strong>
            </div>
          </div>
        }

        <!-- Dual Pane Input & Output -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[460px]">
          <app-tool-input
            label="Raw JSON Input"
            [value]="inputContent()"
            (valueChange)="onInputChanged($event)"
            [sampleData]="sampleJson"
            placeholder="Paste raw JSON here or drop a .json file..."
          />

          <app-tool-output
            label="Formatted JSON Output"
            [value]="outputContent()"
            placeholder="Formatted or minified JSON will appear here..."
            filename="formatted.json"
            mimeType="application/json"
          />
        </div>
      </app-tool-page-layout>
    }
  `
})
export class JsonFormatterComponent implements OnInit {
  private readonly toolRegistry = inject(ToolRegistryService);
  private readonly recentToolsService = inject(RecentToolsService);

  public readonly tool = signal<ToolMetadata | undefined>(
    this.toolRegistry.getToolById('json-formatter')
  );

  protected readonly inputContent = signal<string>('');
  protected readonly outputContent = signal<string>('');
  protected readonly indent = signal<JsonIndentOption>(2);
  protected readonly sortKeys = signal<boolean>(false);

  protected readonly errorDetails = signal<{ error: string; line?: number; column?: number } | null>(null);
  protected readonly metrics = signal<{ byteSize: number; originalByteSize: number; lineCount: number } | null>(null);

  protected readonly sampleJson = `{\n  "name": "DevTools Hub",\n  "version": "1.0.0",\n  "description": "In-browser developer utilities suite",\n  "private": true,\n  "features": [\n    "100% Client-Side",\n    "Zero Server Data Transmission",\n    "Web Crypto & High Precision"\n  ],\n  "metrics": {\n    "toolsCount": 12,\n    "offlineReady": true\n  }\n}`;

  public ngOnInit(): void {
    this.recentToolsService.recordUsage('json-formatter');
  }

  public setIndent(val: JsonIndentOption): void {
    this.indent.set(val);
  }

  public onInputChanged(val: string): void {
    this.inputContent.set(val);
    this.errorDetails.set(null);
    if (!val.trim()) {
      this.outputContent.set('');
      this.metrics.set(null);
    }
  }

  public triggerFormat(): void {
    const raw = this.inputContent();
    if (!raw.trim()) {
      this.outputContent.set('');
      this.errorDetails.set({ error: 'Input is empty. Please enter or paste a JSON string.' });
      this.metrics.set(null);
      return;
    }

    const res = formatJson(raw, {
      indent: this.indent(),
      sortKeys: this.sortKeys()
    });

    if (res.success) {
      this.outputContent.set(res.formatted);
      this.errorDetails.set(null);
      this.metrics.set({
        byteSize: res.byteSize,
        originalByteSize: res.originalByteSize,
        lineCount: res.lineCount
      });
    } else {
      // Preserve existing output or notify user
      this.errorDetails.set({
        error: res.error,
        line: res.line,
        column: res.column
      });
      this.metrics.set(null);
    }
  }
}
