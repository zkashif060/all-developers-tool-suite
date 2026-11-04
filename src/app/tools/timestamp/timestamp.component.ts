import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolRegistryService } from '../../core/services/tool-registry.service';
import { RecentToolsService } from '../../core/services/recent-tools.service';
import { ToolMetadata } from '../../core/models/tool.model';
import { ToolPageLayoutComponent } from '../../shared/components/tool-page-layout/tool-page-layout.component';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { CopyButtonComponent } from '../../shared/components/copy-button/copy-button.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import {
  DateToTimestampResult,
  TimestampToDateResult,
  TimestampUnit,
  dateToTimestamp,
  timestampToDate
} from './timestamp.engine';

@Component({
  selector: 'app-timestamp',
  standalone: true,
  imports: [
    FormsModule,
    ToolPageLayoutComponent,
    AppIconComponent,
    CopyButtonComponent,
    ErrorMessageComponent
  ],
  template: `
    @if (tool(); as t) {
      <app-tool-page-layout [tool]="t">
        <!-- Live Current Epoch Hero Banner -->
        <div class="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl border border-primary-200/80 dark:border-primary-900/60 bg-gradient-to-r from-primary-50/60 to-white dark:from-primary-950/30 dark:to-slate-900 shadow-xs">
          <div class="flex items-center gap-3">
            <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Live Unix Epoch Time</span>
              <div class="flex items-baseline gap-2 mt-0.5">
                <span class="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  {{ currentSeconds() }}
                </span>
                <span class="text-xs font-mono text-slate-500 dark:text-slate-400">s</span>
                <span class="text-xs font-mono text-slate-400">/</span>
                <span class="text-sm font-mono text-slate-600 dark:text-slate-400">
                  {{ currentMs() }}
                </span>
                <span class="text-xs font-mono text-slate-500 dark:text-slate-400">ms</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <app-copy-button [text]="'' + currentSeconds()" label="Copy Seconds" />
            <app-copy-button [text]="'' + currentMs()" label="Copy Milliseconds" />
            <button
              type="button"
              (click)="useCurrentTime()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors shadow-xs"
            >
              <app-icon name="arrow-down" [size]="14" />
              <span>Use in Converter</span>
            </button>
          </div>
        </div>

        <!-- Explanatory Note -->
        <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
          <app-icon name="info" [size]="16" className="text-primary-500 mt-0.5 flex-shrink-0" />
          <div class="leading-relaxed">
            Unix timestamp is the number of seconds (or milliseconds) that have elapsed since <strong>January 1, 1970 00:00:00 UTC</strong>. Local time values are calculated based on your browser's configured timezone (<strong>{{ browserTimezone() }}</strong>).
          </div>
        </div>

        <!-- Dual Converter Workbenches -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[460px]">
          <!-- Panel 1: Epoch to Readable Date -->
          <div class="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col gap-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <app-icon name="clock" [size]="16" className="text-primary-500" />
                <span>Unix Timestamp &rarr; Readable Date</span>
              </h3>
              <button
                type="button"
                (click)="clearTimestampInput()"
                class="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                Clear
              </button>
            </div>

            <!-- Unit Selector & Presets -->
            <div class="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-slate-600 dark:text-slate-400">Unit:</span>
                <select
                  aria-label="Timestamp unit"
                  [ngModel]="selectedUnit()"
                  (ngModelChange)="selectedUnit.set($event)"
                  class="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-primary-500"
                >
                  <option value="auto">Auto-Detect</option>
                  <option value="seconds">Seconds (10 digits)</option>
                  <option value="milliseconds">Milliseconds (13 digits)</option>
                </select>
              </div>

              <div class="flex items-center gap-1.5">
                <span class="text-slate-400 text-[11px]">Presets:</span>
                <button
                  type="button"
                  (click)="setTimestampPreset('0')"
                  class="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Epoch 0
                </button>
                <button
                  type="button"
                  (click)="setTimestampPreset('1700000000')"
                  class="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Nov 2023
                </button>
                <button
                  type="button"
                  (click)="setTimestampPreset('1893456000')"
                  class="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Year 2030
                </button>
              </div>
            </div>

            <!-- Numeric Input -->
            <div class="space-y-1.5">
              <label for="timestamp-val" class="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Timestamp Value:
              </label>
              <input
                id="timestamp-val"
                type="text"
                [ngModel]="timestampInput()"
                (ngModelChange)="onTimestampInputChanged($event)"
                placeholder="e.g. 1700000000 or 1700000000000"
                class="w-full px-3.5 py-2.5 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <!-- Action Button -->
            <button
              type="button"
              (click)="convertTimestamp()"
              class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <app-icon name="clock" [size]="14" />
              <span>Convert to Date</span>
            </button>

            @if (timestampError()) {
              <app-error-message
                title="Timestamp Parsing Error"
                [message]="timestampError()!"
                [dismissible]="true"
                (dismissed)="timestampError.set(null)"
              />
            }

            <!-- Calculated Results Breakdown -->
            @if (parsedTimestamp(); as pt) {
              <div class="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <!-- Relative Time Pill -->
                <div class="flex items-center justify-between text-xs p-2 rounded-lg bg-primary-50/50 dark:bg-primary-950/30 text-primary-800 dark:text-primary-300 border border-primary-200/50 dark:border-primary-900/30">
                  <span class="font-semibold">Relative Time:</span>
                  <span class="font-mono font-bold">{{ pt.relative }}</span>
                </div>

                <!-- UTC Date -->
                <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div class="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>UTC Time (GMT):</span>
                    <app-copy-button [text]="pt.utc" label="Copy" />
                  </div>
                  <div class="font-mono text-xs font-medium text-slate-900 dark:text-slate-100 break-all select-all">
                    {{ pt.utc }}
                  </div>
                </div>

                <!-- Local Browser Time -->
                <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div class="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Local Time ({{ pt.timezoneName }}):</span>
                    <app-copy-button [text]="pt.local" label="Copy" />
                  </div>
                  <div class="font-mono text-xs font-medium text-slate-900 dark:text-slate-100 break-all select-all">
                    {{ pt.local }}
                  </div>
                </div>

                <!-- ISO 8601 -->
                <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div class="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>ISO 8601 Format:</span>
                    <app-copy-button [text]="pt.iso" label="Copy" />
                  </div>
                  <div class="font-mono text-xs font-medium text-slate-900 dark:text-slate-100 break-all select-all">
                    {{ pt.iso }}
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Panel 2: Readable Date to Epoch -->
          <div class="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col gap-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <app-icon name="calendar" [size]="16" className="text-primary-500" />
                <span>Date & Time &rarr; Unix Timestamp</span>
              </h3>
              <button
                type="button"
                (click)="setDateToNow()"
                class="text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors"
              >
                Set to Now
              </button>
            </div>

            <!-- Date Picker -->
            <div class="space-y-1.5">
              <label for="datetime-picker" class="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Date and Time:
              </label>
              <input
                id="datetime-picker"
                type="datetime-local"
                step="1"
                [ngModel]="dateInput()"
                (ngModelChange)="onDateChanged($event)"
                class="w-full px-3.5 py-2.5 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <!-- Action Button -->
            <button
              type="button"
              (click)="convertDate()"
              class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <app-icon name="calendar" [size]="14" />
              <span>Convert to Timestamp</span>
            </button>

            @if (dateError()) {
              <app-error-message
                title="Date Format Error"
                [message]="dateError()!"
                [dismissible]="true"
                (dismissed)="dateError.set(null)"
              />
            }

            <!-- Calculated Timestamps -->
            @if (dateResult(); as dr) {
              <div class="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <!-- Epoch Seconds -->
                <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span class="text-[11px] font-semibold text-slate-500 uppercase block">Epoch Seconds</span>
                    <span class="font-mono text-base font-bold text-slate-900 dark:text-slate-100 select-all">
                      {{ dr.seconds }}
                    </span>
                  </div>
                  <app-copy-button [text]="'' + dr.seconds" label="Copy Seconds" />
                </div>

                <!-- Epoch Milliseconds -->
                <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span class="text-[11px] font-semibold text-slate-500 uppercase block">Epoch Milliseconds</span>
                    <span class="font-mono text-base font-bold text-slate-900 dark:text-slate-100 select-all">
                      {{ dr.milliseconds }}
                    </span>
                  </div>
                  <app-copy-button [text]="'' + dr.milliseconds" label="Copy MS" />
                </div>

                <!-- UTC Date -->
                <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span class="text-[11px] font-semibold text-slate-500 uppercase block">UTC Date String</span>
                    <span class="font-mono text-xs font-medium text-slate-900 dark:text-slate-100 select-all">
                      {{ dr.utc }}
                    </span>
                  </div>
                  <app-copy-button [text]="dr.utc" label="Copy" />
                </div>

                <!-- ISO 8601 -->
                <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span class="text-[11px] font-semibold text-slate-500 uppercase block">ISO-8601</span>
                    <span class="font-mono text-xs font-medium text-slate-900 dark:text-slate-100 select-all">
                      {{ dr.iso }}
                    </span>
                  </div>
                  <app-copy-button [text]="dr.iso" label="Copy" />
                </div>
              </div>
            }
          </div>
        </div>
      </app-tool-page-layout>
    }
  `
})
export class TimestampComponent implements OnInit, OnDestroy {
  private readonly toolRegistry = inject(ToolRegistryService);
  private readonly recentToolsService = inject(RecentToolsService);

