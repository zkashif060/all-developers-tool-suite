import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolRegistryService } from '../../core/services/tool-registry.service';
import { RecentToolsService } from '../../core/services/recent-tools.service';
import { ToolMetadata } from '../../core/models/tool.model';
import { ToolPageLayoutComponent } from '../../shared/components/tool-page-layout/tool-page-layout.component';
import { ToolInputComponent } from '../../shared/components/tool-input/tool-input.component';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { CopyButtonComponent } from '../../shared/components/copy-button/copy-button.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import {
  RegexMatchItem,
  testRegex
} from './regex-tester.engine';

@Component({
  selector: 'app-regex-tester',
  standalone: true,
  imports: [
    FormsModule,
    ToolPageLayoutComponent,
    ToolInputComponent,
    AppIconComponent,
    CopyButtonComponent,
    ErrorMessageComponent
  ],
  template: `
    @if (tool(); as t) {
      <app-tool-page-layout [tool]="t">
        <!-- Regex Input & Flags Configuration Toolbar -->
        <div class="flex flex-col gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <!-- Top Row: Pattern Input & Delimiters -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div class="flex-1 relative flex items-center">
              <span class="absolute left-3.5 text-base font-mono font-bold text-slate-400 select-none">/</span>
              <input
                type="text"
                [ngModel]="pattern()"
                (ngModelChange)="pattern.set($event)"
                aria-label="Regular expression pattern"
                placeholder="regular expression pattern..."
                class="w-full pl-8 pr-16 py-2.5 font-mono text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span class="absolute right-3.5 text-xs font-mono font-bold text-primary-500 select-none">
                /{{ activeFlagsString() }}
              </span>
            </div>

            <!-- Pattern Presets Dropdown & Action Button -->
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Presets:</span>
              <select
                aria-label="Regular expression presets"
                (change)="applyPreset($any($event.target).value)"
                class="px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-primary-500"
              >
                <option value="email">Email Address</option>
                <option value="url">URL Extractor</option>
                <option value="date">ISO Date (YYYY-MM-DD)</option>
                <option value="ipv4">IPv4 Address</option>
                <option value="emoji">Unicode Emojis</option>
              </select>

              <button
                type="button"
                (click)="evaluateRegex()"
                class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 whitespace-nowrap"
              >
                <app-icon name="search" [size]="14" />
                <span>Test Regex</span>
              </button>
            </div>
          </div>

          <!-- Bottom Row: Flags & Performance Status -->
          <div class="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div class="flex flex-wrap items-center gap-3 select-none">
              <label class="flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  [ngModel]="flagG()"
                  (ngModelChange)="flagG.set($event)"
                  class="rounded text-primary-500 focus:ring-primary-500"
                />
                <span class="font-mono font-bold text-primary-500">g</span>
                <span>(global)</span>
              </label>

              <label class="flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  [ngModel]="flagI()"
                  (ngModelChange)="flagI.set($event)"
                  class="rounded text-primary-500 focus:ring-primary-500"
                />
                <span class="font-mono font-bold text-primary-500">i</span>
                <span>(ignoreCase)</span>
              </label>

              <label class="flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  [ngModel]="flagM()"
                  (ngModelChange)="flagM.set($event)"
                  class="rounded text-primary-500 focus:ring-primary-500"
                />
                <span class="font-mono font-bold text-primary-500">m</span>
                <span>(multiline)</span>
              </label>

              <label class="flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  [ngModel]="flagS()"
                  (ngModelChange)="flagS.set($event)"
                  class="rounded text-primary-500 focus:ring-primary-500"
                />
                <span class="font-mono font-bold text-primary-500">s</span>
                <span>(dotAll)</span>
              </label>

              <label class="flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  [ngModel]="flagU()"
                  (ngModelChange)="flagU.set($event)"
                  class="rounded text-primary-500 focus:ring-primary-500"
                />
                <span class="font-mono font-bold text-primary-500">u</span>
                <span>(unicode)</span>
              </label>
            </div>

            <div class="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <app-icon name="shield" [size]="13" className="text-emerald-500" />
              <span>Protected against zero-length loops & limit capped</span>
            </div>
          </div>
        </div>

        @if (errorMessage()) {
          <app-error-message
            title="Regular Expression Syntax Error"
            [message]="errorMessage()!"
            [dismissible]="true"
            (dismissed)="errorMessage.set(null)"
          />
        }

        <!-- Metrics Summary Bar -->
        <div class="flex items-center justify-between px-4 py-2.5 rounded-lg bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400">
          <div class="flex items-center gap-2">
            <span>Matches Found: <strong class="text-primary-600 dark:text-primary-400 text-sm">{{ matchCount() }}</strong></span>
            @if (hasTruncated()) {
              <span class="text-amber-500 font-semibold">(Capped at 2000 matches)</span>
            }
          </div>
          <span>Execution: <strong>{{ executionTime() }} ms</strong></span>
        </div>

        <!-- Dual Pane Workspace -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
          <!-- Input Side: Test String -->
          <app-tool-input
            label="Test String"
            [value]="testString()"
            (valueChange)="onTestStringChanged($event)"
            [sampleData]="sampleTestString"
            placeholder="Type or paste sample text to test your regular expression against..."
          />

          <!-- Output Side: Matches & Capture Groups Inspector -->
          <div class="flex flex-col h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
              <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Matches & Capture Groups
              </span>
              <span class="text-xs font-mono text-slate-500">
                {{ matches().length }} item{{ matches().length === 1 ? '' : 's' }}
              </span>
            </div>

            <!-- Scrollable Match Cards List -->
            <div class="p-4 flex-1 overflow-y-auto space-y-3 max-h-[460px]">
              @if (matches().length > 0) {
                @for (m of matches(); track $index) {
                  <div class="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs space-y-2">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-900/40">
                          #{{ $index + 1 }}
                        </span>
                        <span class="text-slate-400 font-mono text-[11px]">
                          Index [{{ m.index }} &ndash; {{ m.endIndex }}]
                        </span>
                      </div>
                      <app-copy-button [text]="m.match" label="Copy Match" />
                    </div>

                    <!-- Match Text Block -->
                    <div class="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 font-mono text-slate-900 dark:text-slate-100 break-all select-all">
                      {{ m.match }}
                    </div>

                    <!-- Capture Groups if present -->
                    @if (m.groups.length > 0) {
                      <div class="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                        <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Capture Groups:
                        </span>
                        @for (g of m.groups; track g.index) {
                          <div class="flex items-baseline gap-2 font-mono text-[11px] pl-1">
                            <span class="text-primary-500 font-semibold">{{ g.name ? g.name : '$' + g.index }}:</span>
                            <span class="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                              {{ g.value }}
                            </span>
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              } @else {
                <div class="h-full flex flex-col items-center justify-center text-slate-400 py-16 text-center text-xs">
                  <app-icon name="search" [size]="28" className="mb-2 opacity-40 text-slate-400" />
                  <p class="font-medium text-slate-600 dark:text-slate-400">No matches found</p>
                  <p class="text-[11px] text-slate-400 mt-1">Adjust your pattern, flags, or test string.</p>
                </div>
              }
            </div>
          </div>
        </div>
      </app-tool-page-layout>
    }
  `
})
export class RegexTesterComponent implements OnInit {
  private readonly toolRegistry = inject(ToolRegistryService);
  private readonly recentToolsService = inject(RecentToolsService);

