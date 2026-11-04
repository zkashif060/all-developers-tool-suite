import { Component, ElementRef, HostListener, ViewChild, effect, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ToolRegistryService } from '../../../core/services/tool-registry.service';
import { ToolMetadata } from '../../../core/models/tool.model';
import { AppIconComponent } from '../app-icon/app-icon.component';

@Component({
  selector: 'app-tool-search',
  standalone: true,
  imports: [AppIconComponent],
  template: `
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm animate-fadeIn"
        (click)="closeOnBackdrop($event)"
        role="dialog"
        aria-modal="true"
        aria-label="Tool Search Palette"
      >
        <div
          class="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scaleUp"
          (click)="$event.stopPropagation()"
        >
          <!-- Search Header Input -->
          <div class="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
            <app-icon name="search" [size]="20" className="text-slate-400 mr-3 flex-shrink-0" />
            <input
              #searchInput
              type="text"
              [value]="query()"
              (input)="onQueryChange($event)"
              (keydown)="onKeydown($event)"
              placeholder="Search all 12 tools by name, description, keyword..."
              class="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border-none outline-none text-base"
              spellcheck="false"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded="true"
              aria-controls="search-results-list"
              aria-label="Search all 12 tools"
            />
            <kbd class="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
              ESC
            </kbd>
          </div>

          <!-- Results List -->
          <div id="search-results-list" role="listbox" class="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
            @if (filteredTools().length > 0) {
              <div class="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500" role="presentation">
                Matching Tools ({{ filteredTools().length }})
              </div>
              @for (tool of filteredTools(); track tool.id; let idx = $index) {
                <div
                  role="option"
                  [attr.aria-selected]="selectedIndex() === idx"
                  (click)="selectTool(tool)"
                  (mouseenter)="selectedIndex.set(idx)"
                  class="flex items-center gap-3.5 px-3 py-2.5 rounded-xl cursor-pointer transition-colors"
                  [class]="selectedIndex() === idx
                    ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-900 dark:text-primary-100'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'"
                >
                  <div
                    class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    [class]="selectedIndex() === idx
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'"
                  >
                    <app-icon [name]="tool.icon" [size]="18" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-sm">{{ tool.name }}</span>
                      <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {{ tool.category }}
                      </span>
                    </div>
                    <p class="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {{ tool.description }}
                    </p>
                  </div>
                  <app-icon name="chevron-right" [size]="14" className="text-slate-400 flex-shrink-0" />
                </div>
              }
            } @else {
              <div class="py-12 text-center">
                <app-icon name="search" [size]="28" className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p class="text-sm font-medium text-slate-700 dark:text-slate-300">No tools found</p>
                <p class="text-xs text-slate-400 mt-0.5">No utility matches "{{ query() }}". Try searching for "json", "jwt", or "uuid".</p>
              </div>
            }
          </div>

          <!-- Search Footer -->
          <div class="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-[11px] text-slate-400">
            <div class="flex items-center gap-3">
              <span><kbd class="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">↑↓</kbd> Navigate</span>
              <span><kbd class="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">Enter</kbd> Open</span>
            </div>
            <span>ZeroTrace Tools</span>
          </div>
        </div>
      </div>
    }
  `
})
export class ToolSearchComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly closed = output<void>();

  @ViewChild('searchInput') searchInputElement?: ElementRef<HTMLInputElement>;

  private readonly toolRegistry = inject(ToolRegistryService);
  private readonly router = inject(Router);

  protected readonly query = signal<string>('');
  protected readonly selectedIndex = signal<number>(0);

  protected readonly filteredTools = signal<ToolMetadata[]>(this.toolRegistry.tools());

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.query.set('');
        this.filteredTools.set(this.toolRegistry.tools());
        this.selectedIndex.set(0);
        setTimeout(() => {
          this.searchInputElement?.nativeElement.focus();
        }, 50);
      }
    });
  }

  @HostListener('window:keydown', ['$event'])
  public handleGlobalShortcut(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      // If parent controls isOpen, this component emits or toggles
      if (!this.isOpen()) {
        // Will be triggered by parent or local state
      }
    }
  }

  public open(): void {
    this.query.set('');
    this.filteredTools.set(this.toolRegistry.tools());
    this.selectedIndex.set(0);
    setTimeout(() => {
      this.searchInputElement?.nativeElement.focus();
    }, 50);
  }

  public onQueryChange(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.query.set(text);
    this.filteredTools.set(this.toolRegistry.searchTools(text));
    this.selectedIndex.set(0);
  }

  public onKeydown(event: KeyboardEvent): void {
    const list = this.filteredTools();
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closed.emit();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedIndex.update(i => (i + 1) % (list.length || 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedIndex.update(i => (i - 1 + list.length) % (list.length || 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (list.length > 0) {
        this.selectTool(list[this.selectedIndex()]);
      }
    }
  }

  public selectTool(tool: ToolMetadata): void {
    this.closed.emit();
    this.router.navigateByUrl(tool.route);
  }

  public closeOnBackdrop(event: MouseEvent): void {
    this.closed.emit();
  }
}

