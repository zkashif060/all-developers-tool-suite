import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolRegistryService } from '../../core/services/tool-registry.service';
import { RecentToolsService } from '../../core/services/recent-tools.service';
import { ToolMetadata } from '../../core/models/tool.model';
import { ToolPageLayoutComponent } from '../../shared/components/tool-page-layout/tool-page-layout.component';
import { ToolInputComponent } from '../../shared/components/tool-input/tool-input.component';
import { ToolOutputComponent } from '../../shared/components/tool-output/tool-output.component';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { CopyButtonComponent } from '../../shared/components/copy-button/copy-button.component';
import { DownloadButtonComponent } from '../../shared/components/download-button/download-button.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import {
  ArrayHandlingStrategy,
  ArrayPathOption,
  NestedHandlingStrategy,
  jsonToCsv
} from './json-to-csv.engine';

@Component({
  selector: 'app-json-to-csv',
  standalone: true,
  imports: [
    FormsModule,
    ToolPageLayoutComponent,
    ToolInputComponent,
    ToolOutputComponent,
    AppIconComponent,
    CopyButtonComponent,
    DownloadButtonComponent,
    ErrorMessageComponent
  ],
  template: `
    @if (tool(); as t) {
      <app-tool-page-layout [tool]="t">
        <!-- Main Controls Toolbar -->
        <div class="flex flex-col gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <!-- Top Row: Presets and Primary Action -->
          <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Load Preset:</span>
              <button
                type="button"
                (click)="loadPreset('multi_array')"
                class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Multi-Array (Products & Orders)
              </button>
              <button
                type="button"
                (click)="loadPreset('variations')"
                class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Product Variations
              </button>
              <button
                type="button"
                (click)="loadPreset('employees')"
                class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                API Envelope (Employees)
              </button>
              <button
                type="button"
                (click)="loadPreset('multilingual')"
                class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Multilingual & Nested
              </button>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="convert()"
                class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <app-icon name="table" [size]="14" />
                <span>Convert to CSV</span>
              </button>
            </div>
          </div>

          <!-- Bottom Row: Conversion Strategies & Configuration -->
          <div class="flex flex-wrap items-center gap-4 text-xs">
            <!-- Array Handling Strategy (for Variations / Products) -->
            <div class="flex items-center gap-2">
              <span class="font-semibold text-slate-600 dark:text-slate-400">Arrays / Lists:</span>
              <select
                [ngModel]="arrayStrategy()"
                (ngModelChange)="arrayStrategy.set($event)"
                class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-primary-500"
                title="Controls how arrays of items (e.g. products, variations, orders) are converted"
              >
                <option value="unwind">Unwind Arrays into Rows (1 Row per Item)</option>
                <option value="join">Readable List (e.g. item 1, item 2)</option>
                <option value="indexed">Indexed Columns (e.g. products.0)</option>
                <option value="stringify">Keep Raw JSON in Cell</option>
              </select>
            </div>

            <!-- Repeat Parent Values on Sub-rows -->
            @if (arrayStrategy() === 'unwind') {
              <label class="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400 select-none" title="When unchecked, parent columns remain blank on extra rows for clean alignment">
                <input
                  type="checkbox"
                  [ngModel]="repeatParentValues()"
                  (ngModelChange)="repeatParentValues.set($event)"
                  class="rounded text-primary-500 focus:ring-primary-500"
                />
                <span>Repeat Parent Fields</span>
              </label>
            }

            <!-- Nested Objects Strategy -->
            <div class="flex items-center gap-2">
              <span class="font-semibold text-slate-600 dark:text-slate-400">Nested Objects:</span>
              <select
                [ngModel]="nestedStrategy()"
                (ngModelChange)="nestedStrategy.set($event)"
                class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-primary-500"
              >
                <option value="flatten">Dot Notation (user.city)</option>
                <option value="flatten_underscore">Underscore (user_city)</option>
                <option value="stringify">Keep as JSON String</option>
              </select>
            </div>

            <!-- Delimiter -->
            <div class="flex items-center gap-2">
              <span class="font-semibold text-slate-600 dark:text-slate-400">Delimiter:</span>
              <select
                [ngModel]="delimiter()"
                (ngModelChange)="delimiter.set($event)"
                class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-primary-500"
              >
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="&#9;">Tab (\\t)</option>
                <option value="|">Pipe (|)</option>
              </select>
            </div>

            <!-- Header Toggle -->
            <label class="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400 select-none">
              <input
                type="checkbox"
                [ngModel]="includeHeader()"
                (ngModelChange)="includeHeader.set($event)"
                class="rounded text-primary-500 focus:ring-primary-500"
              />
              <span>Include Header</span>
            </label>

            <!-- Excel UTF-8 BOM Toggle -->
            <label
              class="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400 select-none"
              title="Adds the UTF-8 Byte Order Mark so Microsoft Excel opens Urdu, Arabic, Chinese, and emojis correctly"
            >
              <input
                type="checkbox"
                [ngModel]="excelBom()"
                (ngModelChange)="excelBom.set($event)"
                class="rounded text-primary-500 focus:ring-primary-500"
              />
              <span>Excel UTF-8 BOM</span>
            </label>

            <!-- Array Path Selector (if multiple detected) -->
            @if (availablePaths().length > 1) {
              <div class="flex items-center gap-2 ml-auto">
                <span class="font-semibold text-primary-600 dark:text-primary-400">Extract List:</span>
                <select
                  [ngModel]="selectedArrayPath()"
                  (ngModelChange)="selectedArrayPath.set($event)"
                  class="px-2.5 py-1.5 rounded-lg border border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-950/40 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-primary-500"
                >
                  @for (p of availablePaths(); track p.path) {
                    <option [value]="p.path">{{ p.label }}</option>
                  }
                </select>
              </div>
            }
          </div>
        </div>

        <!-- Strategy Information Alert -->
        @if (arrayStrategy() === 'unwind') {
          <div class="p-3 rounded-lg bg-primary-50/60 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-900/40 text-xs text-primary-800 dark:text-primary-300 flex items-center gap-2">
            <app-icon name="info" [size]="14" className="text-primary-500 flex-shrink-0" />
            <span><strong>Unwind Mode Active:</strong> Nested lists (e.g. product variations, order items) expand into separate rows with parent fields automatically repeated. This matches Shopify, WooCommerce, and database denormalization standards for Excel!</span>
          </div>
        }

        @if (errorMessage()) {
          <app-error-message
            title="Conversion Error"
            [message]="errorMessage()"
            [dismissible]="true"
            (dismissed)="errorMessage.set(null)"
          />
        }

        <!-- Metrics Summary Bar -->
        @if (summary(); as s) {
          <div class="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-lg bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <div class="flex flex-wrap items-center gap-3">
              <span>Columns: <strong class="text-slate-900 dark:text-slate-200">{{ s.columns }}</strong></span>
              <span>&middot;</span>
              <span>Rows: <strong class="text-slate-900 dark:text-slate-200">{{ s.rows }}</strong></span>
              @if (s.unwrappedKey) {
                <span>&middot;</span>
                <span class="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <app-icon name="check" [size]="12" />
                  Auto-Extracted from &quot;{{ s.unwrappedKey }}&quot;
                </span>
              }
            </div>

            <!-- View Switcher -->
            <div class="flex items-center p-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <button
                type="button"
                (click)="activeView.set('table')"
                [class.bg-primary-50]="activeView() === 'table'"
                [class.text-primary-600]="activeView() === 'table'"
                [class.dark:bg-primary-950]="activeView() === 'table'"
                [class.dark:text-primary-400]="activeView() === 'table'"
                class="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-slate-600 dark:text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-slate-200"
              >
                <app-icon name="table" [size]="13" />
                <span>Table Grid Preview</span>
              </button>
              <button
                type="button"
                (click)="activeView.set('raw')"
                [class.bg-primary-50]="activeView() === 'raw'"
                [class.text-primary-600]="activeView() === 'raw'"
                [class.dark:bg-primary-950]="activeView() === 'raw'"
                [class.dark:text-primary-400]="activeView() === 'raw'"
                class="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-slate-600 dark:text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-slate-200"
              >
                <app-icon name="file-text" [size]="13" />
                <span>Raw CSV</span>
              </button>
            </div>
          </div>
        }

        <!-- Dual Pane Workspace -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
          <!-- Input Side -->
          <app-tool-input
            label="JSON Input"
            [value]="inputContent()"
            (valueChange)="onInputChanged($event)"
            [sampleData]="presetVariations"
            placeholder="[&#10;  { &quot;id&quot;: 1, &quot;name&quot;: &quot;Ali&quot;, &quot;city&quot;: &quot;Lahore&quot; },&#10;  { &quot;id&quot;: 2, &quot;name&quot;: &quot;Sara&quot;, &quot;city&quot;: &quot;Karachi&quot; }&#10;]"
          />

          <!-- Output Side: Toggle between Table Grid and Raw CSV -->
          @if (activeView() === 'table' && summary()) {
            <div class="flex flex-col h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <!-- Table Header Toolbar -->
              <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Spreadsheet Grid Preview</span>
                  <span class="text-[11px] text-slate-500 dark:text-slate-400">({{ summary()?.rows }} rows &times; {{ summary()?.columns }} cols)</span>
                </div>
                <div class="flex items-center gap-2">
                  <app-copy-button [text]="outputContent()" label="Copy CSV" />
                  <app-download-button
                    [content]="outputContent()"
                    filename="export.csv"
                    mimeType="text/csv"
                    label="Download CSV"
                  />
                </div>
              </div>

              <!-- Interactive Data Table Grid -->
              <div class="flex-1 overflow-auto max-h-[460px] relative">
                <table class="w-full border-collapse text-left text-xs">
                  <thead class="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold shadow-xs">
                    <tr>
                      <th class="px-3 py-2.5 w-12 text-center text-[10px] font-mono text-slate-400 border-b border-r border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                        #
                      </th>
                      @for (h of summary()?.headers; track h) {
                        <th class="px-3 py-2.5 font-medium whitespace-nowrap border-b border-r border-slate-200 dark:border-slate-700">
                          {{ h }}
                        </th>
                      }
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                    @for (row of tablePreviewRows(); track $index) {
                      <tr class="hover:bg-primary-50/30 dark:hover:bg-primary-950/20 transition-colors">
                        <td class="px-3 py-2 text-center font-mono text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">
                          {{ $index + 1 }}
                        </td>
                        @for (cell of row; track $index) {
                          <td class="px-3 py-2 whitespace-nowrap text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800 max-w-xs truncate" [title]="cell">
                            @if (cell === '') {
                              <span class="text-slate-300 dark:text-slate-600">-</span>
                            } @else {
                              {{ cell }}
                            }
                          </td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Table Footer Status -->
              <div class="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Displaying preview of first {{ tablePreviewRows().length }} rows.</span>
                <span class="text-emerald-600 dark:text-emerald-400">&check; Ready for Excel / Numbers / Google Sheets</span>
              </div>
            </div>
          } @else {
            <app-tool-output
              label="RFC 4180 CSV Output"
              [value]="outputContent()"
              placeholder="Generated CSV tabular data will appear here..."
              filename="export.csv"
              mimeType="text/csv"
            />
          }
        </div>
      </app-tool-page-layout>
    }
  `
})
export class JsonToCsvComponent implements OnInit {
  private readonly toolRegistry = inject(ToolRegistryService);
  private readonly recentToolsService = inject(RecentToolsService);

