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
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { DecodedJwtSuccess, decodeJwt } from './jwt-decoder.engine';

@Component({
  selector: 'app-jwt-decoder',
  standalone: true,
  imports: [
    FormsModule,
    ToolPageLayoutComponent,
    ToolInputComponent,
    ToolOutputComponent,
    AppIconComponent,
    CopyButtonComponent,
    ErrorMessageComponent
  ],
  template: `
    @if (tool(); as t) {
      <app-tool-page-layout [tool]="t">
        <!-- Prominent Security Warning Callout -->
        <div class="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-3">
          <app-icon name="alert-circle" [size]="18" className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div class="leading-relaxed">
            <strong>Security Warning:</strong> Decoding does <u>not</u> verify the token's cryptographic signature or authenticity. Never trust unverified claims for security or authorization decisions. All decoding is processed locally in your browser and never sent over the network.
          </div>
        </div>

        <!-- Controls Toolbar -->
        <div class="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <!-- Preset Buttons -->
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Sample Tokens:</span>
            <button
              type="button"
              (click)="loadPreset('active')"
              class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Active Token
            </button>
            <button
              type="button"
              (click)="loadPreset('expired')"
              class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Expired Token
            </button>
            <button
              type="button"
              (click)="loadPreset('unicode')"
              class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Multilingual / Unicode
            </button>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="decode()"
              class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <app-icon name="key" [size]="14" />
              <span>Decode Token</span>
            </button>
          </div>
        </div>

        @if (errorMessage()) {
          <app-error-message
            title="JWT Token Decoding Error"
            [message]="errorMessage()"
            [dismissible]="true"
            (dismissed)="errorMessage.set(null)"
          />
        }

        <!-- Token Inspection Status & Claims Summary Card -->
        @if (decodedResult(); as d) {
          <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col gap-4">
            <!-- Status Header -->
            <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div class="flex items-center gap-3">
                <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Token Status:</span>
                @if (d.expiration) {
                  @if (d.expiration.isExpired) {
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
                      <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>EXPIRED ({{ d.expiration.relativeTime }})</span>
                    </span>
                  } @else {
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>ACTIVE ({{ d.expiration.relativeTime }})</span>
                    </span>
                  }
                } @else {
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <span>NO EXPIRATION (exp) CLAIM</span>
                  </span>
                }
              </div>

              <div class="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                <span>Algorithm: <strong class="text-slate-900 dark:text-slate-200">{{ d.header.alg || 'none' }}</strong></span>
                <span>&middot;</span>
                <span>Type: <strong class="text-slate-900 dark:text-slate-200">{{ d.header.typ || 'JWT' }}</strong></span>
              </div>
            </div>

            <!-- Standard Claims Overview -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span class="text-[11px] font-semibold text-slate-400 block mb-0.5">Subject (sub)</span>
                <span class="font-mono text-slate-900 dark:text-slate-200 truncate block">{{ d.payload.sub || '-' }}</span>
              </div>

              <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span class="text-[11px] font-semibold text-slate-400 block mb-0.5">Issuer (iss)</span>
                <span class="font-mono text-slate-900 dark:text-slate-200 truncate block">{{ d.payload.iss || '-' }}</span>
              </div>

              <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span class="text-[11px] font-semibold text-slate-400 block mb-0.5">Issued At (iat)</span>
                <span class="font-mono text-slate-900 dark:text-slate-200 truncate block" [title]="d.issuedAt?.formattedUtc || ''">
                  {{ d.issuedAt ? d.issuedAt.formattedLocal : '-' }}
                </span>
              </div>

              <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span class="text-[11px] font-semibold text-slate-400 block mb-0.5">Expires At (exp)</span>
                <span class="font-mono text-slate-900 dark:text-slate-200 truncate block" [title]="d.expiration?.formattedUtc || ''">
                  {{ d.expiration ? d.expiration.formattedLocal : 'Never' }}
                </span>
              </div>
            </div>
          </div>
        }

        <!-- Dual Pane Workspace -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
          <!-- Input Side -->
          <app-tool-input
            label="Raw Encoded JWT Token"
            [value]="inputContent()"
            (valueChange)="onInputChanged($event)"
            [sampleData]="presetActive"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ..."
          />

          <!-- Decoded Output Side (Header, Payload, and Signature) -->
          <div class="flex flex-col gap-4">
            <!-- Header Output -->
            <app-tool-output
              label="Decoded Header (JOSE)"
              [value]="headerOutput()"
              placeholder="Header JSON will appear here..."
              [rows]="5"
              filename="jwt-header.json"
              mimeType="application/json"
            />

            <!-- Payload Output -->
            <app-tool-output
              label="Decoded Payload (Claims)"
              [value]="payloadOutput()"
              placeholder="Payload claims JSON will appear here..."
              [rows]="8"
              filename="jwt-payload.json"
              mimeType="application/json"
            />

            <!-- Signature Output -->
            @if (signatureOutput()) {
              <div class="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between gap-3 text-xs">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="font-semibold text-slate-500 dark:text-slate-400 flex-shrink-0">Signature:</span>
                  <span class="font-mono text-slate-700 dark:text-slate-300 truncate">{{ signatureOutput() }}</span>
                </div>
                <app-copy-button [text]="signatureOutput()" label="Copy Signature" />
              </div>
            }
          </div>
        </div>
      </app-tool-page-layout>
    }
  `
})
export class JwtDecoderComponent implements OnInit {
  private readonly toolRegistry = inject(ToolRegistryService);
  private readonly recentToolsService = inject(RecentToolsService);

