import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToolPageLayoutComponent } from '../../shared/components/tool-page-layout/tool-page-layout.component';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { CopyButtonComponent } from '../../shared/components/copy-button/copy-button.component';
import { ClearButtonComponent } from '../../shared/components/clear-button/clear-button.component';
import { ToolRegistryService } from '../../core/services/tool-registry.service';
import { RecentToolsService } from '../../core/services/recent-tools.service';
import { ToolMetadata } from '../../core/models/tool.model';
import { ImageBase64Engine, ImageBase64Result, ImageDecodeResult, ImageOutputFormat } from './image-base64.engine';

@Component({
  selector: 'app-image-base64',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToolPageLayoutComponent,
    AppIconComponent,
    CopyButtonComponent,
    ClearButtonComponent
  ],
  template: `
    @if (tool(); as t) {
      <app-tool-page-layout [tool]="t">
      <!-- Mode Selection Tabs -->
      <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-6 gap-4 flex-wrap">
        <div class="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
          <button
            type="button"
            (click)="setMode('encode')"
            [class]="activeMode() === 'encode'
              ? 'flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-xs transition-all'
              : 'flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-all'"
          >
            <app-icon name="image" [size]="14" />
            <span>Image to Base64</span>
          </button>

          <button
            type="button"
            (click)="setMode('decode')"
            [class]="activeMode() === 'decode'
              ? 'flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-xs transition-all'
              : 'flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-all'"
          >
            <app-icon name="binary" [size]="14" />
            <span>Base64 to Image</span>
          </button>
        </div>

        <!-- Sample Loaders -->
        <div class="flex items-center gap-2">
          @if (activeMode() === 'encode') {
            <button
              type="button"
              (click)="loadEncodeSample()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg transition-colors shadow-2xs"
            >
              <app-icon name="sparkles" [size]="13" className="text-amber-500" />
              <span>Load Sample Image</span>
            </button>
          } @else {
            <button
              type="button"
              (click)="loadDecodeSample()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg transition-colors shadow-2xs"
            >
              <app-icon name="sparkles" [size]="13" className="text-amber-500" />
              <span>Load Sample Base64</span>
            </button>
          }

          <app-clear-button (cleared)="clearAll()" />
        </div>
      </div>

      <!-- ========================================== -->
      <!-- MODE 1: IMAGE TO BASE64                     -->
      <!-- ========================================== -->
      @if (activeMode() === 'encode') {
        <div class="space-y-6">
          <!-- Upload Area & Drag-Drop -->
          <div
            class="relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer bg-slate-50/50 dark:bg-slate-900/40"
            [class.border-primary-500]="isDragging()"
            [class.bg-primary-500/5]="isDragging()"
            [class.border-slate-200]="!isDragging()"
            [class.dark:border-slate-800]="!isDragging()"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
            (click)="fileInput.click()"
          >
            <input
              #fileInput
              type="file"
              accept="image/*"
              class="hidden"
              (change)="onFileSelected($event)"
            />

            <div class="flex flex-col items-center justify-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shadow-xs border border-primary-200/50 dark:border-primary-800/50">
                <app-icon name="image" [size]="24" />
              </div>

              <div>
                <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Click to browse or drag & drop an image here
                </p>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Supports PNG, JPG, WEBP, SVG, GIF, BMP, ICO (or paste from clipboard with <kbd class="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">Ctrl+V</kbd>)
                </p>
              </div>

              @if (stagedFile()) {
                <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-xs mt-1">
                  <app-icon name="check" [size]="14" className="text-emerald-500" />
                  <span class="font-semibold">{{ stagedFile()?.name }}</span>
                  <span class="text-slate-400">({{ formatBytes(stagedFile()?.size || 0) }})</span>
                </div>
              }
            </div>
          </div>

          <!-- Primary Action Execution Button -->
          <div class="flex items-center justify-between gap-4">
            <button
              type="button"
              (click)="convertImageToBase64()"
              [disabled]="!stagedFile()"
              class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <app-icon name="play" [size]="16" />
              <span>Convert to Base64</span>
            </button>

            @if (encodeResult()) {
              <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Original: <strong>{{ formatBytes(encodeResult()!.originalSizeBytes) }}</strong></span>
                <span>&bull;</span>
                <span>Base64: <strong>{{ formatBytes(encodeResult()!.base64SizeBytes) }}</strong></span>
                <span class="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-mono text-[11px] font-semibold">
                  +{{ encodeResult()!.sizeOverheadPercent }}%
                </span>
              </div>
            }
          </div>

          <!-- Results Section -->
          @if (encodeResult()) {
            <div class="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
              <!-- Format Selector Bar -->
              <div class="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 mr-1">Output Format:</span>
                  @for (fmt of formatOptions; track fmt.key) {
                    <button
                      type="button"
                      (click)="selectedFormat.set(fmt.key)"
                      [class]="selectedFormat() === fmt.key
                        ? 'px-2.5 py-1 text-xs font-semibold rounded-lg bg-primary-500 text-white shadow-2xs transition-all'
                        : 'px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all'"
                    >
                      {{ fmt.label }}
                    </button>
                  }
                </div>

                <div class="flex items-center gap-2">
                  <app-copy-button [text]="currentOutputText()" label="Copy" />
                  <button
                    type="button"
                    (click)="downloadBase64Text()"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg transition-colors shadow-2xs"
                    title="Download Base64 text file"
                  >
                    <app-icon name="download" [size]="13" />
                    <span>Download .txt</span>
                  </button>
                </div>
              </div>

              <!-- Output Code Textarea & Preview -->
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div class="lg:col-span-2">
                  <textarea
                    [value]="currentOutputText()"
                    readonly
                    rows="9"
                    class="w-full rounded-xl p-3 font-mono text-xs bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 select-all focus:outline-none focus:ring-2 focus:ring-primary-500"
                  ></textarea>
                </div>

                <!-- Live Thumbnail Box -->
                <div class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                  <div class="max-h-40 max-w-full flex items-center justify-center overflow-hidden rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1">
                    <img
                      [src]="encodeResult()!.dataUri"
                      [alt]="encodeResult()!.fileName"
                      class="max-h-36 max-w-full object-contain rounded"
                    />
                  </div>
                  <span class="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-2 truncate max-w-full">
                    {{ encodeResult()!.fileName }}
                  </span>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- ========================================== -->
      <!-- MODE 2: BASE64 TO IMAGE                     -->
      <!-- ========================================== -->
      @if (activeMode() === 'decode') {
        <div class="space-y-6">
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Base64 String or Data URI Input
            </label>
            <textarea
              [(ngModel)]="decodeInput"
              rows="6"
              placeholder="Paste raw Base64 string or data:image/...;base64,... data URI here"
              class="w-full rounded-xl p-3 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-2xs"
            ></textarea>
          </div>

          <!-- Error Message Banner -->
          @if (decodeError()) {
            <div class="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
              <app-icon name="alert-circle" [size]="16" className="shrink-0" />
              <span>{{ decodeError() }}</span>
            </div>
          }

          <!-- Decode Button -->
          <div class="flex items-center justify-between gap-4">
            <button
              type="button"
              (click)="decodeBase64ToImage()"
              [disabled]="!decodeInput.trim()"
              class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <app-icon name="play" [size]="16" />
              <span>Decode to Image</span>
            </button>

            @if (decodeResult()?.isValid) {
              <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Format: <strong>{{ decodeResult()!.detectedFormatName }}</strong></span>
                <span>&bull;</span>
                <span>Est. Size: <strong>{{ formatBytes(decodeResult()!.estimatedSizeBytes) }}</strong></span>
              </div>
            }
          </div>

          <!-- Decoded Image Preview Card -->
          @if (decodeResult()?.isValid) {
            <div class="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-6 space-y-4 shadow-xs">
              <div class="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span class="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {{ decodeResult()!.detectedFormatName }} Decoded
                  </span>
                  <span class="text-xs font-mono text-slate-400">({{ decodeResult()!.mimeType }})</span>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="downloadDecodedImage()"
                    class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-500 rounded-lg transition-colors shadow-2xs"
                  >
                    <app-icon name="download" [size]="14" />
                    <span>Download Image File</span>
                  </button>
                  <app-copy-button [text]="decodeResult()!.dataUri" label="Copy Data URI" />
                </div>
              </div>

              <!-- Large Visual Preview Container -->
              <div class="flex items-center justify-center p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 overflow-hidden min-h-64">
                <img
                  [src]="decodeResult()!.dataUri"
                  alt="Decoded Base64 Preview"
                  class="max-h-96 max-w-full object-contain rounded-lg shadow-sm"
                />
              </div>
            </div>
          }
        </div>
      }
    </app-tool-page-layout>
    }
  `
})
export class ImageBase64Component implements OnInit {
  private readonly toolRegistry = inject(ToolRegistryService);
  private readonly recentToolsService = inject(RecentToolsService);

