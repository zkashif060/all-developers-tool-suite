import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolRegistryService } from '../../core/services/tool-registry.service';
import { RecentToolsService } from '../../core/services/recent-tools.service';
import { ToolMetadata } from '../../core/models/tool.model';
import { ToolPageLayoutComponent } from '../../shared/components/tool-page-layout/tool-page-layout.component';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { CopyButtonComponent } from '../../shared/components/copy-button/copy-button.component';
import { DownloadButtonComponent } from '../../shared/components/download-button/download-button.component';
import { JsonTreeNodeComponent } from './json-tree-node.component';
import {
  parseAndBuildTree,
  filterTree,
  setTreeExpansion,
  JsonTreeNode,
  JSON_TREE_SAMPLES
} from './json-tree-viewer.engine';

@Component({
  selector: 'app-json-tree-viewer',
  standalone: true,
  imports: [
    FormsModule,
    ToolPageLayoutComponent,
    AppIconComponent,
    CopyButtonComponent,
    DownloadButtonComponent,
    JsonTreeNodeComponent
  ],
  template: `
    @if (tool(); as t) {
      <app-tool-page-layout [tool]="t">
        <div class="flex flex-col gap-6">
          <!-- Toolbar & Presets -->
          <div class="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Sample Payloads:</span>
              <button
                type="button"
                (click)="loadSample('githubRepo')"
                class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                GitHub Repo API
              </button>
              <button
                type="button"
                (click)="loadSample('ecommerceCatalog')"
                class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Product Catalog & Variants
              </button>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="prettifyJson()"
                [disabled]="!inputJson().trim()"
                class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 transition-colors"
              >
                Prettify
              </button>
              <button
                type="button"
                (click)="clearAll()"
                class="px-2.5 py-1 text-xs font-medium rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          <!-- Dual Monospace Panes -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Left Pane: Raw JSON Input -->
            <div class="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <div class="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span class="flex items-center gap-2">
                  <app-icon name="code" [size]="14" />
                  RAW JSON INPUT
                </span>
                <span class="text-slate-400 font-mono text-[11px]">{{ inputJson().length }} chars</span>
              </div>
              <textarea
                [(ngModel)]="inputJson"
                rows="24"
                placeholder="Paste JSON object or array here to inspect tree..."
                class="w-full p-4 font-mono text-xs leading-relaxed bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none resize-y"
              ></textarea>
            </div>

            <!-- Right Pane: Interactive JSON Tree Viewer -->
            <div class="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <!-- Tree Header Bar & Filter Controls -->
              <div class="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs">
                <!-- Search Filter & Expansion Actions -->
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="relative flex-1 min-w-[180px]">
                    <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <app-icon name="search" [size]="13" />
                    </div>
                    <input
                      type="text"
                      [(ngModel)]="searchFilter"
                      (ngModelChange)="onFilterChange($event)"
                      placeholder="Filter by key, value, or path..."
                      class="w-full pl-8 pr-7 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    @if (searchFilter().trim()) {
                      <button
                        type="button"
                        (click)="clearFilter()"
                        class="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        <app-icon name="x" [size]="12" />
                      </button>
                    }
                  </div>

                  <!-- Expansion Controls -->
                  <div class="flex items-center gap-1">
                    <button
                      type="button"
                      (click)="expandAll()"
                      class="px-2 py-1 text-[11px] font-medium rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      title="Expand All Nodes"
                    >
                      Expand All
                    </button>
                    <button
                      type="button"
                      (click)="collapseAll()"
                      class="px-2 py-1 text-[11px] font-medium rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      title="Collapse All Nodes"
                    >
                      Collapse All
                    </button>
                    <select
                      (change)="onDepthChange($event)"
                      class="px-2 py-1 text-[11px] font-medium rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="1">Depth 1</option>
                      <option value="2" selected>Depth 2</option>
                      <option value="3">Depth 3</option>
                      <option value="4">Depth 4</option>
                      <option value="99">Depth All</option>
                    </select>
                  </div>
                </div>

                <!-- Breadcrumb Path Inspector & Matches Indicator -->
                <div class="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div class="flex items-center gap-1.5 overflow-hidden">
                    <span class="text-slate-400 font-semibold flex-shrink-0">Selected Path:</span>
                    <span class="font-mono text-primary font-bold truncate select-text">{{ activePath() }}</span>
                  </div>
                  @if (matchCount() > 0) {
                    <span class="flex-shrink-0 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold text-[10px]">
                      {{ matchCount() }} {{ matchCount() === 1 ? 'match' : 'matches' }}
                    </span>
                  }
                </div>
              </div>

              <!-- Tree Display Container -->
              <div class="relative flex-1 p-3 overflow-auto max-h-[600px] bg-slate-50/30 dark:bg-slate-950/30">
                @if (treeResult().error; as err) {
                  <div class="p-4 m-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-mono">
                    <div class="font-bold flex items-center gap-1.5 mb-1">
                      <app-icon name="alert-circle" [size]="14" />
                      JSON Syntax Error
                    </div>
                    <span>{{ err }}</span>
                  </div>
                } @else if (rootNode(); as root) {
                  <app-json-tree-node
                    [node]="root"
                    (selectPath)="onPathSelected($event)"
                    (copiedNotification)="onNotification($event)"
                  />
                } @else {
                  <div class="py-16 text-center text-xs text-slate-400 italic">
                    Paste valid JSON on the left to explore the interactive node tree.
                  </div>
                }
              </div>

              <!-- Footer Status Metrics -->
              @if (treeResult().root) {
                <div class="flex items-center justify-between px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-mono bg-slate-50/50 dark:bg-slate-900/50">
                  <span>Total Nodes: <strong class="text-slate-700 dark:text-slate-300">{{ treeResult().totalNodes }}</strong></span>
                  <span>Max Depth: <strong class="text-slate-700 dark:text-slate-300">{{ treeResult().maxTreeDepth }}</strong></span>
                  <div class="flex items-center gap-2">
                    <app-copy-button [text]="activePath()" label="Copy Path" />
                    <app-download-button [content]="inputJson()" filename="tree-payload.json" label="Download JSON" />
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </app-tool-page-layout>
    }
  `
})
export class JsonTreeViewerComponent implements OnInit {
  private readonly toolRegistry = inject(ToolRegistryService);
  private readonly recentToolsService = inject(RecentToolsService);

