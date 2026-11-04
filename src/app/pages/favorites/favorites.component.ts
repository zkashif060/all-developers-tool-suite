import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FavoritesService } from '../../core/services/favorites.service';
import { ToolCardComponent } from '../../shared/components/tool-card/tool-card.component';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [ToolCardComponent, AppIconComponent, EmptyStateComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div class="flex items-center gap-2">
            <app-icon name="star-filled" [size]="22" className="text-amber-500" />
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Your Favorite Tools
            </h1>
          </div>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Fast access to your bookmarked utilities. Saved securely in your browser's local storage.
          </p>
        </div>

        @if (favoritesService.favoriteTools().length > 0) {
          <button
            type="button"
            (click)="favoritesService.clearAllFavorites()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors self-start sm:self-auto"
          >
            <app-icon name="trash" [size]="14" />
            <span>Clear All Favorites</span>
          </button>
        }
      </div>

      <!-- Favorites Grid -->
      @if (favoritesService.favoriteTools().length > 0) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          @for (tool of favoritesService.favoriteTools(); track tool.id) {
            <app-tool-card [tool]="tool" />
          }
        </div>
      } @else {
        <app-empty-state
          icon="star"
          title="No favorite utilities yet"
          description="Click the star icon on any tool card or workbench to bookmark it here for quick access."
          actionLabel="Explore All Tools"
          (actionClicked)="goToAllTools()"
        />
      }
    </div>
  `
})
export class FavoritesComponent {
  public readonly favoritesService = inject(FavoritesService);
  private readonly router = inject(Router);

  public goToAllTools(): void {
    this.router.navigateByUrl('/tools');
  }
}
