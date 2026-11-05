import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolRegistryService } from '../../core/services/tool-registry.service';
import { RecentToolsService } from '../../core/services/recent-tools.service';
import { ToolMetadata } from '../../core/models/tool.model';
import { ToolPageLayoutComponent } from '../../shared/components/tool-page-layout/tool-page-layout.component';
import { ToolInputComponent } from '../../shared/components/tool-input/tool-input.component';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { CopyButtonComponent } from '../../shared/components/copy-button/copy-button.component';
import { JsonMetadata, validateJson } from './json-validator.engine';

@Component({
  selector: 'app-json-validator',
  standalone: true,
  imports: [
    FormsModule,
    ToolPageLayoutComponent,
    ToolInputComponent,
    AppIconComponent,
    ErrorMessageComponent,
    CopyButtonComponent
  ],
  template: `
    @if (tool(); as t) {
      <app-tool-page-layout [tool]="t">
        <!-- Control Toolbar & Status Banner -->
        <div class="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div class="flex items-center gap-3">
            @if (validationStatus() === 'valid') {
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                <app-icon name="check-circle" [size]="16" className="text-emerald-500" />
                <span>Valid RFC 8259 JSON</span>
              </div>
            } @else if (validationStatus() === 'invalid') {
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-semibold">
                <app-icon name="alert-circle" [size]="16" className="text-red-500" />
                <span>Invalid JSON Syntax</span>
              </div>
            } @else {
              <span class="text-xs text-slate-500 dark:text-slate-400">
                Enter or paste a JSON string to inspect syntax and schema compliance.
              </span>
            }
          </div>

          <div class="flex items-center gap-2">
            <app-copy-button [text]="inputContent()" label="Copy Input" />

            <button
              type="button"
              (click)="loadInvalidSample()"
              class="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              title="Load broken JSON to test error locator"
            >
              Test Broken Sample
            </button>

            <button
              type="button"
              (click)="validate()"
              class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <app-icon name="check" [size]="14" />
              <span>Validate Syntax</span>
            </button>
          </div>
        </div>

        <!-- Error Alert Banner -->
        @if (errorDetails(); as err) {
          <app-error-message
            title="JSON Syntax Error"
            [message]="err.error"
            [line]="err.line"
            [column]="err.column"
            [dismissible]="true"
            (dismissed)="errorDetails.set(null)"
          />
        }

        <!-- Structural Metadata Cards (on Valid JSON) -->
        @if (metadata(); as m) {
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Root Type</span>
              <div class="text-base font-bold font-mono text-primary-500 capitalize mt-0.5">
                {{ m.dataType }}
              </div>
            </div>

            <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {{ m.dataType === 'array' ? 'Elements' : 'Root Keys' }}
              </span>
              <div class="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                {{ m.itemCount }}
              </div>
            </div>

            <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Max Depth</span>
              <div class="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                {{ m.depth }} level{{ m.depth === 1 ? '' : 's' }}
              </div>
            </div>

            <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Keys / Size</span>
              <div class="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                {{ m.totalKeys }} keys &middot; {{ m.byteSize }} B
              </div>
            </div>
          </div>
        }

        <!-- Input Editor Pane -->
        <div class="min-h-[460px]">
          <app-tool-input
            label="JSON Document to Validate"
            [value]="inputContent()"
            (valueChange)="onInputChanged($event)"
            [sampleData]="sampleJson"
            placeholder="Paste your JSON here to validate RFC 8259 syntax..."
          />
        </div>
      </app-tool-page-layout>
    }
  `
})
export class JsonValidatorComponent implements OnInit {
  private readonly toolRegistry = inject(ToolRegistryService);
  private readonly recentToolsService = inject(RecentToolsService);

  public readonly tool = signal<ToolMetadata | undefined>(
    this.toolRegistry.getToolById('json-validator')
  );

  protected readonly inputContent = signal<string>('');
  protected readonly validationStatus = signal<'idle' | 'valid' | 'invalid'>('idle');
  protected readonly metadata = signal<JsonMetadata | null>(null);
  protected readonly errorDetails = signal<{ error: string; line?: number; column?: number } | null>(null);

  protected readonly sampleJson = `{\n  "service": "ZeroTrace Tools",\n  "version": 2.0,\n  "operational": true,\n  "endpoints": [\n    {\n      "id": "json-validator",\n      "active": true\n    }\n  ],\n  "settings": {\n    "cache": null,\n    "retries": 3\n  }\n}`;

  public ngOnInit(): void {
    this.recentToolsService.recordUsage('json-validator');
  }

  public onInputChanged(val: string): void {
    this.inputContent.set(val);
    this.validationStatus.set('idle');
    this.errorDetails.set(null);
    if (!val.trim()) {
      this.metadata.set(null);
    }
  }

  public loadInvalidSample(): void {
    const broken = `{\n  "name": "ZeroTrace Tools",\n  "missingQuoteKey: "invalid value",\n  "trailingComma": true,\n}`;
    this.inputContent.set(broken);
    this.validationStatus.set('idle');
    this.metadata.set(null);
    this.errorDetails.set(null);
  }

  public validate(): void {
    const raw = this.inputContent();
    if (!raw.trim()) {
      this.validationStatus.set('invalid');
      this.metadata.set(null);
      this.errorDetails.set({ error: 'Input is empty. Please enter or paste JSON to validate.' });
      return;
    }

    const res = validateJson(raw);
    if (res.valid) {
      this.validationStatus.set('valid');
      this.metadata.set(res.metadata);
      this.errorDetails.set(null);
    } else {
      this.validationStatus.set('invalid');
      this.metadata.set(null);
      this.errorDetails.set({
        error: res.error,
        line: res.line,
        column: res.column
      });
    }
  }
}