  public readonly tool = signal<ToolMetadata | undefined>(
    this.toolRegistry.getToolById('timestamp')
  );

  protected readonly currentSeconds = signal<number>(Math.floor(Date.now() / 1000));
  protected readonly currentMs = signal<number>(Date.now());
  protected readonly browserTimezone = signal<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local'
  );
  private timerRef?: number;

  // Panel 1: Epoch to Date
  protected readonly timestampInput = signal<string>('1700000000');
  protected readonly selectedUnit = signal<TimestampUnit>('auto');
  protected readonly parsedTimestamp = signal<TimestampToDateResult | null>(null);
  protected readonly timestampError = signal<string | null>(null);

  // Panel 2: Date to Epoch
  protected readonly dateInput = signal<string>('');
  protected readonly dateResult = signal<DateToTimestampResult | null>(null);
  protected readonly dateError = signal<string | null>(null);

  public ngOnInit(): void {
    this.recentToolsService.recordUsage('timestamp');
    this.startTickingClock();
    this.setDateToNow();
  }

  public ngOnDestroy(): void {
    if (this.timerRef) {
      clearInterval(this.timerRef);
    }
  }

  private startTickingClock(): void {
    this.timerRef = window.setInterval(() => {
      const now = Date.now();
      this.currentMs.set(now);
      this.currentSeconds.set(Math.floor(now / 1000));
    }, 1000);
  }

  public useCurrentTime(): void {
    const s = this.currentSeconds().toString();
    this.timestampInput.set(s);
    this.timestampError.set(null);
  }

  public setTimestampPreset(val: string): void {
    this.timestampInput.set(val);
    this.timestampError.set(null);
  }

  public clearTimestampInput(): void {
    this.timestampInput.set('');
    this.parsedTimestamp.set(null);
    this.timestampError.set(null);
  }

  public onTimestampInputChanged(val: string): void {
    this.timestampInput.set(val);
    this.timestampError.set(null);
    if (!val.trim()) {
      this.parsedTimestamp.set(null);
    }
  }

  public convertTimestamp(): void {
    const raw = this.timestampInput().trim();
    if (!raw) {
      this.parsedTimestamp.set(null);
      this.timestampError.set('Timestamp input is empty. Please enter a Unix timestamp.');
      return;
    }

    const res = timestampToDate(raw, this.selectedUnit());
    if (res.success) {
      this.parsedTimestamp.set(res);
      this.timestampError.set(null);
    } else {
      this.parsedTimestamp.set(null);
      this.timestampError.set(res.error);
    }
  }

  public setDateToNow(): void {
    const now = new Date();
    // Format to yyyy-MM-ddTHH:mm:ss for datetime-local
    const pad = (n: number) => n.toString().padStart(2, '0');
    const localIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    this.dateInput.set(localIso);
    this.dateError.set(null);
  }

  public onDateChanged(val: string): void {
    this.dateInput.set(val);
    this.dateError.set(null);
    if (!val) {
      this.dateResult.set(null);
    }
  }

  public convertDate(): void {
    const val = this.dateInput();
    if (!val) {
      this.dateResult.set(null);
      this.dateError.set('Date input is empty. Please select or enter a valid date.');
      return;
    }

    const res = dateToTimestamp(val);
    if ('seconds' in res) {
      this.dateResult.set(res);
      this.dateError.set(null);
    } else {
      this.dateResult.set(null);
      this.dateError.set(res.error);
    }
  }
}
