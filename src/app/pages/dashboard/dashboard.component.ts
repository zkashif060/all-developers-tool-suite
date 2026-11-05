import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToolRegistryService } from '../../core/services/tool-registry.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { RecentToolsService } from '../../core/services/recent-tools.service';
import { ToolCategory, ToolMetadata } from '../../core/models/tool.model';
import { ToolCardComponent } from '../../shared/components/tool-card/tool-card.component';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, ToolCardComponent, AppIconComponent, EmptyStateComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <!-- Hero Welcome Banner -->
      <section class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-900 text-white p-6 sm:p-10 shadow-lg">
        <div class="relative z-10 max-w-2xl space-y-3">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide uppercase">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>100% Client-Side Suite</span>
          </div>

          <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight">
            ZeroTrace Tools
          </h1>

          <p class="text-slate-100 text-sm sm:text-base leading-relaxed opacity-95">
            A fast, private, browser-based suite of {{ toolRegistry.tools().length }} developer utilities. Format, convert, encode, and test without your sensitive data ever leaving your machine.
          </p>

          <!-- Interactive Search Bar inside Hero -->
          <div class="pt-2 max-w-lg">
            <div class="relative flex items-center">
              <app-icon name="search" [size]="18" className="absolute left-3.5 text-slate-400" />
              <input
                type="text"
                [value]="searchQuery()"
                (input)="onSearchChange($event)"
                placeholder="Find a tool (e.g. JSON, JWT, Regex, Base64)..."
                aria-label="Find a developer utility"
                class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all"
              />
            </div>
          </div>
        </div>

        <!-- Decorative background elements -->
        <div class="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none"></div>
      </section>

      <!-- Search Results Grid (when user types query) -->
      @if (searchQuery().trim()) {
        <section class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Search Results</span>
              <span class="text-xs font-mono font-normal text-slate-500">({{ searchResults().length }} found)</span>
            </h2>
            <button
              type="button"
              (click)="clearSearch()"
              class="text-xs font-medium text-primary-500 hover:text-primary-600"
            >
              Clear Search
            </button>
          </div>

          @if (searchResults().length > 0) {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              @for (tool of searchResults(); track tool.id) {
                <app-tool-card [tool]="tool" />
              }
            </div>
          } @else {
            <app-empty-state
              icon="search"
              title="No utilities found"
              [description]="'No tool matched &quot;' + searchQuery() + '&quot;. Try searching for JSON, CSV, Base64, or UUID.'"
              actionLabel="Reset Search"
              (actionClicked)="clearSearch()"
            />
          }
        </section>
      }

      <!-- Quick Access: Favorite Tools -->
      @if (favoritesService.favoriteTools().length > 0 && !searchQuery().trim()) {
        <section class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <app-icon name="star-filled" [size]="18" className="text-amber-500" />
              <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100">Starred Favorites</h2>
            </div>
            <a routerLink="/favorites" class="text-xs font-semibold text-primary-500 hover:text-primary-600">
              Manage Favorites &rarr;
            </a>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            @for (tool of favoritesService.favoriteTools(); track tool.id) {
              <app-tool-card [tool]="tool" />
            }
          </div>
        </section>
      }

      <!-- Quick Access: Recently Used Tools -->
      @if (recentToolsService.recentTools().length > 0 && !searchQuery().trim()) {
        <section class="space-y-4">
          <div class="flex items-center gap-2">
            <app-icon name="clock" [size]="18" className="text-primary-500" />
            <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100">Recently Accessed</h2>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            @for (tool of recentToolsService.recentTools(); track tool.id) {
              <a
                [routerLink]="tool.route"
                class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-400 dark:hover:border-primary-600 transition-all shadow-xs group"
              >
                <div class="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-500 dark:text-primary-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <app-icon [name]="tool.icon" [size]="16" />
                </div>
                <div class="min-w-0">
                  <div class="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-primary-500 transition-colors">
                    {{ tool.name }}
                  </div>
                  <div class="text-[10px] text-slate-400 truncate">{{ tool.category }}</div>
                </div>
              </a>
            }
          </div>
        </section>
      }

      <!-- Popular Developer Utilities -->
      @if (!searchQuery().trim()) {
        <section class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <app-icon name="sparkles" [size]="18" className="text-primary-500" />
              <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100">Popular Tools</h2>
            </div>
            <a routerLink="/tools" class="text-xs font-semibold text-primary-500 hover:text-primary-600">
              View All {{ toolRegistry.tools().length }} Tools &rarr;
            </a>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            @for (tool of toolRegistry.popularTools(); track tool.id) {
              <app-tool-card [tool]="tool" />
            }
          </div>
        </section>
      }

      <!-- All Tools Grouped by Categories -->
      @if (!searchQuery().trim()) {
        <section class="space-y-8">
          <div class="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">
              All Developer Utilities by Category
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select any of the {{ toolRegistry.tools().length }} tools to launch its dedicated in-browser workbench.
            </p>
          </div>

          @for (cat of toolRegistry.categories(); track cat.slug) {
            <div class="space-y-4">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                  <app-icon [name]="cat.icon" [size]="15" />
                </div>
                <div>
                  <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">{{ cat.name }}</h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400">{{ cat.description }}</p>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                @for (tool of toolRegistry.getToolsByCategory(cat.name); track tool.id) {
                  <app-tool-card [tool]="tool" />
                }
              </div>
            </div>
          }
        </section>
      }
    </div>
  `
})
export class DashboardComponent {
  public readonly toolRegistry = inject(ToolRegistryService);
  public readonly favoritesService = inject(FavoritesService);
  public readonly recentToolsService = inject(RecentToolsService);

  protected readonly searchQuery = signal<string>('');

  protected readonly searchResults = computed<ToolMetadata[]>(() => {
    return this.toolRegistry.searchTools(this.searchQuery());
  });

  public onSearchChange(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.searchQuery.set(text);
  }

  public clearSearch(): void {
    this.searchQuery.set('');
  }
}

