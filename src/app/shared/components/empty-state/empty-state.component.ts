import { Component, input, output } from '@angular/core';
import { AppIconComponent } from '../app-icon/app-icon.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [AppIconComponent],
  template: `
    <div class="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
      <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">
        <app-icon [name]="icon()" [size]="24" />
      </div>
      <h3 class="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
        {{ title() }}
      </h3>
      <p class="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-5">
        {{ description() }}
      </p>
      @if (actionLabel()) {
        <button
          type="button"
          (click)="actionClicked.emit()"
          class="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
        >
          {{ actionLabel() }}
        </button>
      }
    </div>
  `
})
export class EmptyStateComponent {
  public readonly icon = input<string>('search');
  public readonly title = input.required<string>();
  public readonly description = input.required<string>();
  public readonly actionLabel = input<string>('');
  public readonly actionClicked = output<void>();
}