  public readonly tool = signal<ToolMetadata | undefined>(
    this.toolRegistry.getToolById('regex-tester')
  );

  protected readonly pattern = signal<string>('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
  protected readonly flagG = signal<boolean>(true);
  protected readonly flagI = signal<boolean>(true);
  protected readonly flagM = signal<boolean>(false);
  protected readonly flagS = signal<boolean>(false);
  protected readonly flagU = signal<boolean>(false);

  protected readonly testString = signal<string>(
    'Welcome! Contact our engineering team at dev@devtools.hub or support@example.org for technical inquiries. For billing, reach out to invoices@company.co.uk.'
  );

  protected readonly sampleTestString =
    'Welcome! Contact our engineering team at dev@devtools.hub or support@example.org for technical inquiries. For billing, reach out to invoices@company.co.uk.';

  protected readonly matches = signal<RegexMatchItem[]>([]);
  protected readonly matchCount = signal<number>(0);
  protected readonly executionTime = signal<number>(0);
  protected readonly hasTruncated = signal<boolean>(false);
  protected readonly errorMessage = signal<string | null>(null);

  public ngOnInit(): void {
    this.recentToolsService.recordUsage('regex-tester');
  }

  public activeFlagsString(): string {
    let f = '';
    if (this.flagG()) f += 'g';
    if (this.flagI()) f += 'i';
    if (this.flagM()) f += 'm';
    if (this.flagS()) f += 's';
    if (this.flagU()) f += 'u';
    return f;
  }

  public onTestStringChanged(val: string): void {
    this.testString.set(val);
    this.errorMessage.set(null);
  }

  public applyPreset(presetKey: string): void {
    if (presetKey === 'email') {
      this.pattern.set('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
      this.testString.set('Team: dev@devtools-hub.com, admin@enterprise.org, hr@startup.io');
    } else if (presetKey === 'url') {
      this.pattern.set('https?:\\/\\/[^\\s/$.?#].[^\\s]*');
      this.testString.set('Visit https://devtools-hub.dev or check our docs at https://github.com/angular/angular');
    } else if (presetKey === 'date') {
      this.pattern.set('\\b\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])\\b');
      this.testString.set('Release dates: 2024-03-15 (v1.0), 2024-09-01 (v2.0), and 2025-01-10 (v3.0).');
    } else if (presetKey === 'ipv4') {
      this.pattern.set('\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b');
      this.testString.set('DNS servers configured at 1.1.1.1, 8.8.8.8, and gateway 192.168.1.1');
    } else if (presetKey === 'emoji') {
      this.pattern.set('\\p{Emoji}');
      this.flagU.set(true);
      this.testString.set('DevTools Hub is fast 🚀, reliable ✨, and modern 💻 🇵🇰!');
    }
    this.errorMessage.set(null);
  }

  public evaluateRegex(): void {
    const pat = this.pattern();
    const str = this.testString();

    const res = testRegex(pat, str, {
      g: this.flagG(),
      i: this.flagI(),
      m: this.flagM(),
      s: this.flagS(),
      u: this.flagU()
    });

    if (res.success) {
      this.matches.set(res.matches);
      this.matchCount.set(res.matchCount);
      this.executionTime.set(res.executionTimeMs);
      this.hasTruncated.set(res.hasTruncatedMatches);
      this.errorMessage.set(null);
    } else {
      this.errorMessage.set(res.error);
      this.matches.set([]);
      this.matchCount.set(0);
      this.executionTime.set(0);
      this.hasTruncated.set(false);
    }
  }
}