  public readonly tool = signal<ToolMetadata | undefined>(
    this.toolRegistry.getToolById('json-to-csv')
  );

  protected readonly inputContent = signal<string>('');
  protected readonly outputContent = signal<string>('');
  protected readonly nestedStrategy = signal<NestedHandlingStrategy>('flatten');
  protected readonly arrayStrategy = signal<ArrayHandlingStrategy>('unwind');
  protected readonly repeatParentValues = signal<boolean>(false);
  protected readonly delimiter = signal<',' | ';' | '\t' | '|'>(',');
  protected readonly includeHeader = signal<boolean>(true);
  protected readonly excelBom = signal<boolean>(true);
  protected readonly selectedArrayPath = signal<string>('');
  protected readonly availablePaths = signal<ArrayPathOption[]>([]);
  protected readonly activeView = signal<'table' | 'raw'>('table');

  protected readonly errorMessage = signal<string | null>(null);
  protected readonly summary = signal<{
    rows: number;
    columns: number;
    headers: string[];
    unwrappedKey?: string;
  } | null>(null);

  protected readonly tablePreviewRows = signal<string[][]>([]);

  // Professional Presets
  public readonly presetMultiArray = `{
  "id": 1001,
  "name": "Ahmed Khan",
  "email": "ahmed@example.com",
  "role": "admin",
  "company": "TechSolutions Pakistan",
  "active": true,
  "settings": {
    "timezone": "Asia/Karachi",
    "currency": "PKR",
    "notifications": true
  },
  "products": [
    { "id": "PRD-001", "name": "Wireless Keyboard", "price": 4500, "stock": 35 },
    { "id": "PRD-002", "name": "USB-C Hub", "price": 3200, "stock": 12 }
  ],
  "orders": [
    { "order_id": "ORD-001", "customer": "Ali Enterprises", "quantity": 2, "total": 9000, "payment_status": "paid" }
  ]
}`;

