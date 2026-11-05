import { Component, computed, inject, signal } from '@angular/core';
import { ToolRegistryService } from '../../core/services/tool-registry.service';
import { ToolCategory, ToolMetadata } from '../../core/models/tool.model';
import { ToolCardComponent } from '../../shared/components/tool-card/tool-card.component';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-all-tools',
  standalone: true,
  imports: [ToolCardComponent, AppIconComponent, EmptyStateComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <!-- Title & Search Bar -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            All Developer Utilities
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse our full catalog of {{ toolRegistry.tools().length }} privacy-first in-browser developer tools.
          </p>
        </div>

        <div class="w-full md:w-80">
          <div class="relative flex items-center">
            <app-icon name="search" [size]="16" className="absolute left-3.5 text-slate-400" />
            <input
              type="text"
              [value]="searchQuery()"
              (input)="onSearchChange($event)"
              placeholder="Filter utilities..."
              aria-label="Filter utilities"
              class="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-xs"
            />
          </div>
        </div>
      </div>

      <!-- Category Filter Pills -->
      <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          (click)="selectedCategory.set('all')"
          class="px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shadow-xs"
          [class]="selectedCategory() === 'all'
            ? 'bg-primary-500 text-white'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'"
        >
          All Categories ({{ toolRegistry.tools().length }})
        </button>

        @for (cat of toolRegistry.categories(); track cat.slug) {
          <button
            type="button"
            (click)="selectedCategory.set(cat.name)"
            class="px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shadow-xs"
            [class]="selectedCategory() === cat.name
              ? 'bg-primary-500 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'"
          >
            {{ cat.name }} ({{ toolRegistry.getToolsByCategory(cat.name).length }})
          </button>
        }
      </div>

      <!-- Tools Grid -->
      @if (filteredTools().length > 0) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          @for (tool of filteredTools(); track tool.id) {
            <app-tool-card [tool]="tool" />
          }
        </div>
      } @else {
        <app-empty-state
          icon="search"
          title="No utilities match your search"
          [description]="'No tools found for query &quot;' + searchQuery() + '&quot; in category &quot;' + selectedCategory() + '&quot;.'"
          actionLabel="Clear Filters"
          (actionClicked)="resetFilters()"
        />
      }
    </div>
  `
})
export class AllToolsComponent {
  public readonly toolRegistry = inject(ToolRegistryService);

  protected readonly searchQuery = signal<string>('');
  protected readonly selectedCategory = signal<ToolCategory | 'all'>('all');

  protected readonly filteredTools = computed<ToolMetadata[]>(() => {
    return this.toolRegistry.searchTools(this.searchQuery(), this.selectedCategory());
  });

  public onSearchChange(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.searchQuery.set(text);
  }

  public resetFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('all');
  }
}

