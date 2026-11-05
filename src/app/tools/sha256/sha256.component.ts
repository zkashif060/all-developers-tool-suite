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
import { computeSha256, isSubtleCryptoSupported } from './sha256.engine';

@Component({
  selector: 'app-sha256',
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
        <!-- Explanatory Security Callout -->
        <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
          <app-icon name="shield" [size]="16" className="text-primary-500 mt-0.5 flex-shrink-0" />
          <div class="leading-relaxed">
            <strong>One-Way Cryptographic Hash:</strong> SHA-256 (FIPS 180-4) is an irreversible digest function, not two-way encryption. It cannot be decrypted back into plain text. Hashes are computed asynchronously via the browser's native Web Crypto API (<code>SubtleCrypto.digest</code>).
          </div>
        </div>

        <!-- Controls Toolbar -->
        <div class="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <!-- Casing Switcher & Presets -->
          <div class="flex flex-wrap items-center gap-4">
            <div class="flex items-center gap-2 text-xs">
              <span class="font-semibold text-slate-600 dark:text-slate-400">Digest Case:</span>
              <div class="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800">
                <button
                  type="button"
                  (click)="uppercase.set(false)"
                  class="px-3 py-1 font-medium rounded-md transition-all text-xs"
                  [class]="!uppercase() ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'"
                >
                  lowercase
                </button>
                <button
                  type="button"
                  (click)="uppercase.set(true)"
                  class="px-3 py-1 font-medium rounded-md transition-all text-xs"
                  [class]="uppercase() ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'"
                >
                  UPPERCASE
                </button>
              </div>
            </div>

            <!-- Presets -->
            <div class="flex items-center gap-1.5 text-xs">
              <span class="text-slate-400 text-[11px]">Presets:</span>
              <button
                type="button"
                (click)="applyPreset('fox')"
                class="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Quick Brown Fox
              </button>
              <button
                type="button"
                (click)="applyPreset('abc')"
                class="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                NIST "abc"
              </button>
              <button
                type="button"
                (click)="applyPreset('unicode')"
                class="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Unicode / Urdu
              </button>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="clear()"
              [disabled]="!inputContent() && !outputContent()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <app-icon name="trash" [size]="13" />
              <span>Clear</span>
            </button>

            <button
              type="button"
              (click)="generateHash()"
              class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <app-icon name="shield" [size]="14" />
              <span>Generate SHA-256</span>
            </button>
          </div>
        </div>

        @if (errorMessage()) {
          <app-error-message
            title="SHA-256 Computation Error"
            [message]="errorMessage()!"
            [dismissible]="true"
            (dismissed)="errorMessage.set(null)"
          />
        }

        <!-- Metrics Bar -->
        @if (outputContent()) {
          <div class="flex items-center justify-between px-4 py-2 rounded-lg bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400">
            <div>
              <span>Input: <strong>{{ byteCount() }}</strong> bytes ({{ inputContent().length }} chars)</span>
              <span class="mx-2">&rarr;</span>
              <span>Digest: <strong>256 bits</strong> (64 hex characters)</span>
            </div>
            <span class="text-emerald-600 dark:text-emerald-400 font-semibold">&check; Web Crypto Subtle API</span>
          </div>
        }

        <!-- Dual Pane Workspace -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[460px]">
          <app-tool-input
            label="Input Text to Hash (UTF-8)"
            [value]="inputContent()"
            (valueChange)="onInputChanged($event)"
            [sampleData]="presetFox"
            placeholder="Type or paste plain text, code, or Unicode characters to compute 256-bit hash digest..."
          />

          <app-tool-output
            label="SHA-256 Hexadecimal Digest (64 Characters)"
            [value]="outputContent()"
            placeholder="64-character hexadecimal SHA-256 digest will appear here..."
            filename="sha256-hash.txt"
          />
        </div>
      </app-tool-page-layout>
    }
  `
})
export class Sha256Component implements OnInit {
  private readonly toolRegistry = inject(ToolRegistryService);
  private readonly recentToolsService = inject(RecentToolsService);

  public readonly tool = signal<ToolMetadata | undefined>(
    this.toolRegistry.getToolById('sha256')
  );

  protected readonly inputContent = signal<string>('');
  protected readonly outputContent = signal<string>('');
  protected readonly uppercase = signal<boolean>(false);
  protected readonly byteCount = signal<number>(0);
  protected readonly errorMessage = signal<string | null>(null);

  // Request counter to prevent stale async responses from overwriting newer user input
  private requestId = 0;

  public readonly presetFox = 'The quick brown fox jumps over the lazy dog.';
  public readonly presetAbc = 'abc';
  public readonly presetUnicode = 'سلام پاکستان! 🇵🇰 ZeroTrace Tools 🛡️ ✨';

  public ngOnInit(): void {
    this.recentToolsService.recordUsage('sha256');

    if (!isSubtleCryptoSupported()) {
      this.errorMessage.set(
        'Web Crypto API (crypto.subtle) is unavailable in this browser environment. Ensure you are accessing the tool over HTTPS or localhost.'
      );
    }
  }

  public applyPreset(type: 'fox' | 'abc' | 'unicode'): void {
    if (type === 'fox') {
      this.inputContent.set(this.presetFox);
    } else if (type === 'abc') {
      this.inputContent.set(this.presetAbc);
    } else {
      this.inputContent.set(this.presetUnicode);
    }
    this.errorMessage.set(null);
  }

  public clear(): void {
    this.inputContent.set('');
    this.outputContent.set('');
    this.byteCount.set(0);
    this.errorMessage.set(null);
  }

  public onInputChanged(val: string): void {
    this.inputContent.set(val);
    this.errorMessage.set(null);
    if (!val.trim()) {
      this.outputContent.set('');
      this.byteCount.set(0);
    }
  }

  public async generateHash(): Promise<void> {
    const raw = this.inputContent();
    const currentReq = ++this.requestId;

    if (!raw) {
      this.outputContent.set('');
      this.byteCount.set(0);
      return;
    }

    const res = await computeSha256(raw, {
      uppercase: this.uppercase()
    });

    // Guard against race conditions / stale results
    if (currentReq !== this.requestId) {
      return;
    }

    if (res.success) {
      this.outputContent.set(res.hash);
      this.byteCount.set(res.byteCount);
      this.errorMessage.set(null);
    } else {
      this.errorMessage.set(res.error);
      this.outputContent.set('');
      this.byteCount.set(0);
    }
  }
}
