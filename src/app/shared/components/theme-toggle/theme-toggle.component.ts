import { Component, inject } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';
import { AppIconComponent } from '../app-icon/app-icon.component';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [AppIconComponent],
  template: `
    <div
      role="radiogroup"
      aria-label="Color theme switcher"
      class="inline-flex items-center p-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-2xs transition-colors shrink-0"
    >
      <!-- Light Theme Option -->
      <button
        type="button"
        role="radio"
        [attr.aria-checked]="themeService.currentTheme() === 'light'"
        (click)="themeService.setTheme('light')"
        [class]="themeService.currentTheme() === 'light'
          ? 'flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 text-amber-500 dark:text-amber-400 shadow-xs ring-1 ring-slate-900/5 dark:ring-white/10 transition-all'
          : 'flex items-center gap-1.5 px-2 sm:px-2.5 py-1 text-xs font-medium rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all'"
        title="Light theme"
        aria-label="Switch to light theme"
      >
        <app-icon name="sun" [size]="14" className="shrink-0" />
        <span class="hidden sm:inline">Light</span>
      </button>

      <!-- Dark Theme Option -->
      <button
        type="button"
        role="radio"
        [attr.aria-checked]="themeService.currentTheme() === 'dark'"
        (click)="themeService.setTheme('dark')"
        [class]="themeService.currentTheme() === 'dark'
          ? 'flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900 text-primary-400 shadow-xs ring-1 ring-white/10 transition-all'
          : 'flex items-center gap-1.5 px-2 sm:px-2.5 py-1 text-xs font-medium rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all'"
        title="Dark theme"
        aria-label="Switch to dark theme"
      >
        <app-icon name="moon" [size]="14" className="shrink-0" />
        <span class="hidden sm:inline">Dark</span>
      </button>

      <!-- System / Auto Option -->
      <button
        type="button"
        role="radio"
        [attr.aria-checked]="themeService.currentTheme() === 'system'"
        (click)="themeService.setTheme('system')"
        [class]="themeService.currentTheme() === 'system'
          ? 'flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs ring-1 ring-slate-900/5 dark:ring-white/10 transition-all'
          : 'flex items-center gap-1.5 px-2 sm:px-2.5 py-1 text-xs font-medium rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all'"
        title="Auto (matches system preference)"
        aria-label="Switch to system theme"
      >
        <app-icon name="monitor" [size]="14" className="shrink-0" />
        <span class="hidden sm:inline">Auto</span>
      </button>
    </div>
  `
})
export class ThemeToggleComponent {
  public readonly themeService = inject(ThemeService);
}