  public readonly tool = signal<ToolMetadata | undefined>(
    this.toolRegistry.getToolById('jwt-decoder')
  );

  protected readonly inputContent = signal<string>('');
  protected readonly headerOutput = signal<string>('');
  protected readonly payloadOutput = signal<string>('');
  protected readonly signatureOutput = signal<string>('');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly decodedResult = signal<DecodedJwtSuccess | null>(null);

  // Realistic presets
  public readonly presetActive =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfMTAwMSIsIm5hbWUiOiJaYWluIEFsaSIsImVtYWlsIjoiemFpbkBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsImlzcyI6Imh0dHBzOi8vYXV0aC5kZXZ0b29scy1odWIuY29tIiwiYXVkIjoiZGV2dG9vbHMtaHViLWFwaSIsImlhdCI6MTc0MTA2ODAwMCwiZXhwIjoyMDgwMDAwMDAwfQ.g6E_eUvJ4N2OqJ7yF9m2X_1_mockSignature';

  public readonly presetExpired =
    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfMjAwMiIsIm5hbWUiOiJTYXJhIEtoYW4iLCJlbWFpbCI6InNhcmFAZXhhbXBsZS5jb20iLCJyb2xlIjoiZGV2ZWxvcGVyIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjJ9.X8Y_mockExpiredSignature';

  public readonly presetUnicode =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfMzAwMyIsIm5hbWUiOiLYp9it2YXYryDYrtin2YYiLCJjaXR5Ijoi2YTYp9mH2YjYsSIsIm9yZyI6IkRldlRvb2xzIFRlY2ggTGFicyDwn5mpIiwiaWF0IjoxNzQwMDAwMDAwLCJleHAiOjIxMDAwMDAwMDB9.mockUnicodeSignature';

  public ngOnInit(): void {
    this.recentToolsService.recordUsage('jwt-decoder');
  }

  public loadPreset(type: 'active' | 'expired' | 'unicode'): void {
    if (type === 'active') {
      this.inputContent.set(this.presetActive);
    } else if (type === 'expired') {
      this.inputContent.set(this.presetExpired);
    } else {
      this.inputContent.set(this.presetUnicode);
    }
    this.errorMessage.set(null);
  }

  public onInputChanged(val: string): void {
    this.inputContent.set(val);
    this.errorMessage.set(null);
    if (!val.trim()) {
      this.headerOutput.set('');
      this.payloadOutput.set('');
      this.signatureOutput.set('');
      this.decodedResult.set(null);
    }
  }

  public decode(): void {
    const raw = this.inputContent().trim();
    if (!raw) {
      this.headerOutput.set('');
      this.payloadOutput.set('');
      this.signatureOutput.set('');
      this.errorMessage.set(null);
      this.decodedResult.set(null);
      return;
    }

    const res = decodeJwt(raw);

    if (res.success) {
      this.headerOutput.set(res.headerFormatted);
      this.payloadOutput.set(res.payloadFormatted);
      this.signatureOutput.set(res.signature);
      this.errorMessage.set(null);
      this.decodedResult.set(res);
    } else {
      this.errorMessage.set(res.error);
      this.headerOutput.set('');
      this.payloadOutput.set('');
      this.signatureOutput.set('');
      this.decodedResult.set(null);
    }
  }
}
