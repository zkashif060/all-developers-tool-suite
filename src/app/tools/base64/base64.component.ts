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
import { decodeBase64, encodeBase64 } from './base64.engine';

@Component({
  selector: 'app-base64',
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
            <!-- Mode Switcher -->
            <div class="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800 text-xs">
              <button
                type="button"
                (click)="setMode('encode')"
                class="px-3.5 py-1.5 font-medium rounded-md transition-all flex items-center gap-1.5"
                [class]="mode() === 'encode' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
              >
                <app-icon name="binary" [size]="14" />
                <span>Encode to Base64</span>
              </button>
              <button
                type="button"
                (click)="setMode('decode')"
                class="px-3.5 py-1.5 font-medium rounded-md transition-all flex items-center gap-1.5"
                [class]="mode() === 'decode' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
              >
                <app-icon name="file-text" [size]="14" />
                <span>Decode Base64</span>
              </button>
            </div>

            <!-- Encoding Options -->
            @if (mode() === 'encode') {
              <div class="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 select-none">
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    [ngModel]="urlSafe()"
                    (ngModelChange)="urlSafe.set($event)"
                    class="rounded text-primary-500 focus:ring-primary-500"
                  />
                  <span>URL-Safe (- and _)</span>
                </label>

                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    [ngModel]="includePadding()"
                    (ngModelChange)="includePadding.set($event)"
                    class="rounded text-primary-500 focus:ring-primary-500"
                  />
                  <span>Include Padding (=)</span>
                </label>
              </div>
            }
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="swap()"
              [disabled]="!outputContent()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Swap input and output values"
            >
              <app-icon name="arrow-left-right" [size]="13" />
              <span>Swap</span>
            </button>

            <button
              type="button"
              (click)="process()"
              class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <app-icon [name]="mode() === 'encode' ? 'binary' : 'file-text'" [size]="14" />
              <span>{{ mode() === 'encode' ? 'Encode' : 'Decode' }}</span>
            </button>
          </div>
        </div>

        @if (errorMessage()) {
          <app-error-message
            title="Base64 Processing Error"
            [message]="errorMessage()"
            [dismissible]="true"
            (dismissed)="errorMessage.set(null)"
          />
        }

        <!-- Metrics Bar -->
        @if (metrics(); as m) {
          <div class="flex items-center justify-between px-4 py-2 rounded-lg bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400">
            <div>
              <span>Input: <strong>{{ m.inputLength }}</strong> chars ({{ m.inputBytes }} bytes)</span>
              <span class="mx-2">&rarr;</span>
              <span>Output: <strong>{{ m.outputLength }}</strong> chars ({{ m.outputBytes }} bytes)</span>
            </div>
            <span class="text-emerald-600 dark:text-emerald-400 font-semibold">&check; 100% Client-Side UTF-8</span>
          </div>
        }

        <!-- Dual Pane Workspace -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[460px]">
          <app-tool-input
            [label]="mode() === 'encode' ? 'Plain Text to Encode' : 'Base64 String to Decode'"
            [value]="inputContent()"
            (valueChange)="onInputChanged($event)"
            [sampleData]="sampleData()"
            [placeholder]="mode() === 'encode' ? 'Enter UTF-8 text, Unicode, or emojis to encode...' : 'Paste Base64 or URL-Safe Base64 string to decode...'"
          />

          <app-tool-output
            [label]="mode() === 'encode' ? 'Base64 Encoded Output' : 'Decoded UTF-8 Output'"
            [value]="outputContent()"
            [placeholder]="mode() === 'encode' ? 'Base64 string will appear here...' : 'Decoded plain text will appear here...'"
            [filename]="mode() === 'encode' ? 'encoded-base64.txt' : 'decoded-text.txt'"
          />
        </div>
      </app-tool-page-layout>
    }
  `
})
export class Base64Component implements OnInit {
  private readonly toolRegistry = inject(ToolRegistryService);
  private readonly recentToolsService = inject(RecentToolsService);

  public readonly tool = signal<ToolMetadata | undefined>(
    this.toolRegistry.getToolById('base64')
  );

  protected readonly mode = signal<'encode' | 'decode'>('encode');
  protected readonly urlSafe = signal<boolean>(false);
  protected readonly includePadding = signal<boolean>(true);

  protected readonly inputContent = signal<string>('');
  protected readonly outputContent = signal<string>('');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly metrics = signal<{
    inputLength: number;
    inputBytes: number;
    outputLength: number;
    outputBytes: number;
  } | null>(null);

  protected readonly sampleData = signal<string>('Hello ZeroTrace Tools! 🚀 Built with Angular & Tailwind.');

  public ngOnInit(): void {
    this.recentToolsService.recordUsage('base64');
  }

  public setMode(m: 'encode' | 'decode'): void {
    this.mode.set(m);
    this.errorMessage.set(null);
    if (m === 'encode') {
      this.sampleData.set('ZeroTrace Tools 🛡️\nسلام پاکستان! 🇵🇰\nUnicode & Multi-byte Base64.');
    } else {
      this.sampleData.set('RGV2VG9vbHMgSHViIPCfmoAK2LPZhNin2YUg2b7Yp9qp2LPYqtin2YYhIPCfh7Xwn4ewClVuaWNvZGUgJiBNdWx0aS1ieXRlIEJhc2U2NC4=');
    }
  }

  public onInputChanged(val: string): void {
    this.inputContent.set(val);
    this.errorMessage.set(null);
    if (!val.trim()) {
      this.outputContent.set('');
      this.metrics.set(null);
    }
  }

  public swap(): void {
    const currentOut = this.outputContent();
    if (!currentOut) return;

    this.inputContent.set(currentOut);
    this.setMode(this.mode() === 'encode' ? 'decode' : 'encode');
  }

  public process(): void {
    const raw = this.inputContent();
    if (!raw) {
      this.outputContent.set('');
      this.errorMessage.set(null);
      this.metrics.set(null);
      return;
    }

    if (this.mode() === 'encode') {
      const res = encodeBase64(raw, {
        urlSafe: this.urlSafe(),
        padding: this.includePadding()
      });

      if (res.success) {
        this.outputContent.set(res.output);
        this.errorMessage.set(null);
        this.metrics.set({
          inputLength: raw.length,
          inputBytes: res.byteCount,
          outputLength: res.charCount,
          outputBytes: new TextEncoder().encode(res.output).length
        });
      } else {
        this.errorMessage.set(res.error);
        this.outputContent.set('');
        this.metrics.set(null);
      }
    } else {
      const res = decodeBase64(raw);

      if (res.success) {
        this.outputContent.set(res.output);
        this.errorMessage.set(null);
        this.metrics.set({
          inputLength: raw.length,
          inputBytes: new TextEncoder().encode(raw).length,
          outputLength: res.charCount,
          outputBytes: res.byteCount
        });
      } else {
        this.errorMessage.set(res.error);
        this.outputContent.set('');
        this.metrics.set(null);
      }
    }
  }
}
