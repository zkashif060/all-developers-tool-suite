import { Component, input } from '@angular/core';
import { AppIconComponent } from '../app-icon/app-icon.component';

@Component({
  selector: 'app-download-button',
  standalone: true,
  imports: [AppIconComponent],
  template: `
    <button
      type="button"
      (click)="downloadFile()"
      [disabled]="disabled() || !content()"
      class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all border shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
      [attr.aria-label]="'Download ' + filename()"
    >
      <app-icon name="download" [size]="14" />
      <span>{{ label() }}</span>
    </button>
  `
})
export class DownloadButtonComponent {
  public readonly content = input<string>('');
  public readonly filename = input<string>('output.txt');
  public readonly mimeType = input<string>('text/plain;charset=utf-8');
  public readonly label = input<string>('Download');
  public readonly disabled = input<boolean>(false);

  public downloadFile(): void {
    const data = this.content();
    if (!data || this.disabled()) return;

    try {
      const blob = new Blob([data], { type: this.mimeType() });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.filename();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('File download failed', err);
    }
  }
}

