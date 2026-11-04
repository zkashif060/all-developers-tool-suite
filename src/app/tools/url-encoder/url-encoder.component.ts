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
import {
  SpaceEncodingMode,
  UrlEncodeMode,
  decodeUrl,
  encodeUrl
} from './url-encoder.engine';

@Component({
  selector: 'app-url-encoder',
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
        <!-- Main Controls Toolbar -->
        <div class="flex flex-col gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <!-- Top Row: Mode Switcher & Presets -->
          <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div class="flex flex-wrap items-center gap-3">
              <!-- Encode / Decode Toggle -->
              <div class="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800 text-xs">
                <button
                  type="button"
                  (click)="setMode('encode')"
                  class="px-3.5 py-1.5 font-medium rounded-md transition-all flex items-center gap-1.5"
                  [class]="mode() === 'encode' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
                >
                  <app-icon name="link" [size]="14" />
                  <span>URL Encode</span>
                </button>
                <button
                  type="button"
                  (click)="setMode('decode')"
                  class="px-3.5 py-1.5 font-medium rounded-md transition-all flex items-center gap-1.5"
                  [class]="mode() === 'decode' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
                >
                  <app-icon name="file-text" [size]="14" />
                  <span>URL Decode</span>
                </button>
              </div>

              <!-- Scope Selector (Component vs Full URL) -->
              <div class="flex items-center gap-2 text-xs">
                <span class="font-semibold text-slate-600 dark:text-slate-400">Target:</span>
                <select
                  [ngModel]="encodeScope()"
                  (ngModelChange)="encodeScope.set($event)"
                  class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-primary-500"
                >
                  <option value="component">URL Component (Query Params & Values)</option>
                  <option value="full_url">Complete URL (Preserves http://, ?, &, /)</option>
                </select>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="swap()"
                [disabled]="!outputContent()"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Swap input and output"
              >
                <app-icon name="arrow-left-right" [size]="13" />
                <span>Swap</span>
              </button>

              <button
                type="button"
                (click)="process()"
                class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <app-icon name="link" [size]="14" />
                <span>{{ mode() === 'encode' ? 'Encode URL' : 'Decode URL' }}</span>
              </button>
            </div>
          </div>

          <!-- Bottom Row: Specific Options & Explanations -->
          <div class="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div class="flex flex-wrap items-center gap-4">
              <!-- Space Encoding -->
              <div class="flex items-center gap-2">
                <span class="font-semibold text-slate-600 dark:text-slate-400">Spaces:</span>
                <select
                  [ngModel]="spaceEncoding()"
                  (ngModelChange)="spaceEncoding.set($event)"
                  class="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-primary-500"
                >
                  <option value="standard">Standard RFC 3986 (%20)</option>
                  <option value="form">Form Data (+)</option>
                </select>
              </div>

              <!-- Strict RFC 3986 Special Characters -->
              @if (mode() === 'encode') {
                <label class="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    [ngModel]="strictSpecialChars()"
                    (ngModelChange)="strictSpecialChars.set($event)"
                    class="rounded text-primary-500 focus:ring-primary-500"
                  />
                  <span>Strict RFC 3986 (encode !, ', (, ), *)</span>
                </label>
              }

              <!-- Plus as space decode toggle -->
              @if (mode() === 'decode') {
                <label class="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    [ngModel]="decodePlusAsSpace()"
                    (ngModelChange)="decodePlusAsSpace.set($event)"
                    class="rounded text-primary-500 focus:ring-primary-500"
                  />
                  <span>Decode + as space</span>
                </label>
              }
            </div>

            <!-- Presets -->
            <div class="flex items-center gap-2">
              <span class="font-medium text-slate-500 dark:text-slate-400">Presets:</span>
              <button
                type="button"
                (click)="loadPreset('full')"
                class="px-2 py-0.5 text-[11px] rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Full URL
              </button>
              <button
                type="button"
                (click)="loadPreset('query')"
                class="px-2 py-0.5 text-[11px] rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Query String
              </button>
              <button
                type="button"
                (click)="loadPreset('unicode')"
                class="px-2 py-0.5 text-[11px] rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Unicode / Urdu
              </button>
            </div>
          </div>
        </div>

        <!-- Architectural & Engineering Distinction Callout -->
        <div class="p-3.5 rounded-xl bg-primary-50/60 dark:bg-primary-950/30 border border-primary-200/80 dark:border-primary-900/40 text-xs text-primary-900 dark:text-primary-300 flex items-start gap-2.5">
          <app-icon name="info" [size]="16" className="text-primary-500 mt-0.5 flex-shrink-0" />
          <div class="leading-relaxed">
            @if (encodeScope() === 'component') {
              <span><strong>URL Component Mode Active:</strong> Encodes all URI reserved delimiters (including <code>:</code>, <code>/</code>, <code>?</code>, <code>&</code>, <code>=</code>). Use this when encoding individual query parameter values, search terms, or API route arguments.</span>
            } @else {
              <span><strong>Complete URL Mode Active:</strong> Preserves standard URL structure and protocol (like <code>https://</code>, slashes, and query separators <code>?</code>, <code>&</code>), encoding only invalid path characters, spaces, and Unicode text.</span>
            }
          </div>
        </div>

        @if (errorMessage()) {
          <app-error-message
            title="URL Processing Error"
            [message]="errorMessage()"
            [dismissible]="true"
            (dismissed)="errorMessage.set(null)"
          />
        }

        <!-- Metrics Bar -->
        @if (outputContent()) {
          <div class="flex items-center justify-between px-4 py-2 rounded-lg bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400">
            <div>
              <span>Input: <strong>{{ inputContent().length }}</strong> chars</span>
              <span class="mx-2">&rarr;</span>
              <span>Output: <strong>{{ outputContent().length }}</strong> chars</span>
            </div>
            <span class="text-emerald-600 dark:text-emerald-400 font-semibold">&check; RFC 3986 Compliant</span>
          </div>
        }

        <!-- Dual Pane Workspace -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[460px]">
          <app-tool-input
            [label]="mode() === 'encode' ? 'Raw URL / Text to Encode' : 'Percent-Encoded String to Decode'"
            [value]="inputContent()"
            (valueChange)="onInputChanged($event)"
            [sampleData]="sampleData"
            [placeholder]="mode() === 'encode' ? 'https://example.com/search?q=developer tools&filter=active#results' : 'https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Ddeveloper%20tools%26filter%3Dactive%23results'"
          />

          <app-tool-output
            [label]="mode() === 'encode' ? 'Percent-Encoded Output' : 'Decoded URL Output'"
            [value]="outputContent()"
            placeholder="URL conversion result will appear here..."
            filename="url-result.txt"
          />
        </div>
      </app-tool-page-layout>
    }
  `
})
export class UrlEncoderComponent implements OnInit {
  private readonly toolRegistry = inject(ToolRegistryService);
  private readonly recentToolsService = inject(RecentToolsService);

  public readonly tool = signal<ToolMetadata | undefined>(
    this.toolRegistry.getToolById('url-encoder')
  );

  protected readonly mode = signal<'encode' | 'decode'>('encode');
  protected readonly encodeScope = signal<UrlEncodeMode>('component');
  protected readonly spaceEncoding = signal<SpaceEncodingMode>('standard');
  protected readonly strictSpecialChars = signal<boolean>(false);
  protected readonly decodePlusAsSpace = signal<boolean>(true);

  protected readonly inputContent = signal<string>('');
  protected readonly outputContent = signal<string>('');
  protected readonly errorMessage = signal<string | null>(null);

  protected sampleData = 'https://example.com/api/search?query=angular & tailwind&location=لاہور&status=active#top';

  public ngOnInit(): void {
    this.recentToolsService.recordUsage('url-encoder');
  }

  public setMode(m: 'encode' | 'decode'): void {
    this.mode.set(m);
    this.errorMessage.set(null);
  }

  public onInputChanged(val: string): void {
    this.inputContent.set(val);
    this.errorMessage.set(null);
    if (!val.trim()) {
      this.outputContent.set('');
    }
  }

  public loadPreset(type: 'full' | 'query' | 'unicode'): void {
    if (type === 'full') {
      this.encodeScope.set('full_url');
      this.inputContent.set('https://api.devtools-hub.com/v1/search?q=full url example&filter=active#section');
    } else if (type === 'query') {
      this.encodeScope.set('component');
      this.inputContent.set('title=Senior Developer & Architect&salary=>75000&skills=[Angular, TypeScript]');
    } else {
      this.encodeScope.set('component');
      this.inputContent.set('شہر=لاہور&ملک=پاکستان&emoji=🚀✨');
    }
    this.errorMessage.set(null);
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
      return;
    }

    if (this.mode() === 'encode') {
      const res = encodeUrl(raw, {
        mode: this.encodeScope(),
        spaceEncoding: this.spaceEncoding(),
        encodeSpecialCharacters: this.strictSpecialChars()
      });

      if (res.success) {
        this.outputContent.set(res.output);
        this.errorMessage.set(null);
      } else {
        this.errorMessage.set(res.error);
        this.outputContent.set('');
      }
    } else {
      const res = decodeUrl(raw, {
        mode: this.encodeScope(),
        decodePlusAsSpace: this.decodePlusAsSpace()
      });

      if (res.success) {
        this.outputContent.set(res.output);
        this.errorMessage.set(null);
      } else {
        this.errorMessage.set(res.error);
        this.outputContent.set('');
      }
    }
  }
}
