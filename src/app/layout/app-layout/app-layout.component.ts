import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { AppSidebarComponent } from '../app-sidebar/app-sidebar.component';
import { ToolSearchComponent } from '../../shared/components/tool-search/tool-search.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, AppHeaderComponent, AppSidebarComponent, ToolSearchComponent],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors">
      <!-- Responsive Collapsible Sidebar (Fixed on left) -->
      <app-sidebar
        [collapsed]="sidebarCollapsed()"
        [mobileOpen]="mobileNavOpen()"
        (toggleCollapse)="toggleSidebarCollapse()"
        (closeMobile)="mobileNavOpen.set(false)"
      />

      <!-- Content Column with padding offset matching fixed sidebar -->
      <div
        class="flex flex-col min-w-0 min-h-screen transition-all duration-200 ease-in-out"
        [class.lg:pl-64]="!sidebarCollapsed()"
        [class.lg:pl-16]="sidebarCollapsed()"
      >
        <!-- Top Application Header (Fixed/Sticky at the top) -->
        <app-header
          class="sticky top-0 z-30 block w-full"
          (toggleSidebar)="toggleMobileSidebar()"
          (openSearch)="searchModalOpen.set(true)"
        />

        <!-- Main Dynamic Route Viewport -->
        <main class="flex-1">
          <router-outlet />
        </main>

        <!-- Footer -->
        <footer class="border-t border-slate-200 dark:border-slate-800 py-6 px-4 sm:px-6 text-center text-xs text-slate-500 dark:text-slate-500">
          <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>&copy; 2026 ZeroTrace Tools &middot; 100% In-Browser Developer Utilities Suite.</p>
            <p class="font-mono text-[11px] text-slate-400 dark:text-slate-600">All data processing executes strictly inside your browser sandbox.</p>
          </div>
        </footer>
      </div>

      <!-- Global Tool Search Palette Dialog (Ctrl+K) -->
      <app-tool-search
        [isOpen]="searchModalOpen()"
        (closed)="searchModalOpen.set(false)"
      />
    </div>
  `
})
export class AppLayoutComponent {
  private readonly themeService = inject(ThemeService);

  protected readonly sidebarCollapsed = signal<boolean>(false);
  protected readonly mobileNavOpen = signal<boolean>(false);
  protected readonly searchModalOpen = signal<boolean>(false);

  @HostListener('window:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' || event.key === 'Esc') {
      if (this.searchModalOpen()) {
        event.preventDefault();
        event.stopPropagation();
        this.searchModalOpen.set(false);
        return;
      }
      if (this.mobileNavOpen()) {
        event.preventDefault();
        event.stopPropagation();
        this.mobileNavOpen.set(false);
        return;
      }
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.searchModalOpen.update(v => !v);
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
      event.preventDefault();
      this.toggleSidebarCollapse();
    } else if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      this.themeService.toggleDarkLight();
    }
  }

  public toggleSidebarCollapse(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  public toggleMobileSidebar(): void {
    this.mobileNavOpen.update(v => !v);
  }
}

