import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FavoritesService } from '../../../core/services/favorites.service';
import { ToolMetadata } from '../../../core/models/tool.model';
import { AppIconComponent } from '../app-icon/app-icon.component';

@Component({
  selector: 'app-tool-card',
  standalone: true,
  imports: [RouterLink, AppIconComponent],
  template: `
    <div
      class="group relative flex flex-col justify-between p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-400 dark:hover:border-primary-600 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <div>
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-500 dark:text-primary-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <app-icon [name]="tool().icon" [size]="20" />
          </div>

          <button
            type="button"
            (click)="toggleFavorite($event)"
            class="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
            [class.text-amber-500]="isFavorite()"
            [title]="isFavorite() ? 'Remove from favorites' : 'Add to favorites'"
            [attr.aria-label]="isFavorite() ? 'Remove ' + tool().name + ' from favorites' : 'Add ' + tool().name + ' to favorites'"
          >
            <app-icon [name]="isFavorite() ? 'star-filled' : 'star'" [size]="16" />
          </button>
        </div>

        <div class="mb-2">
          <span class="inline-block text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {{ tool().category }}
          </span>
        </div>

        <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-primary-500 transition-colors">
          {{ tool().name }}
        </h3>

        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
          {{ tool().description }}
        </p>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-medium text-primary-500 group-hover:text-primary-600 dark:group-hover:text-primary-400">
        <span>Launch utility</span>
        <app-icon name="chevron-right" [size]="14" className="transform group-hover:translate-x-1 transition-transform" />
      </div>

      <!-- Entire card clickable overlay -->
      <a [routerLink]="tool().route" class="absolute inset-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" [attr.aria-label]="tool().name"></a>
    </div>
  `
})
export class ToolCardComponent {
  public readonly tool = input.required<ToolMetadata>();
  private readonly favoritesService = inject(FavoritesService);

  public isFavorite(): boolean {
    return this.favoritesService.isFavorite(this.tool().id);
  }

  public toggleFavorite(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.favoritesService.toggleFavorite(this.tool().id);
  }
}

