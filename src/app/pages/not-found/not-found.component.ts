import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, AppIconComponent],
  template: `
    <div class="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div class="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-500 flex items-center justify-center mb-6 shadow-sm border border-primary-100 dark:border-primary-900/40">
        <app-icon name="alert-circle" [size]="32" />
      </div>
      <h1 class="text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">404</h1>
      <p class="text-lg font-semibold text-slate-700 dark:text-slate-300 mt-2">Tool Not Found</p>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
        The developer utility you are looking for does not exist or has been relocated.
      </p>
      <div class="mt-6 flex items-center gap-3">
        <a
          routerLink="/dashboard"
          class="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-sm transition-colors"
        >
          <span>Return to Dashboard</span>
          <app-icon name="chevron-right" [size]="14" />
        </a>
        <a
          routerLink="/tools"
          class="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg shadow-xs transition-colors"
        >
          <span>Browse All Tools</span>
        </a>
      </div>
    </div>
  `
})
export class NotFoundComponent {}