  public readonly presetVariations = `[
  {
    "sku": "TSHIRT-001",
    "product_name": "ZeroTrace Developer T-Shirt",
    "company": "TechSolutions Pakistan",
    "base_price": 2500,
    "category": "Apparel",
    "active": true,
    "settings": {
      "currency": "PKR",
      "city": "Lahore"
    },
    "variations": [
      { "size": "S", "color": "Navy Blue", "stock": 45, "price": 2500 },
      { "size": "M", "color": "Navy Blue", "stock": 120, "price": 2500 },
      { "size": "L", "color": "Navy Blue", "stock": 80, "price": 2500 },
      { "size": "XL", "color": "Charcoal Black", "stock": 35, "price": 2800 }
    ]
  },
  {
    "sku": "HOODIE-002",
    "product_name": "DevTools Binary Hoodie",
    "company": "TechSolutions Pakistan",
    "base_price": 5500,
    "category": "Apparel",
    "active": true,
    "settings": {
      "currency": "PKR",
      "city": "Karachi"
    },
    "variations": [
      { "size": "M", "color": "Heather Gray", "stock": 30, "price": 5500 },
      { "size": "L", "color": "Heather Gray", "stock": 65, "price": 5500 }
    ]
  }
]`;

  public readonly presetEmployees = `{"employees":[{"id":1001,"name":"Ahmed Khan","department":"IT","designation":"Angular Developer","salary":75000,"joining_date":"2024-09-02","city":"Lahore","status":"Active"},{"id":1002,"name":"Sara Ali","department":"HR","designation":"HR Manager","salary":85000,"joining_date":"2023-05-15","city":"Karachi","status":"Active"},{"id":1003,"name":"Usman Malik","department":"Sales","designation":"Sales Executive","salary":55000,"joining_date":"2025-01-10","city":"Islamabad","status":"Active"},{"id":1004,"name":"Fatima Noor","department":"Finance","designation":"Accountant","salary":65000,"joining_date":"2024-03-20","city":"Lahore","status":"Inactive"},{"id":1005,"name":"Bilal Ahmed","department":"IT","designation":"Backend Developer","salary":90000,"joining_date":"2022-11-01","city":"Faisalabad","status":"Active"}]}`;

