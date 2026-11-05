import { Component, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FavoritesService } from '../../core/services/favorites.service';
import { ToolRegistryService } from '../../core/services/tool-registry.service';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { BrandLogoComponent } from '../../shared/components/brand-logo/brand-logo.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AppIconComponent, BrandLogoComponent],
  styles: [`
    :host {
      display: block;
    }
  `],
  template: `
    <!-- Mobile Backdrop -->
    @if (mobileOpen()) {
      <div
        class="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
        (click)="closeMobile.emit()"
      ></div>
    }

    <!-- Sidebar Frame (Fixed on both desktop & mobile) -->
    <aside
      class="fixed inset-y-0 left-0 z-40 flex flex-col h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-200 ease-in-out"
      [class.w-64]="!collapsed()"
      [class.w-16]="collapsed()"
      [class.translate-x-0]="mobileOpen()"
      [class.-translate-x-full]="!mobileOpen()"
      [class.lg:translate-x-0]="true"
    >
      <!-- Top Brand Header Block -->
      @if (!collapsed()) {
        <div class="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <a routerLink="/dashboard" (click)="closeMobile.emit()" class="flex items-center gap-3 overflow-hidden group">
            <app-brand-logo [size]="32" />
            <div class="flex flex-col truncate">
              <span class="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">ZeroTrace Tools</span>
              <span class="text-[10px] font-mono text-primary-500 font-semibold tracking-wider uppercase">100% In-Browser</span>
            </div>
          </a>

          <!-- Desktop Collapse Button -->
          <button
            type="button"
            (click)="toggleCollapse.emit()"
            class="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Collapse sidebar (Ctrl+B)"
            aria-label="Collapse sidebar"
          >
            <app-icon name="chevron-left" [size]="16" />
          </button>

          <!-- Mobile Close Button -->
          <button
            type="button"
            (click)="closeMobile.emit()"
            class="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close navigation"
          >
            <app-icon name="x" [size]="18" />
          </button>
        </div>
      } @else {
        <!-- Collapsed Top Header: Perfectly Centered Brand Icon -->
        <div class="h-16 flex items-center justify-center border-b border-slate-200 dark:border-slate-800 shrink-0">
          <a
            routerLink="/dashboard"
            (click)="closeMobile.emit()"
            class="flex items-center justify-center p-1 rounded-xl hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
            title="ZeroTrace Tools Dashboard"
            aria-label="ZeroTrace Tools Dashboard"
          >
            <app-brand-logo [size]="34" />
          </a>
        </div>
      }

      <!-- Navigation Links Container -->
      <nav
        class="flex-1 overflow-y-auto space-y-4 text-xs"
        [class.px-3]="!collapsed()"
        [class.py-4]="!collapsed()"
        [class.px-2]="collapsed()"
        [class.py-3]="collapsed()"
      >
        <!-- Main Application Links -->
        <div class="space-y-1">
          <!-- Dashboard -->
          <a
            routerLink="/dashboard"
            [routerLinkActiveOptions]="{ exact: true }"
            routerLinkActive="bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 font-semibold shadow-xs ring-1 ring-primary-500/20"
            (click)="closeMobile.emit()"
            [class]="collapsed()
              ? 'w-10 h-10 mx-auto flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all'
              : 'flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'"
            title="Dashboard"
            aria-label="Dashboard"
          >
            <app-icon name="dashboard" [size]="18" />
            @if (!collapsed()) {
              <span>Dashboard</span>
            }
          </a>

          <!-- All Tools -->
          <a
            routerLink="/tools"
            routerLinkActive="bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 font-semibold shadow-xs ring-1 ring-primary-500/20"
            (click)="closeMobile.emit()"
            [class]="collapsed()
              ? 'w-10 h-10 mx-auto flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all'
              : 'flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'"
            [title]="'All Tools (' + toolRegistry.tools().length + ' utilities)'"
            aria-label="All Tools"
          >
            <app-icon name="tools" [size]="18" />
            @if (!collapsed()) {
              <div class="flex-1 flex items-center justify-between">
                <span>All Tools</span>
                <span class="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {{ toolRegistry.tools().length }}
                </span>
              </div>
            }
          </a>

          <!-- Favorites -->
          <a
            routerLink="/favorites"
            routerLinkActive="bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 font-semibold shadow-xs ring-1 ring-primary-500/20"
            (click)="closeMobile.emit()"
            [class]="collapsed()
              ? 'relative w-10 h-10 mx-auto flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all'
              : 'flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'"
            title="Favorites"
            aria-label="Favorites"
          >
            <app-icon name="star" [size]="18" />
            @if (!collapsed()) {
              <div class="flex-1 flex items-center justify-between">
                <span>Favorites</span>
                @if (favoritesService.favoriteCount() > 0) {
                  <span class="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                    {{ favoritesService.favoriteCount() }}
                  </span>
                }
              </div>
            } @else if (favoritesService.favoriteCount() > 0) {
              <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900"></span>
            }
          </a>
        </div>

        <!-- Divider in Collapsed Mode -->
        @if (collapsed()) {
          <div class="py-1">
            <div class="w-8 border-t border-slate-200 dark:border-slate-800 mx-auto"></div>
          </div>
        }

        <!-- Categories & Direct Tool Quicklinks -->
        <div class="space-y-4">
          @if (!collapsed()) {
            <div class="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Tool Categories
            </div>
          }

          @for (cat of toolRegistry.categories(); track cat.slug) {
            <div class="space-y-1">
              @if (!collapsed()) {
                <div class="px-3 pt-2 pb-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <app-icon [name]="cat.icon" [size]="13" className="text-slate-400" />
                  <span>{{ cat.name }}</span>
                </div>
              } @else {
                <div class="pt-1.5 pb-0.5 flex justify-center" [title]="cat.name">
                  <div class="w-5 border-t border-slate-200/60 dark:border-slate-800/80"></div>
                </div>
              }

              @for (tool of toolRegistry.getToolsByCategory(cat.name); track tool.id) {
                <a
                  [routerLink]="tool.route"
                  routerLinkActive="bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 font-semibold shadow-xs ring-1 ring-primary-500/20"
                  (click)="closeMobile.emit()"
                  [class]="collapsed()
                    ? 'w-10 h-10 mx-auto flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all'
                    : 'flex items-center gap-3 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'"
                  [title]="tool.name + ' (' + cat.name + ')'"
                  [attr.aria-label]="tool.name"
                >
                  <app-icon [name]="tool.icon" [size]="16" />
                  @if (!collapsed()) {
                    <span class="truncate">{{ tool.name }}</span>
                  }
                </a>
              }
            </div>
          }
        </div>

        <!-- Divider in Collapsed Mode -->
        @if (collapsed()) {
          <div class="py-1">
            <div class="w-8 border-t border-slate-200 dark:border-slate-800 mx-auto"></div>
          </div>
        }

        <!-- Footer / About & Privacy -->
        <div class="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
          <a
            routerLink="/about"
            routerLinkActive="bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 font-semibold shadow-xs ring-1 ring-primary-500/20"
            (click)="closeMobile.emit()"
            [class]="collapsed()
              ? 'w-10 h-10 mx-auto flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all'
              : 'flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'"
            title="About & Privacy"
            aria-label="About & Privacy"
          >
            <app-icon name="info" [size]="18" />
            @if (!collapsed()) {
              <span>About & Privacy</span>
            }
          </a>
        </div>
      </nav>

      <!-- Expand / Collapse Toggle Row (Desktop) -->
      <div class="hidden lg:block p-2 border-t border-slate-200 dark:border-slate-800 shrink-0">
        @if (!collapsed()) {
          <button
            type="button"
            (click)="toggleCollapse.emit()"
            class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-medium"
            title="Collapse sidebar (Ctrl+B)"
            aria-label="Collapse sidebar"
          >
            <div class="flex items-center gap-2.5">
              <app-icon name="chevron-left" [size]="16" />
              <span>Collapse</span>
            </div>
            <span class="text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">Ctrl+B</span>
          </button>
        } @else {
          <button
            type="button"
            (click)="toggleCollapse.emit()"
            class="w-10 h-10 mx-auto flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Expand sidebar (Ctrl+B)"
            aria-label="Expand sidebar"
          >
            <app-icon name="chevron-right" [size]="18" />
          </button>
        }
      </div>

      <!-- Bottom Sandbox Guarantee Footer -->
      <div class="p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 shrink-0">
        @if (!collapsed()) {
          <div class="flex items-center gap-2 px-2 py-1 text-[11px] text-slate-500 dark:text-slate-400">
            <app-icon name="shield" [size]="14" className="text-emerald-500 shrink-0" />
            <span class="truncate">Zero server calls. 100% Client-Side.</span>
          </div>
        } @else {
          <div
            class="w-10 h-10 mx-auto flex items-center justify-center text-emerald-500"
            title="Zero server calls. 100% Client-Side Sandbox."
          >
            <app-icon name="shield" [size]="16" />
          </div>
        }
      </div>
    </aside>
  `
})
export class AppSidebarComponent {
  public readonly collapsed = input<boolean>(false);
  public readonly mobileOpen = input<boolean>(false);

  public readonly toggleCollapse = output<void>();
  public readonly closeMobile = output<void>();

  public readonly toolRegistry = inject(ToolRegistryService);
  public readonly favoritesService = inject(FavoritesService);
}
