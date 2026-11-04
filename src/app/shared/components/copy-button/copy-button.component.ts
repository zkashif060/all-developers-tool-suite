import { Component, input, signal } from '@angular/core';
import { AppIconComponent } from '../app-icon/app-icon.component';

@Component({
  selector: 'app-copy-button',
  standalone: true,
  imports: [AppIconComponent],
  template: `
    <button
      type="button"
      (click)="copyToClipboard()"
      [disabled]="disabled() || !text()"
      class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all border shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-40 disabled:cursor-not-allowed"
      [class]="copied()
        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'"
      [attr.aria-label]="copied() ? 'Copied to clipboard' : 'Copy to clipboard'"
    >
      @if (copied()) {
        <app-icon name="check" [size]="14" className="text-emerald-500" />
        <span>Copied!</span>
      } @else {
        <app-icon name="copy" [size]="14" />
        <span>{{ label() }}</span>
      }
    </button>
  `
})
export class CopyButtonComponent {
  public readonly text = input<string>('');
  public readonly label = input<string>('Copy');
  public readonly disabled = input<boolean>(false);

  protected readonly copied = signal<boolean>(false);

  public async copyToClipboard(): Promise<void> {
    const val = this.text();
    if (!val || this.disabled()) return;

    try {
      await navigator.clipboard.writeText(val);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch (err) {
      // Fallback for older browsers / unsecured contexts
      try {
        const textarea = document.createElement('textarea');
        textarea.value = val;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      } catch (fallbackErr) {
        console.error('Failed to copy text', fallbackErr);
      }
    }
  }
}