  public readonly presetMultilingual = `[
  {
    "id": 1,
    "name": "احمد خان",
    "role": "Frontend Architect",
    "location": { "city": "لاہور", "country": "پاکستان" },
    "tags": ["Angular", "TypeScript", "Tailwind"],
    "rating": 4.9
  },
  {
    "id": 2,
    "name": "Sara Ali",
    "role": "Lead UI Designer",
    "location": { "city": "Karachi", "country": "Pakistan" },
    "tags": ["Figma", "Design System"],
    "rating": 4.8
  }
]`;

  public ngOnInit(): void {
    this.recentToolsService.recordUsage('json-to-csv');
  }

  public loadPreset(type: 'multi_array' | 'variations' | 'employees' | 'multilingual'): void {
    if (type === 'multi_array') {
      this.inputContent.set(this.presetMultiArray);
      this.arrayStrategy.set('unwind');
      this.repeatParentValues.set(false);
    } else if (type === 'variations') {
      this.inputContent.set(this.presetVariations);
      this.arrayStrategy.set('unwind');
    } else if (type === 'employees') {
      this.inputContent.set(this.presetEmployees);
      this.arrayStrategy.set('stringify');
    } else {
      this.inputContent.set(this.presetMultilingual);
      this.arrayStrategy.set('join');
    }
    this.selectedArrayPath.set('');
    this.errorMessage.set(null);
  }

  public onInputChanged(val: string): void {
    this.inputContent.set(val);
    this.errorMessage.set(null);
    if (!val.trim()) {
      this.outputContent.set('');
      this.summary.set(null);
      this.availablePaths.set([]);
      this.tablePreviewRows.set([]);
    }
  }

  public convert(): void {
    const raw = this.inputContent();
    if (!raw.trim()) {
      this.outputContent.set('');
      this.errorMessage.set(null);
      this.summary.set(null);
      this.availablePaths.set([]);
      this.tablePreviewRows.set([]);
      return;
    }

    const res = jsonToCsv(raw, {
      nestedStrategy: this.nestedStrategy(),
      arrayStrategy: this.arrayStrategy(),
      delimiter: this.delimiter(),
      includeHeader: this.includeHeader(),
      excelBom: this.excelBom(),
      arrayPath: this.selectedArrayPath() || undefined,
      mergeParentFields: true,
      repeatParentValues: this.repeatParentValues()
    });

    if (res.success) {
      this.outputContent.set(res.csv);
      this.errorMessage.set(null);
      this.availablePaths.set(res.availablePaths);
      this.tablePreviewRows.set(res.previewRows);

      if (!this.selectedArrayPath() && res.unwrappedKey) {
        this.selectedArrayPath.set(res.unwrappedKey);
      }

      this.summary.set({
        rows: res.rowCount,
        columns: res.columnCount,
        headers: res.headers,
        unwrappedKey: res.unwrappedKey
      });
    } else {
      this.errorMessage.set(res.error);
      this.summary.set(null);
      this.tablePreviewRows.set([]);
    }
  }
}
