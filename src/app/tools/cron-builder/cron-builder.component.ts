import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolRegistryService } from '../../core/services/tool-registry.service';
import { RecentToolsService } from '../../core/services/recent-tools.service';
import { ToolMetadata } from '../../core/models/tool.model';
import { ToolPageLayoutComponent } from '../../shared/components/tool-page-layout/tool-page-layout.component';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { CopyButtonComponent } from '../../shared/components/copy-button/copy-button.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import {
  explainCron,
  validateCronExpression
} from './cron-builder.engine';

@Component({
  selector: 'app-cron-builder',
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
        <!-- Cron Display Hero Banner -->
        <div class="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Standard 5-Field Cron Expression:
              </span>
              <div class="mt-1 font-mono text-3xl sm:text-4xl font-extrabold tracking-wider text-primary-500 select-all">
                {{ cronExpression() }}
              </div>
            </div>
            <div class="flex items-center gap-2">
              <app-copy-button [text]="cronExpression()" label="Copy Expression" />
            </div>
          </div>

          <!-- Plain English Explanation -->
          <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex items-start gap-2.5">
            <app-icon name="info" [size]="16" className="text-primary-500 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Human Schedule:</strong> {{ humanSchedule() }}
            </div>
          </div>
        </div>

        @if (errorMessage()) {
          <app-error-message
            title="Cron Syntax Error"
            [message]="errorMessage()!"
            [dismissible]="true"
            (dismissed)="errorMessage.set(null)"
          />
        }

        <!-- Direct Expression Paste & Quick Parser -->
        <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-end gap-3">
          <div class="flex-1 space-y-1">
            <label for="direct-cron" class="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Paste or Edit Cron Expression Directly:
            </label>
            <input
              id="direct-cron"
              type="text"
              [ngModel]="cronExpression()"
              (ngModelChange)="cronExpression.set($event)"
              placeholder="e.g. */15 9-17 * * 1-5"
              class="w-full px-3.5 py-2 font-mono text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="parseDirectExpression()"
              class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 whitespace-nowrap"
            >
              <app-icon name="clock" [size]="14" />
              <span>Parse Expression</span>
            </button>
            <button
              type="button"
              (click)="resetToDefault()"
              class="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        <!-- 5-Field Visual Interactive Builder -->
        <div class="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              5-Field Interactive Builder
            </h3>
            <span class="text-xs text-slate-400">Configure fields then click build</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <!-- Minute -->
            <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shadow-xs space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-700 dark:text-slate-300">Minute</span>
                <span class="font-mono text-[11px] text-slate-400">0 - 59</span>
              </div>
              <input
                type="text"
                aria-label="Minute field (0-59)"
                [ngModel]="fieldMinute()"
                (ngModelChange)="fieldMinute.set($event)"
                class="w-full text-center px-2 py-1.5 font-mono text-base font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div class="text-[10px] text-slate-500 text-center leading-tight">
                Wildcard: <code>*</code>, Step: <code>*/15</code>
              </div>
            </div>

            <!-- Hour -->
            <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shadow-xs space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-700 dark:text-slate-300">Hour</span>
                <span class="font-mono text-[11px] text-slate-400">0 - 23</span>
              </div>
              <input
                type="text"
                aria-label="Hour field (0-23)"
                [ngModel]="fieldHour()"
                (ngModelChange)="fieldHour.set($event)"
                class="w-full text-center px-2 py-1.5 font-mono text-base font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div class="text-[10px] text-slate-500 text-center leading-tight">
                Midnight: <code>0</code>, Noon: <code>12</code>
              </div>
            </div>

            <!-- Day of Month -->
            <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shadow-xs space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-700 dark:text-slate-300">Day of Month</span>
                <span class="font-mono text-[11px] text-slate-400">1 - 31</span>
              </div>
              <input
                type="text"
                aria-label="Day of month field (1-31)"
                [ngModel]="fieldDom()"
                (ngModelChange)="fieldDom.set($event)"
                class="w-full text-center px-2 py-1.5 font-mono text-base font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div class="text-[10px] text-slate-500 text-center leading-tight">
                Every day: <code>*</code>, 1st: <code>1</code>
              </div>
            </div>

            <!-- Month -->
            <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shadow-xs space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-700 dark:text-slate-300">Month</span>
                <span class="font-mono text-[11px] text-slate-400">1 - 12</span>
              </div>
              <input
                type="text"
                aria-label="Month field (1-12 or JAN-DEC)"
                [ngModel]="fieldMonth()"
                (ngModelChange)="fieldMonth.set($event)"
                class="w-full text-center px-2 py-1.5 font-mono text-base font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div class="text-[10px] text-slate-500 text-center leading-tight">
                Quarterly: <code>*/3</code>, Range: <code>1-6</code>
              </div>
            </div>

            <!-- Day of Week -->
            <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shadow-xs space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-700 dark:text-slate-300">Day of Week</span>
                <span class="font-mono text-[11px] text-slate-400">0 - 6 (Sun-Sat)</span>
              </div>
              <input
                type="text"
                aria-label="Day of week field (0-6 Sun-Sat)"
                [ngModel]="fieldDow()"
                (ngModelChange)="fieldDow.set($event)"
                class="w-full text-center px-2 py-1.5 font-mono text-base font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div class="text-[10px] text-slate-500 text-center leading-tight">
                Weekdays: <code>1-5</code>, Weekend: <code>0,6</code>
              </div>
            </div>
          </div>

          <!-- Build Button -->
          <button
            type="button"
            (click)="assembleFromFields()"
            class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <app-icon name="sparkles" [size]="14" />
            <span>Build Expression from Fields</span>
          </button>
        </div>

        <!-- Schedule Presets Grid -->
        <div class="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Standard Schedule Presets
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            @for (preset of presets; track preset.expr) {
              <button
                type="button"
                (click)="applyPreset(preset.expr)"
                class="flex items-center justify-between p-2.5 rounded-lg text-left border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/50 dark:hover:bg-primary-950/30 transition-all group"
              >
                <div>
                  <div class="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                    {{ preset.name }}
                  </div>
                  <div class="text-[11px] text-slate-500 dark:text-slate-400">
                    {{ preset.desc }}
                  </div>
                </div>
                <code class="font-mono text-xs font-bold text-primary-500 ml-2 flex-shrink-0">
                  {{ preset.expr }}
                </code>
              </button>
            }
          </div>
        </div>
      </app-tool-page-layout>
    }
  `
})
export class CronBuilderComponent implements OnInit {
  private readonly toolRegistry = inject(ToolRegistryService);
  private readonly recentToolsService = inject(RecentToolsService);

  public readonly tool = signal<ToolMetadata | undefined>(
    this.toolRegistry.getToolById('cron-builder')
  );

  protected readonly cronExpression = signal<string>('0 0 * * *');
  protected readonly humanSchedule = signal<string>('Every day at midnight (00:00)');
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly fieldMinute = signal<string>('0');
  protected readonly fieldHour = signal<string>('0');
  protected readonly fieldDom = signal<string>('*');
  protected readonly fieldMonth = signal<string>('*');
  protected readonly fieldDow = signal<string>('*');

  protected readonly presets = [
    { name: 'Every Minute', expr: '* * * * *', desc: 'Triggers on every single minute' },
    { name: 'Every 5 Minutes', expr: '*/5 * * * *', desc: 'Triggers every 5 minutes' },
    { name: 'Every 15 Minutes', expr: '*/15 * * * *', desc: 'Triggers every 15 minutes' },
    { name: 'Every 30 Minutes', expr: '*/30 * * * *', desc: 'Triggers on minute 0 and 30' },
    { name: 'Every Hour', expr: '0 * * * *', desc: 'Triggers at the start of every hour' },
    { name: 'Daily at Midnight', expr: '0 0 * * *', desc: 'Triggers at 00:00 every day' },
    { name: 'Daily at Noon', expr: '0 12 * * *', desc: 'Triggers at 12:00 every day' },
    { name: 'Every Monday', expr: '0 0 * * 1', desc: 'Triggers at 00:00 every Monday' },
    { name: 'First Day of Month', expr: '0 0 1 * *', desc: 'Triggers at 00:00 on the 1st day' },
    { name: 'Weekdays at 9 AM', expr: '0 9 * * 1-5', desc: 'Triggers Monday through Friday at 09:00' },
  ];

  public ngOnInit(): void {
    this.recentToolsService.recordUsage('cron-builder');
  }

  public resetToDefault(): void {
    this.applyPreset('0 0 * * *');
  }

  public applyPreset(expr: string): void {
    this.cronExpression.set(expr);
    this.parseDirectExpression();
  }

  public parseDirectExpression(): void {
    const val = this.cronExpression().trim();
    if (!val) {
      this.errorMessage.set('Cron expression is empty. Please enter a valid 5-field cron string.');
      this.humanSchedule.set('Invalid expression');
      return;
    }
    const res = validateCronExpression(val);
    if (res.valid) {
      this.errorMessage.set(null);
      this.humanSchedule.set(res.humanExplanation);
      const [m, h, dom, mon, dow] = res.fields;
      this.fieldMinute.set(m);
      this.fieldHour.set(h);
      this.fieldDom.set(dom);
      this.fieldMonth.set(mon);
      this.fieldDow.set(dow);
    } else {
      this.errorMessage.set(res.error);
      this.humanSchedule.set('Invalid expression');
    }
  }

  public assembleFromFields(): void {
    const expr = `${this.fieldMinute().trim()} ${this.fieldHour().trim()} ${this.fieldDom().trim()} ${this.fieldMonth().trim()} ${this.fieldDow().trim()}`;
    this.cronExpression.set(expr);
    const res = validateCronExpression(expr);
    if (res.valid) {
      this.errorMessage.set(null);
      this.humanSchedule.set(res.humanExplanation);
    } else {
      this.errorMessage.set(res.error);
      this.humanSchedule.set('Invalid expression');
    }
  }
}
