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
import { CsvDelimiter, csvToJson } from './csv-to-json.engine';

@Component({
  selector: 'app-csv-to-json',
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
          <div class="flex flex-wrap items-center gap-4 text-xs">
            <!-- Delimiter Selector (Auto vs Manual Override) -->
            <div class="flex items-center gap-1.5">
              <span class="font-semibold text-slate-700 dark:text-slate-300">Delimiter:</span>
              <select
                [ngModel]="delimiter()"
                (ngModelChange)="delimiter.set($event)"
                aria-label="CSV delimiter override"
                class="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono focus:ring-primary-500"
              >
                <option value="auto">Auto-Detect</option>
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="&#9;">Tab (\\t - TSV)</option>
                <option value="|">Pipe (|)</option>
              </select>
            </div>

            <!-- Header Row Toggle -->
            <label class="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-medium select-none">
              <input
                type="checkbox"
                [ngModel]="hasHeader()"
                (ngModelChange)="hasHeader.set($event)"
                class="rounded text-primary-500 focus:ring-primary-500"
              />
              <span>First Row as Headers</span>
            </label>

            <!-- Dynamic Typing Toggle -->
            <label class="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-medium select-none">
              <input
                type="checkbox"
                [ngModel]="dynamicTyping()"
                (ngModelChange)="dynamicTyping.set($event)"
                class="rounded text-primary-500 focus:ring-primary-500"
              />
              <span>Auto-detect Numbers & Booleans</span>
            </label>

            <!-- Indentation -->
            <div class="flex items-center gap-2">
              <span class="font-medium text-slate-600 dark:text-slate-400">Indent:</span>
              <div class="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800">
                <button
                  type="button"
                  (click)="setIndent(2)"
                  class="px-2 py-0.5 rounded text-xs transition-all"
                  [class]="indent() === 2 ? 'bg-white dark:bg-slate-700 text-primary-500 shadow-xs font-semibold' : 'text-slate-500'"
                >
                  2 Spaces
                </button>
                <button
                  type="button"
                  (click)="setIndent(4)"
                  class="px-2 py-0.5 rounded text-xs transition-all"
                  [class]="indent() === 4 ? 'bg-white dark:bg-slate-700 text-primary-500 shadow-xs font-semibold' : 'text-slate-500'"
                >
                  4 Spaces
                </button>
                <button
                  type="button"
                  (click)="setIndent('minify')"
                  class="px-2 py-0.5 rounded text-xs transition-all"
                  [class]="indent() === 'minify' ? 'bg-white dark:bg-slate-700 text-primary-500 shadow-xs font-semibold' : 'text-slate-500'"
                >
                  Minify
                </button>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="convert()"
              class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <app-icon name="file-text" [size]="14" />
              <span>Convert to JSON</span>
            </button>
          </div>
        </div>

        <!-- Delimiter Advice Callout -->
        <div class="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <app-icon name="info" [size]="14" className="text-primary-500 flex-shrink-0" />
            <span>
              <strong>Data Accuracy Tip:</strong> If your dataset contains European decimals or currencies with commas (e.g. <code class="font-mono text-primary-500">12,50 €</code>), manually select <strong>Semicolon (;)</strong> or <strong>Tab (\\t)</strong> to prevent silent column corruption.
            </span>
          </div>
          @if (detectedDelimiter()) {
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              Active Delimiter: {{ formatDelimiterName(detectedDelimiter()!) }}
            </span>
          }
        </div>

        <!-- Warnings Banner -->
        @if (warnings().length > 0) {
          <div class="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs space-y-1">
            <div class="font-bold flex items-center gap-1.5">
              <app-icon name="alert-circle" [size]="15" className="text-amber-500" />
              <span>Sanitization Notices:</span>
            </div>
            <ul class="list-disc list-inside space-y-0.5 pl-1">
              @for (w of warnings(); track $index) {
                <li>{{ w }}</li>
              }
            </ul>
          </div>
        }

        @if (errorMessage()) {
          <app-error-message
            title="CSV Parsing Error"
            [message]="errorMessage()!"
            [line]="errorLine()"
            [dismissible]="true"
            (dismissed)="errorMessage.set(null)"
          />
        }

        <!-- Summary Bar -->
        @if (summary(); as s) {
          <div class="flex items-center justify-between px-4 py-2 rounded-lg bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400">
            <div>
              <span>Rows: <strong>{{ s.rows }}</strong></span>
              <span class="mx-2">&middot;</span>
              <span>Columns: <strong>{{ s.columns }}</strong></span>
              @if (detectedDelimiter()) {
                <span class="mx-2">&middot;</span>
                <span>Delimiter: <strong>{{ formatDelimiterName(detectedDelimiter()!) }}</strong></span>
              }
            </div>
            <span class="text-emerald-600 dark:text-emerald-400 font-semibold">&check; RFC 4180 Compliant</span>
          </div>
        }

        <!-- Dual Pane Workspace -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[460px]">
          <app-tool-input
            label="Raw CSV Input"
            [value]="inputContent()"
            (valueChange)="onInputChanged($event)"
            [sampleData]="sampleCsv"
            acceptedFileTypes=".csv,.tsv,text/csv,text/tab-separated-values,text/plain"
            placeholder="id,name,role,city,active&#10;1,Ali,Architect,&quot;Lahore, PK&quot;,true&#10;2,Sara,Security,&quot;Karachi, PK&quot;,true"
          />

          <app-tool-output
            label="Converted JSON Output"
            [value]="outputContent()"
            placeholder="Parsed JSON array will appear here..."
            filename="export.json"
            mimeType="application/json"
          />
        </div>
      </app-tool-page-layout>
    }
  `
})
export class CsvToJsonComponent implements OnInit {
  private readonly toolRegistry = inject(ToolRegistryService);
  private readonly recentToolsService = inject(RecentToolsService);

  public readonly tool = signal<ToolMetadata | undefined>(
    this.toolRegistry.getToolById('csv-to-json')
  );

  protected readonly inputContent = signal<string>('');
  protected readonly outputContent = signal<string>('');
  protected readonly delimiter = signal<CsvDelimiter>('auto');
  protected readonly hasHeader = signal<boolean>(true);
  protected readonly dynamicTyping = signal<boolean>(true);
  protected readonly indent = signal<2 | 4 | 'minify'>(2);

  protected readonly warnings = signal<string[]>([]);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly errorLine = signal<number | undefined>(undefined);
  protected readonly summary = signal<{ rows: number; columns: number } | null>(null);
  protected readonly detectedDelimiter = signal<string | null>(null);

  protected readonly sampleCsv = `id,name,role,city,active,salary\n101,Ali Hassan,Lead Architect,"Lahore, Pakistan",true,185000\n102,Sara Khan,Security Engineer,"Karachi, Pakistan",true,195000\n103,Hamza Tariq,DevOps Engineer,"Islamabad, Pakistan",false,160000\n104,Zain Ahmed,Frontend Specialist,"Rawalpindi, Pakistan",true,175000`;

  public ngOnInit(): void {
    this.recentToolsService.recordUsage('csv-to-json');
  }

  public setIndent(val: 2 | 4 | 'minify'): void {
    this.indent.set(val);
  }

  public onInputChanged(val: string): void {
    this.inputContent.set(val);
    this.errorMessage.set(null);
    this.errorLine.set(undefined);
    if (!val.trim()) {
      this.outputContent.set('');
      this.warnings.set([]);
      this.summary.set(null);
      this.detectedDelimiter.set(null);
    }
  }

  public convert(): void {
    const raw = this.inputContent();
    if (!raw.trim()) {
      this.outputContent.set('');
      this.errorMessage.set('Input is empty. Please enter or paste CSV content.');
      this.errorLine.set(undefined);
      this.warnings.set([]);
      this.summary.set(null);
      this.detectedDelimiter.set(null);
      return;
    }

    const res = csvToJson(raw, {
      delimiter: this.delimiter(),
      hasHeader: this.hasHeader(),
      dynamicTyping: this.dynamicTyping(),
      indent: this.indent()
    });

    if (res.success) {
      this.outputContent.set(res.json);
      this.errorMessage.set(null);
      this.errorLine.set(undefined);
      this.warnings.set(res.warnings || []);
      this.detectedDelimiter.set(res.detectedDelimiter);
      this.summary.set({
        rows: res.rowCount,
        columns: res.columnCount
      });
    } else {
      this.errorMessage.set(res.error);
      this.errorLine.set(res.line);
      this.warnings.set([]);
      this.summary.set(null);
      this.detectedDelimiter.set(null);
    }
  }

  public formatDelimiterName(delim: string): string {
    switch (delim) {
      case ',': return 'Comma (,)';
      case ';': return 'Semicolon (;)';
      case '\t': return 'Tab (\\t)';
      case '|': return 'Pipe (|)';
      default: return `Custom (${delim})`;
    }
  }
}
