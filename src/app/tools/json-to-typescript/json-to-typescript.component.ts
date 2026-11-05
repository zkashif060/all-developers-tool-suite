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
  convertJsonToTypeScript,
  TsDeclarationType,
  JSON_TS_SAMPLES
} from './json-to-typescript.engine';

@Component({
  selector: 'app-json-to-typescript',
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
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Sample Payloads:</span>
              <button
                type="button"
                (click)="loadSample('userProfile')"
                class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                User Profile & Geo
              </button>
              <button
                type="button"
                (click)="loadSample('ecommerceOrder')"
                class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                E-Commerce Order
              </button>
            </div>

            <button
              type="button"
              (click)="clearAll()"
              class="px-2.5 py-1 text-xs font-medium rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Clear
            </button>
          </div>

          <!-- Generation Configuration Bar -->
          <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-wrap items-center gap-6 text-xs">
            <!-- Root Type Name -->
            <div class="flex items-center gap-2">
              <span class="font-semibold text-slate-600 dark:text-slate-400">Root Type:</span>
              <input
                type="text"
                [(ngModel)]="rootName"
                placeholder="RootObject"
                class="w-36 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <!-- Interface vs Type -->
            <div class="flex items-center gap-2">
              <span class="font-semibold text-slate-600 dark:text-slate-400">Declaration:</span>
              <select
                [(ngModel)]="declarationType"
                class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-primary/20"
              >
                <option value="interface">interface</option>
                <option value="type">type alias</option>
              </select>
            </div>

            <!-- Toggles -->
            <div class="flex flex-wrap items-center gap-4">
              <label class="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" [(ngModel)]="exportTypes" class="rounded border-slate-300 text-primary focus:ring-primary" />
                <span>Export Types</span>
              </label>

              <label class="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" [(ngModel)]="readonlyFields" class="rounded border-slate-300 text-primary focus:ring-primary" />
                <span>Readonly Fields</span>
              </label>

              <label class="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" [(ngModel)]="optionalNulls" class="rounded border-slate-300 text-primary focus:ring-primary" />
                <span>Optional Nulls (?)</span>
              </label>

              <label class="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" [(ngModel)]="addComments" class="rounded border-slate-300 text-primary focus:ring-primary" />
                <span>JSDoc Examples</span>
              </label>
            </div>

            <!-- Metrics -->
            @if (result(); as res) {
              <div class="ml-auto flex items-center gap-4 text-slate-500 dark:text-slate-400">
                <span>Types: <strong class="font-mono text-slate-700 dark:text-slate-300">{{ res.typeCount }}</strong></span>
                <span>Properties: <strong class="font-mono text-slate-700 dark:text-slate-300">{{ res.propertyCount }}</strong></span>
              </div>
            }
          </div>

          <!-- Dual Monospace Panes -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Left Pane: Raw JSON -->
            <div class="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <div class="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span class="flex items-center gap-2">
                  <app-icon name="code" [size]="14" />
                  RAW JSON PAYLOAD INPUT
                </span>
                <span class="text-slate-400 font-mono text-[11px]">{{ inputJson().length }} chars</span>
              </div>
              <textarea
                [(ngModel)]="inputJson"
                rows="20"
                placeholder="Paste API response or JSON object here..."
                class="w-full p-4 font-mono text-xs leading-relaxed bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none resize-y"
              ></textarea>
            </div>

            <!-- Right Pane: TypeScript Definitions Output -->
            <div class="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <div class="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span class="flex items-center gap-2">
                  <app-icon name="file-code" [size]="14" class="text-primary" />
                  TYPESCRIPT INTERFACES OUTPUT
                </span>
                <div class="flex items-center gap-2">
                  @if (outputTs()) {
                    <app-copy-button [text]="outputTs()" label="Copy Types" />
                    <app-download-button [content]="outputTs()" filename="types.d.ts" label="Download .d.ts" />
                  }
                </div>
              </div>
              <div class="relative flex-1 bg-slate-50/40 dark:bg-slate-950/40">
                @if (result().error; as err) {
                  <div class="p-4 m-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-mono">
                    <strong>Error parsing JSON:</strong> {{ err }}
                  </div>
                }
                <textarea
                  [value]="outputTs()"
                  readonly
                  rows="20"
                  placeholder="TypeScript interface declarations will generate here in real-time..."
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
export class JsonToTypescriptComponent implements OnInit {
  private readonly toolRegistry = inject(ToolRegistryService);
  private readonly recentToolsService = inject(RecentToolsService);

  public readonly tool = signal<ToolMetadata | undefined>(
    this.toolRegistry.getToolById('json-to-typescript')
  );

  public readonly inputJson = signal<string>(JSON_TS_SAMPLES['userProfile'].json);
  public readonly rootName = signal<string>('UserProfileResponse');
  public readonly declarationType = signal<TsDeclarationType>('interface');
  public readonly exportTypes = signal<boolean>(true);
  public readonly readonlyFields = signal<boolean>(false);
  public readonly optionalNulls = signal<boolean>(true);
  public readonly addComments = signal<boolean>(false);

  public readonly result = computed(() => {
    return convertJsonToTypeScript(this.inputJson(), {
      rootName: this.rootName(),
      declarationType: this.declarationType(),
      exportTypes: this.exportTypes(),
      readonlyFields: this.readonlyFields(),
      optionalNulls: this.optionalNulls(),
      addComments: this.addComments()
    });
  });

  public readonly outputTs = computed(() => this.result().code);

  public ngOnInit(): void {
    this.recentToolsService.recordUsage('json-to-typescript');
  }

  public loadSample(key: string): void {
    const sample = JSON_TS_SAMPLES[key];
    if (sample) {
      this.inputJson.set(sample.json);
      if (key === 'userProfile') this.rootName.set('UserProfileResponse');
      if (key === 'ecommerceOrder') this.rootName.set('OrderResponse');
    }
  }

  public clearAll(): void {
    this.inputJson.set('');
  }
}
