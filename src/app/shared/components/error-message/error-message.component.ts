import { Component, input, output } from '@angular/core';
import { AppIconComponent } from '../app-icon/app-icon.component';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [AppIconComponent],
  template: `
    @if (message()) {
      <div class="rounded-lg p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300 transition-all">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 mt-0.5 text-red-500">
            <app-icon name="alert-circle" [size]="18" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                {{ title() || 'Error' }}
              </span>
              @if (line() !== undefined && column() !== undefined) {
                <span class="text-xs px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/60 font-mono text-red-700 dark:text-red-300">
                  Line {{ line() }}, Col {{ column() }}
                </span>
              }
            </div>
            <p class="text-sm mt-1 font-mono break-words leading-relaxed">
              {{ message() }}
            </p>
          </div>
          @if (dismissible()) {
            <button
              type="button"
              (click)="dismissed.emit()"
              class="flex-shrink-0 text-red-400 hover:text-red-600 dark:hover:text-red-200 p-1 rounded-md"
              aria-label="Dismiss error"
            >
              <app-icon name="x" [size]="14" />
            </button>
          }
        </div>
      </div>
    }
  `
})
export class ErrorMessageComponent {
  public readonly title = input<string>('Parsing Error');
  public readonly message = input<string | null | undefined>('');
  public readonly line = input<number | undefined>(undefined);
  public readonly column = input<number | undefined>(undefined);
  public readonly dismissible = input<boolean>(false);
  public readonly dismissed = output<void>();
}

