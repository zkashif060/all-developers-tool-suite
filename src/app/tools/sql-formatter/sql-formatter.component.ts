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
  formatSql,
  minifySql,
  SqlDialect,
  KeywordCase,
  SqlIndent,
  SQL_DIALECT_LABELS,
  SQL_SAMPLES
} from './sql-formatter.engine';

@Component({
  selector: 'app-sql-formatter',
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
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Samples:</span>
              <button
                type="button"
                (click)="loadSample('complexJoin')"
                class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                JOIN & Aggregation
              </button>
              <button
                type="button"
                (click)="loadSample('cteWindow')"
                class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                CTE & Window Functions
              </button>
              <button
                type="button"
                (click)="loadSample('ddlTable')"
                class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                CREATE TABLE & DDL
              </button>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="minify()"
                [disabled]="!inputSql().trim()"
                class="px-3 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 transition-colors"
                title="Minify SQL query onto single lines"
              >
                Minify SQL
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
            <!-- SQL Dialect -->
            <div class="flex items-center gap-2">
              <span class="font-semibold text-slate-600 dark:text-slate-400">Dialect:</span>
              <select
                [(ngModel)]="dialect"
                class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-primary/20"
              >
                @for (d of dialects; track d.id) {
                  <option [value]="d.id">{{ d.label }}</option>
                }
              </select>
            </div>

            <!-- Keyword Casing -->
            <div class="flex items-center gap-2">
              <span class="font-semibold text-slate-600 dark:text-slate-400">Keywords:</span>
              <select
                [(ngModel)]="keywordCase"
                class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-primary/20"
              >
                <option value="upper">UPPERCASE</option>
                <option value="lower">lowercase</option>
                <option value="preserve">Preserve</option>
              </select>
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

            <!-- Metrics -->
            @if (result(); as res) {
              <div class="ml-auto flex items-center gap-4 text-slate-500 dark:text-slate-400">
                <span>Queries: <strong class="font-mono text-slate-700 dark:text-slate-300">{{ res.queryCount }}</strong></span>
                <span>Original: <strong class="font-mono text-slate-700 dark:text-slate-300">{{ res.originalSize }} B</strong></span>
                <span>Formatted: <strong class="font-mono text-slate-700 dark:text-slate-300">{{ res.formattedSize }} B</strong></span>
              </div>
            }
          </div>

          <!-- Dual Monospace Panes -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Left Pane: Input SQL -->
            <div class="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <div class="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span class="flex items-center gap-2">
                  <app-icon name="database" [size]="14" />
                  RAW SQL QUERY INPUT
                </span>
                <span class="text-slate-400 font-mono text-[11px]">{{ inputSql().length }} chars</span>
              </div>
              <textarea
                [(ngModel)]="inputSql"
                rows="18"
                placeholder="Paste unformatted SQL query here (e.g. SELECT * FROM users INNER JOIN orders...)"
                class="w-full p-4 font-mono text-xs leading-relaxed bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none resize-y"
              ></textarea>
            </div>

            <!-- Right Pane: Formatted SQL Output -->
            <div class="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <div class="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span class="flex items-center gap-2">
                  <app-icon name="check-circle" [size]="14" class="text-emerald-500" />
                  FORMATTED SQL OUTPUT
                </span>
                <div class="flex items-center gap-2">
                  @if (outputSql()) {
                    <app-copy-button [text]="outputSql()" label="Copy SQL" />
                    <app-download-button [content]="outputSql()" filename="formatted-query.sql" label="Download .sql" />
                  }
                </div>
              </div>
              <div class="relative flex-1 bg-slate-50/40 dark:bg-slate-950/40">
                <textarea
                  [value]="outputSql()"
                  readonly
                  rows="18"
                  placeholder="Formatted SQL output will appear here automatically..."
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
export class SqlFormatterComponent implements OnInit {
  private readonly toolRegistry = inject(ToolRegistryService);
  private readonly recentToolsService = inject(RecentToolsService);

  public readonly tool = signal<ToolMetadata | undefined>(
    this.toolRegistry.getToolById('sql-formatter')
  );

  public readonly dialects: { id: SqlDialect; label: string }[] = [
    { id: 'sql', label: 'Standard SQL' },
    { id: 'postgresql', label: 'PostgreSQL' },
    { id: 'mysql', label: 'MySQL / MariaDB' },
    { id: 'transactsql', label: 'SQL Server (T-SQL)' },
    { id: 'sqlite', label: 'SQLite' },
    { id: 'bigquery', label: 'Google BigQuery' },
    { id: 'plsql', label: 'Oracle PL/SQL' }
  ];

  public readonly inputSql = signal<string>(SQL_SAMPLES['complexJoin'].query);
  public readonly dialect = signal<SqlDialect>('sql');
  public readonly keywordCase = signal<KeywordCase>('upper');
  public readonly indent = signal<SqlIndent>('2-spaces');

  public readonly result = computed(() => {
    return formatSql(this.inputSql(), {
      dialect: this.dialect(),
      keywordCase: this.keywordCase(),
      dataTypeCase: this.keywordCase(),
      functionCase: this.keywordCase(),
      indent: this.indent(),
      linesBetweenQueries: 1
    });
  });

  public readonly outputSql = computed(() => this.result().formatted);

  public ngOnInit(): void {
    this.recentToolsService.recordUsage('sql-formatter');
  }

  public loadSample(key: string): void {
    const sample = SQL_SAMPLES[key];
    if (sample) {
      this.inputSql.set(sample.query);
    }
  }

  public minify(): void {
    const minified = minifySql(this.inputSql());
    this.inputSql.set(minified);
  }

  public clearAll(): void {
    this.inputSql.set('');
  }
}
