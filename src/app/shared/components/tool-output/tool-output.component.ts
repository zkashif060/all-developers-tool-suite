import { Component, computed, input } from '@angular/core';
import { AppIconComponent } from '../app-icon/app-icon.component';
import { CopyButtonComponent } from '../copy-button/copy-button.component';
import { DownloadButtonComponent } from '../download-button/download-button.component';

@Component({
  selector: 'app-tool-output',
  standalone: true,
  imports: [AppIconComponent, CopyButtonComponent, DownloadButtonComponent],
  template: `
    <div class="flex flex-col h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      <!-- Header Bar -->
      <div class="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {{ label() }}
          </span>
          @if (linesCount() > 0) {
            <span class="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {{ linesCount() }} {{ linesCount() === 1 ? 'line' : 'lines' }} &middot; {{ charCount() }} chars
            </span>
          }
        </div>

        <div class="flex items-center gap-2">
          <app-copy-button [text]="value()" />
          @if (downloadable()) {
            <app-download-button
              [content]="value()"
              [filename]="filename()"
              [mimeType]="mimeType()"
            />
          }
        </div>
      </div>

      <!-- Textarea / Output Display -->
      <div class="relative flex-1 min-h-[280px]">
        @if (!value()) {
          <div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 dark:text-slate-600">
            <app-icon name="code" [size]="28" className="mb-2 opacity-50" />
            <p class="text-xs font-mono">{{ placeholder() }}</p>
          </div>
        }
        <textarea
          [value]="value()"
          readonly
          aria-readonly="true"
          [rows]="rows()"
          [attr.aria-label]="label()"
          class="w-full h-full min-h-[280px] p-4 font-mono text-sm leading-relaxed bg-slate-50/30 dark:bg-slate-950/40 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 border-none outline-none resize-none focus:ring-0 cursor-text select-text"
          spellcheck="false"
        ></textarea>
      </div>
    </div>
  `
})
export class ToolOutputComponent {
  public readonly label = input<string>('Output');
  public readonly value = input<string>('');
  public readonly placeholder = input<string>('Output will appear here...');
  public readonly rows = input<number>(12);
  public readonly downloadable = input<boolean>(true);
  public readonly filename = input<string>('output.txt');
  public readonly mimeType = input<string>('text/plain;charset=utf-8');

  protected readonly linesCount = computed(() => {
    const val = this.value();
    if (!val) return 0;
    return val.split('\n').length;
  });

  protected readonly charCount = computed(() => {
    return this.value().length;
  });
}

