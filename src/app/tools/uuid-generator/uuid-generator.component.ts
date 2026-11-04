import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolRegistryService } from '../../core/services/tool-registry.service';
import { RecentToolsService } from '../../core/services/recent-tools.service';
import { ToolMetadata } from '../../core/models/tool.model';
import { ToolPageLayoutComponent } from '../../shared/components/tool-page-layout/tool-page-layout.component';
import { ToolOutputComponent } from '../../shared/components/tool-output/tool-output.component';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { CopyButtonComponent } from '../../shared/components/copy-button/copy-button.component';
import { DownloadButtonComponent } from '../../shared/components/download-button/download-button.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { generateUuids } from './uuid-generator.engine';

@Component({
  selector: 'app-uuid-generator',
  standalone: true,
  imports: [
    FormsModule,
    ToolPageLayoutComponent,
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
          <!-- Top Row: Configuration Options -->
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <!-- Quantity Selector -->
              <div class="flex items-center gap-2">
                <label for="uuid-qty" class="text-slate-600 dark:text-slate-400">Quantity:</label>
                <select
                  id="uuid-qty"
                  [ngModel]="count()"
                  (ngModelChange)="count.set(+$event)"
                  class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-primary-500"
                >
                  <option [value]="1">1 UUID</option>
                  <option [value]="5">5 UUIDs</option>
                  <option [value]="10">10 UUIDs</option>
                  <option [value]="25">25 UUIDs</option>
                  <option [value]="50">50 UUIDs</option>
                  <option [value]="100">100 UUIDs</option>
                </select>
              </div>

              <!-- Format Checkboxes -->
              <label class="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  [ngModel]="uppercase()"
                  (ngModelChange)="uppercase.set($event)"
                  class="rounded text-primary-500 focus:ring-primary-500"
                />
                <span>Uppercase</span>
              </label>

              <label class="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  [ngModel]="hyphens()"
                  (ngModelChange)="hyphens.set($event)"
                  class="rounded text-primary-500 focus:ring-primary-500"
                />
                <span>Hyphens</span>
              </label>

              <label class="flex items-center gap-1.5 cursor-pointer select-none" title="Windows Registry GUID Format: {xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}">
                <input
                  type="checkbox"
                  [ngModel]="braces()"
                  (ngModelChange)="braces.set($event)"
                  class="rounded text-primary-500 focus:ring-primary-500"
                />
                <span>Braces &#123;...&#125;</span>
              </label>

              <label class="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  [ngModel]="quotes()"
                  (ngModelChange)="quotes.set($event)"
                  class="rounded text-primary-500 focus:ring-primary-500"
                />
                <span>Quotes &quot;...&quot;</span>
              </label>
            </div>

            <!-- Generate Action -->
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="clear()"
                [disabled]="uuids().length === 0"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <app-icon name="trash" [size]="13" />
                <span>Clear</span>
              </button>

              <button
                type="button"
                (click)="generate()"
                class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <app-icon name="sparkles" [size]="14" />
                <span>Regenerate UUIDs</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Security Callout -->
        <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <app-icon name="shield" [size]="16" className="text-emerald-500 flex-shrink-0" />
            <span><strong>Cryptographically Secure:</strong> Generated strictly with the Web Crypto API CSPRNG (RFC 4122 v4). Insecure randomness (<code>Math.random</code>) is strictly disallowed.</span>
          </div>
          <span class="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">&check; Zero collisions</span>
        </div>

        @if (errorMessage()) {
          <app-error-message
            title="UUID Generation Error"
            [message]="errorMessage()"
            [dismissible]="true"
            (dismissed)="errorMessage.set(null)"
          />
        }

        <!-- Output Display & Mode Switcher -->
        @if (uuids().length > 0) {
          <div class="flex flex-col gap-4">
            <!-- View Selector & Bulk Copy/Download Toolbar -->
            <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <div class="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-mono">
                <span>Generated: <strong class="text-slate-900 dark:text-slate-200">{{ uuids().length }}</strong> UUIDs</span>
              </div>

              <!-- View Switcher Tabs -->
              <div class="flex items-center gap-2">
                <div class="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800 text-xs">
                  <button
                    type="button"
                    (click)="activeView.set('list')"
                    class="px-3 py-1 font-medium rounded-md transition-all flex items-center gap-1.5"
                    [class]="activeView() === 'list' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'"
                  >
                    <app-icon name="list" [size]="13" />
                    <span>Interactive List</span>
                  </button>
                  <button
                    type="button"
                    (click)="activeView.set('raw')"
                    class="px-3 py-1 font-medium rounded-md transition-all flex items-center gap-1.5"
                    [class]="activeView() === 'raw' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'"
                  >
                    <app-icon name="file-text" [size]="13" />
                    <span>Plain Text</span>
                  </button>
                </div>

                <app-copy-button [text]="outputContent()" label="Copy All" />
                <app-download-button
                  [content]="outputContent()"
                  filename="uuids.txt"
                  mimeType="text/plain"
                  label="Download .txt"
                />
              </div>
            </div>

            <!-- Interactive List View -->
            @if (activeView() === 'list') {
              <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-auto">
                @for (u of uuids(); track $index) {
                  <div class="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div class="flex items-center gap-3 font-mono text-xs text-slate-800 dark:text-slate-200">
                      <span class="text-[11px] text-slate-400 w-7 text-right select-none">#{{ $index + 1 }}</span>
                      <span class="font-medium select-all">{{ u }}</span>
                    </div>
                    <app-copy-button [text]="u" label="Copy" />
                  </div>
                }
              </div>
            } @else {
              <!-- Raw Text View -->
              <app-tool-output
                label="Generated UUIDs Output"
                [value]="outputContent()"
                filename="uuids.txt"
                mimeType="text/plain"
              />
            }
          </div>
        }
      </app-tool-page-layout>
    }
  `
})
export class UuidGeneratorComponent implements OnInit {
  private readonly toolRegistry = inject(ToolRegistryService);
  private readonly recentToolsService = inject(RecentToolsService);

  public readonly tool = signal<ToolMetadata | undefined>(
    this.toolRegistry.getToolById('uuid-generator')
  );

  protected readonly count = signal<number>(5);
  protected readonly uppercase = signal<boolean>(false);
  protected readonly hyphens = signal<boolean>(true);
  protected readonly braces = signal<boolean>(false);
  protected readonly quotes = signal<boolean>(false);

  protected readonly activeView = signal<'list' | 'raw'>('list');
  protected readonly uuids = signal<string[]>([]);
  protected readonly outputContent = signal<string>('');
  protected readonly errorMessage = signal<string | null>(null);

  public ngOnInit(): void {
    this.recentToolsService.recordUsage('uuid-generator');
  }

  public clear(): void {
    this.uuids.set([]);
    this.outputContent.set('');
    this.errorMessage.set(null);
  }

  public generate(): void {
    const res = generateUuids({
      count: this.count(),
      uppercase: this.uppercase(),
      hyphens: this.hyphens(),
      braces: this.braces(),
      quotes: this.quotes()
    });

    if (res.success) {
      this.uuids.set(res.uuids);
      this.outputContent.set(res.output);
      this.errorMessage.set(null);
    } else {
      this.errorMessage.set(res.error);
      this.uuids.set([]);
      this.outputContent.set('');
    }
  }
}
