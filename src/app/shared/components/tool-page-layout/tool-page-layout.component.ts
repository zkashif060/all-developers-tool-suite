import { Component, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FavoritesService } from '../../../core/services/favorites.service';
import { SeoService } from '../../../core/services/seo.service';
import { ToolMetadata } from '../../../core/models/tool.model';
import { AppIconComponent } from '../app-icon/app-icon.component';

@Component({
  selector: 'app-tool-page-layout',
  standalone: true,
  imports: [RouterLink, AppIconComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <!-- Breadcrumb Navigation -->
      <nav class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 overflow-x-auto whitespace-nowrap py-1">
        <a routerLink="/dashboard" class="hover:text-primary-500 transition-colors">Dashboard</a>
        <app-icon name="chevron-right" [size]="12" />
        <a routerLink="/tools" class="hover:text-primary-500 transition-colors">Tools</a>
        <app-icon name="chevron-right" [size]="12" />
        <span class="font-medium text-slate-600 dark:text-slate-300">{{ tool().category }}</span>
        <app-icon name="chevron-right" [size]="12" />
        <span class="font-semibold text-slate-900 dark:text-slate-100">{{ tool().name }}</span>
      </nav>

      <!-- Tool Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-500 dark:text-primary-400 flex items-center justify-center flex-shrink-0 shadow-sm border border-primary-100 dark:border-primary-900/40">
            <app-icon [name]="tool().icon" [size]="24" />
          </div>
          <div>
            <div class="flex items-center gap-3 flex-wrap">
              <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {{ tool().name }}
              </h1>
              <span class="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {{ tool().category }}
              </span>
            </div>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
              {{ tool().description }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            (click)="toggleFavorite()"
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[38px]"
            [class]="isFavorite()
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'"
            [attr.aria-label]="isFavorite() ? 'Remove from favorites' : 'Add to favorites'"
          >
            <app-icon [name]="isFavorite() ? 'star-filled' : 'star'" [size]="14" [className]="isFavorite() ? 'text-amber-500' : ''" />
            <span>{{ isFavorite() ? 'Favorited' : 'Add to Favorites' }}</span>
          </button>
        </div>
      </div>

      <!-- Security / Privacy Assurance Banner -->
      <div class="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs">
        <app-icon name="shield" [size]="14" className="text-emerald-500 flex-shrink-0" />
        <span><strong>100% In-Browser:</strong> Your data never leaves this device. Processing is executed entirely in your local browser sandbox.</span>
      </div>

      <!-- Slotted Tool Content -->
      <div class="space-y-6">
        <ng-content />
      </div>
    </div>
  `
})
export class ToolPageLayoutComponent {
  public readonly tool = input.required<ToolMetadata>();
  private readonly favoritesService = inject(FavoritesService);
  private readonly seoService = inject(SeoService);

  constructor() {
    effect(() => {
      const t = this.tool();
      if (t) {
        this.seoService.updateToolSeo(t);
      }
    });
  }

  public isFavorite(): boolean {
    return this.favoritesService.isFavorite(this.tool().id);
  }

  public toggleFavorite(): void {
    this.favoritesService.toggleFavorite(this.tool().id);
  }
}
