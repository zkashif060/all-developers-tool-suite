import { Component, inject, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FavoritesService } from '../../core/services/favorites.service';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { BrandLogoComponent } from '../../shared/components/brand-logo/brand-logo.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, AppIconComponent, ThemeToggleComponent, BrandLogoComponent],
  styles: [`
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 30;
    }
  `],
  template: `
    <header class="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors">
      <div class="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        <!-- Left: Mobile Menu Toggle & Brand title for mobile -->
        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="toggleSidebar.emit()"
            class="p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Toggle navigation menu"
          >
            <app-icon name="menu" [size]="20" />
          </button>

          <a routerLink="/dashboard" class="flex items-center gap-2.5 lg:hidden font-bold text-slate-900 dark:text-white group">
            <app-brand-logo [size]="28" />
            <span class="text-base tracking-tight font-semibold group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">DevTools Hub</span>
          </a>
        </div>

        <!-- Center: Global Quick Search Button -->
        <div class="flex-1 max-w-md mx-2 sm:mx-6">
          <button
            type="button"
            (click)="openSearch.emit()"
            class="w-full flex items-center justify-between px-3.5 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Open tool search palette"
          >
            <div class="flex items-center gap-2.5 truncate">
              <app-icon name="search" [size]="16" className="text-slate-400 flex-shrink-0" />
              <span class="text-xs sm:text-sm truncate">Search utilities...</span>
            </div>
            <div class="hidden sm:flex items-center gap-1 font-mono text-[10px] text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-700/60 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              <span>Ctrl</span>
              <span>K</span>
            </div>
          </button>
        </div>

        <!-- Right: Actions & Indicators -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Zero Network Verification Badge (Desktop) -->
          <div class="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Local Engine</span>
          </div>

          <!-- Favorites Access Button -->
          <a
            routerLink="/favorites"
            class="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
            title="View starred favorite utilities"
            aria-label="View starred favorite utilities"
          >
            <app-icon name="star" [size]="18" />
            @if (favoritesService.favoriteCount() > 0) {
              <span class="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {{ favoritesService.favoriteCount() }}
              </span>
            }
          </a>

          <!-- Professional Theme Switcher on the Top Right Corner -->
          <app-theme-toggle />
        </div>
      </div>
    </header>
  `
})
export class AppHeaderComponent {
  public readonly toggleSidebar = output<void>();
  public readonly openSearch = output<void>();

  public readonly favoritesService = inject(FavoritesService);
}