  public readonly tool = signal<ToolMetadata | undefined>(
    this.toolRegistry.getToolById('json-tree-viewer')
  );

  public readonly inputJson = signal<string>(JSON_TREE_SAMPLES['githubRepo'].json);
  public readonly searchFilter = signal<string>('');
  public readonly activePath = signal<string>('$');
  public readonly matchCount = signal<number>(0);
  public readonly currentDepth = signal<number>(2);
  public readonly toastMessage = signal<string | null>(null);

  public readonly treeResult = computed(() => {
    return parseAndBuildTree(this.inputJson(), this.currentDepth());
  });

  public readonly rootNode = computed(() => this.treeResult().root);

  public ngOnInit(): void {
    this.recentToolsService.recordUsage('json-tree-viewer');
  }

  public onFilterChange(query: string): void {
    const root = this.rootNode();
    if (root) {
      const res = filterTree(root, query);
      this.matchCount.set(res.matchesCount);
    }
  }

  public clearFilter(): void {
    this.searchFilter.set('');
    this.onFilterChange('');
  }

  public onDepthChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const depth = parseInt(target.value, 10);
    this.currentDepth.set(depth);
    const root = this.rootNode();
    if (root) {
      setTreeExpansion(root, true, depth);
    }
  }

  public expandAll(): void {
    const root = this.rootNode();
    if (root) {
      setTreeExpansion(root, true);
    }
  }

  public collapseAll(): void {
    const root = this.rootNode();
    if (root) {
      setTreeExpansion(root, false);
      root.isExpanded = true; // keep root visible
    }
  }

  public onPathSelected(path: string): void {
    this.activePath.set(path);
  }

  public onNotification(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 2500);
  }

  public loadSample(key: 'githubRepo' | 'ecommerceCatalog'): void {
    this.inputJson.set(JSON_TREE_SAMPLES[key].json);
    this.activePath.set('$');
    this.searchFilter.set('');
  }

  public prettifyJson(): void {
    try {
      const parsed = JSON.parse(this.inputJson());
      this.inputJson.set(JSON.stringify(parsed, null, 2));
    } catch {
      // Keep as is if invalid
    }
  }

  public clearAll(): void {
    this.inputJson.set('');
    this.activePath.set('$');
    this.matchCount.set(0);
  }
}