  public readonly tool = signal<ToolMetadata | undefined>(
    this.toolRegistry.getToolById('image-base64')
  );

  public ngOnInit(): void {
    this.recentToolsService.recordUsage('image-base64');
  }
  public readonly activeMode = signal<'encode' | 'decode'>('encode');
  public readonly isDragging = signal<boolean>(false);
  public readonly stagedFile = signal<File | null>(null);
  public readonly encodeResult = signal<ImageBase64Result | null>(null);
  public readonly selectedFormat = signal<ImageOutputFormat>('dataUri');

  public decodeInput = '';
  public readonly decodeError = signal<string | null>(null);
  public readonly decodeResult = signal<ImageDecodeResult | null>(null);

  public readonly formatOptions: { key: ImageOutputFormat; label: string }[] = [
    { key: 'dataUri', label: 'Data URI' },
    { key: 'raw', label: 'Raw Base64' },
    { key: 'htmlImg', label: 'HTML <img>' },
    { key: 'cssBg', label: 'CSS Background' },
    { key: 'json', label: 'JSON' }
  ];

  public setMode(mode: 'encode' | 'decode'): void {
    this.activeMode.set(mode);
    this.decodeError.set(null);
  }

  public onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  public onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  public onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        this.stagedFile.set(file);
      }
    }
  }

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.stagedFile.set(input.files[0]);
    }
  }

  @HostListener('window:paste', ['$event'])
  public onClipboardPaste(event: ClipboardEvent): void {
    if (this.activeMode() !== 'encode') return;
    if (event.clipboardData && event.clipboardData.items) {
      for (let i = 0; i < event.clipboardData.items.length; i++) {
        const item = event.clipboardData.items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            this.stagedFile.set(file);
            break;
          }
        }
      }
    }
  }

  public async convertImageToBase64(): Promise<void> {
    const file = this.stagedFile();
    if (!file) return;

    try {
      const result = await ImageBase64Engine.fileToBase64(file);
      this.encodeResult.set(result);
    } catch (err: any) {
      alert('Error reading image: ' + err.message);
    }
  }

  public currentOutputText(): string {
    const res = this.encodeResult();
    if (!res) return '';

    switch (this.selectedFormat()) {
      case 'dataUri': return res.dataUri;
      case 'raw': return res.rawBase64;
      case 'htmlImg': return res.htmlImg;
      case 'cssBg': return res.cssBg;
      case 'json': return res.json;
    }
  }

  public decodeBase64ToImage(): void {
    this.decodeError.set(null);
    const result = ImageBase64Engine.decodeBase64ToImage(this.decodeInput);

    if (!result.isValid) {
      this.decodeError.set(result.error || 'Invalid Base64 sequence');
      this.decodeResult.set(null);
      return;
    }

    this.decodeResult.set(result);
  }

  public downloadBase64Text(): void {
    const text = this.currentOutputText();
    if (!text) return;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.encodeResult()?.fileName || 'image'}-base64.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  public downloadDecodedImage(): void {
    const res = this.decodeResult();
    if (!res || !res.isValid) return;

    const blob = ImageBase64Engine.base64ToBlob(res.cleanBase64, res.mimeType);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Determine extension
    let ext = 'png';
    if (res.mimeType.includes('jpeg')) ext = 'jpg';
    else if (res.mimeType.includes('gif')) ext = 'gif';
    else if (res.mimeType.includes('webp')) ext = 'webp';
    else if (res.mimeType.includes('svg')) ext = 'svg';
    else if (res.mimeType.includes('bmp')) ext = 'bmp';
    else if (res.mimeType.includes('icon')) ext = 'ico';

    a.download = `decoded-image.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  public loadEncodeSample(): void {
    // Create an inline SVG sample file
    const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#3762EA"/>
          <stop offset="100%" stop-color="#0284C7"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="20" fill="url(#g)"/>
      <path d="M35 30L20 50L35 70M65 30L80 50L65 70M57 26L43 74" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>
    </svg>`;

    const blob = new Blob([sampleSvg], { type: 'image/svg+xml' });
    const file = new File([blob], 'sample-dev-logo.svg', { type: 'image/svg+xml' });
    this.stagedFile.set(file);
    this.encodeResult.set(null);
  }

  public loadDecodeSample(): void {
    this.decodeInput = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMzNzYyRUEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwMjg0QzciLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjIwIiBmaWxsPSJ1cmwoI2cpIi8+PHBhdGggZD0iTTM1IDMwTDIwIDUwTDM1IDcwTTY1IDMwTDgwIDUwTDY1IDcwTTU3IDI2TDQzIDc0IiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iNiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+';
    this.decodeError.set(null);
    this.decodeResult.set(null);
  }

  public clearAll(): void {
    this.stagedFile.set(null);
    this.encodeResult.set(null);
    this.decodeInput = '';
    this.decodeError.set(null);
    this.decodeResult.set(null);
  }

  public formatBytes(bytes: number): string {
    return ImageBase64Engine.formatBytes(bytes);
  }
}

