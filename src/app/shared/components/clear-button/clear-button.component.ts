import { Component, input, output } from '@angular/core';
import { AppIconComponent } from '../app-icon/app-icon.component';

@Component({
  selector: 'app-clear-button',
  standalone: true,
  imports: [AppIconComponent],
  template: `
    <button
      type="button"
      (click)="cleared.emit()"
      [disabled]="disabled()"
      class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all border shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/50 disabled:opacity-40 disabled:cursor-not-allowed"
      aria-label="Clear contents"
    >
      <app-icon name="trash" [size]="14" />
      <span>{{ label() }}</span>
    </button>
  `
})
export class ClearButtonComponent {
  public readonly label = input<string>('Clear');
  public readonly disabled = input<boolean>(false);
  public readonly cleared = output<void>();
}

