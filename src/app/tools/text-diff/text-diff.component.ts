import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolRegistryService } from '../../core/services/tool-registry.service';
import { RecentToolsService } from '../../core/services/recent-tools.service';
import { ToolMetadata } from '../../core/models/tool.model';
import { ToolPageLayoutComponent } from '../../shared/components/tool-page-layout/tool-page-layout.component';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { CopyButtonComponent } from '../../shared/components/copy-button/copy-button.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import {
  DiffGranularity,
  SplitDiffRow,
  TextDiffResult,
  UnifiedDiffLine,
  computeTextDiff
} from './text-diff.engine';

@Component({
  selector: 'app-text-diff',
  standalone: true,
  imports: [
    FormsModule,
    ToolPageLayoutComponent,
    AppIconComponent,
    CopyButtonComponent,
    ErrorMessageComponent
  ],
  template: `
    @if (tool(); as t) {
      <app-tool-page-layout [tool]="t">
        <!-- Action Toolbar & Presets -->
        <div class="flex flex-col gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <!-- Top Row: Sample Presets & Primary Action -->
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Sample Diffs:</span>
              <button
                type="button"
                (click)="loadPreset('code')"
                class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Code Refactor
              </button>
              <button
                type="button"
                (click)="loadPreset('config')"
                class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                JSON Config
              </button>
              <button
                type="button"
                (click)="loadPreset('text')"
                class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Text Revision
              </button>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="swapTexts()"
                title="Swap Original and Modified texts"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <app-icon name="arrow-left-right" [size]="14" />
                <span class="hidden sm:inline">Swap Texts</span>
              </button>

              <button
                type="button"
                (click)="clearBoth()"
                class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              >
                <app-icon name="trash" [size]="14" />
                <span>Clear</span>
              </button>

              <button
                type="button"
                (click)="runDiff()"
                class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <app-icon name="git-compare" [size]="15" />
                <span>Compare Texts</span>
                <span class="hidden md:inline text-[10px] opacity-75 font-mono ml-1">(Ctrl+Enter)</span>
              </button>
            </div>
          </div>

          <!-- Bottom Row: View Options & Configuration Toggles -->
          <div class="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            <!-- View Mode Switcher -->
            <div class="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                type="button"
                (click)="viewMode.set('split')"
                [class.bg-white]="viewMode() === 'split'"
                [class.dark:bg-slate-900]="viewMode() === 'split'"
                [class.shadow-xs]="viewMode() === 'split'"
                [class.text-primary-600]="viewMode() === 'split'"
                [class.dark:text-primary-400]="viewMode() === 'split'"
                class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md text-slate-600 dark:text-slate-400 transition-all"
              >
                <app-icon name="columns" [size]="14" />
                <span>Side-by-Side (Split)</span>
              </button>

              <button
                type="button"
                (click)="viewMode.set('unified')"
                [class.bg-white]="viewMode() === 'unified'"
                [class.dark:bg-slate-900]="viewMode() === 'unified'"
                [class.shadow-xs]="viewMode() === 'unified'"
                [class.text-primary-600]="viewMode() === 'unified'"
                [class.dark:text-primary-400]="viewMode() === 'unified'"
                class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md text-slate-600 dark:text-slate-400 transition-all"
              >
                <app-icon name="list" [size]="14" />
                <span>Inline (Unified)</span>
              </button>
            </div>

            <!-- Granularity & Option Toggles -->
            <div class="flex flex-wrap items-center gap-4 text-xs">
              <div class="flex items-center gap-1.5">
                <span class="text-slate-500 dark:text-slate-400 font-medium">Highlight:</span>
                <select
                  [ngModel]="granularity()"
                  (ngModelChange)="onGranularityChange($event)"
                  aria-label="Diff highlight granularity"
                  class="px-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="words">Word Level</option>
                  <option value="chars">Character Level</option>
                  <option value="lines">Line Level Only</option>
                </select>
              </div>

              <label class="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  [ngModel]="ignoreWhitespace()"
                  (ngModelChange)="onIgnoreWhitespaceChange($event)"
                  class="rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                />
                <span>Ignore Whitespace</span>
              </label>

              <label class="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  [ngModel]="ignoreCase()"
                  (ngModelChange)="onIgnoreCaseChange($event)"
                  class="rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                />
                <span>Ignore Case</span>
              </label>

              <label class="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  [ngModel]="showLineNumbers()"
                  (ngModelChange)="showLineNumbers.set($event)"
                  class="rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                />
                <span>Line Numbers</span>
              </label>
            </div>
          </div>
        </div>

        @if (errorMessage()) {
          <app-error-message
            title="Comparison Error"
            [message]="errorMessage()!"
            [dismissible]="true"
            (dismissed)="errorMessage.set(null)"
          />
        }

        <!-- Dual Input Editors (Collapsible Section) -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <button
              type="button"
              (click)="isInputPanelOpen.set(!isInputPanelOpen())"
              class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            >
              <app-icon [name]="isInputPanelOpen() ? 'chevron-left' : 'chevron-right'" [size]="14" [className]="isInputPanelOpen() ? '-rotate-90 transform' : 'rotate-90 transform'" />
              <span>{{ isInputPanelOpen() ? 'Collapse Input Textareas' : 'Expand Input Textareas' }}</span>
            </button>
            <span class="text-[11px] text-slate-400">
              Original: {{ originalLineCount() }} lines &middot; Modified: {{ modifiedLineCount() }} lines
            </span>
          </div>

          @if (isInputPanelOpen()) {
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <!-- Left Input: Original Text -->
              <div class="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
                <div class="flex items-center justify-between px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Original Text (Before)
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <label class="cursor-pointer text-[11px] font-medium text-slate-500 hover:text-primary-500 flex items-center gap-1">
                      <app-icon name="download" [size]="12" className="rotate-180" />
                      <span>Upload</span>
                      <input type="file" (change)="onFileUpload($event, 'original')" class="hidden" accept=".txt,.json,.js,.ts,.html,.css,.md,.xml,.csv,.env,.yml,.yaml" />
                    </label>
                    <button
                      type="button"
                      (click)="originalText.set(''); runDiff()"
                      class="text-[11px] font-medium text-slate-500 hover:text-rose-500"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <textarea
                  [ngModel]="originalText()"
                  (ngModelChange)="onOriginalChange($event)"
                  (keydown)="onKeyDown($event)"
                  placeholder="Paste or type original text here..."
                  rows="8"
                  aria-label="Original text input"
                  class="w-full p-3 font-mono text-xs text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none resize-y"
                ></textarea>
              </div>

              <!-- Right Input: Modified Text -->
              <div class="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
                <div class="flex items-center justify-between px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Modified Text (After)
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <label class="cursor-pointer text-[11px] font-medium text-slate-500 hover:text-primary-500 flex items-center gap-1">
                      <app-icon name="download" [size]="12" className="rotate-180" />
                      <span>Upload</span>
                      <input type="file" (change)="onFileUpload($event, 'modified')" class="hidden" accept=".txt,.json,.js,.ts,.html,.css,.md,.xml,.csv,.env,.yml,.yaml" />
                    </label>
                    <button
                      type="button"
                      (click)="modifiedText.set(''); runDiff()"
                      class="text-[11px] font-medium text-slate-500 hover:text-rose-500"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <textarea
                  [ngModel]="modifiedText()"
                  (ngModelChange)="onModifiedChange($event)"
                  (keydown)="onKeyDown($event)"
                  placeholder="Paste or type modified text here..."
                  rows="8"
                  aria-label="Modified text input"
                  class="w-full p-3 font-mono text-xs text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none resize-y"
                ></textarea>
              </div>
            </div>
          }
        </div>

        <!-- Diff Summary & Statistics Hero Card -->
        @if (diffResult(); as res) {
          <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <!-- Metric Badges -->
            <div class="flex flex-wrap items-center gap-2.5">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>+{{ res.stats.additions }} Added</span>
              </span>

              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
                <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>-{{ res.stats.deletions }} Deleted</span>
              </span>

              <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <span>{{ res.stats.unchanged }} Unchanged</span>
              </span>

              <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/50">
                <span>{{ res.stats.similarityPercentage }}% Match</span>
              </span>

              <span class="text-[11px] text-slate-400 font-mono ml-1">
                {{ res.executionTimeMs }}ms
              </span>
            </div>

            <!-- Diff Navigation & Export -->
            <div class="flex items-center gap-2">
              @if (diffRowIndices().length > 0) {
                <div class="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    (click)="jumpToDiff('prev')"
                    title="Jump to previous difference"
                    class="p-1 text-slate-600 dark:text-slate-300 hover:text-primary-500 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700"
                  >
                    <app-icon name="arrow-up" [size]="14" />
                  </button>
                  <span class="text-[11px] font-mono px-1.5 text-slate-600 dark:text-slate-300">
                    {{ currentDiffIndex() >= 0 ? currentDiffIndex() + 1 : 0 }} / {{ diffRowIndices().length }}
                  </span>
                  <button
                    type="button"
                    (click)="jumpToDiff('next')"
                    title="Jump to next difference"
                    class="p-1 text-slate-600 dark:text-slate-300 hover:text-primary-500 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700"
                  >
                    <app-icon name="arrow-down" [size]="14" />
                  </button>
                </div>
              }

              @if (res.unifiedPatch) {
                <app-copy-button [text]="res.unifiedPatch" label="Copy Patch" />
                <button
                  type="button"
                  (click)="downloadPatch(res.unifiedPatch)"
                  class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <app-icon name="download" [size]="13" />
                  <span class="hidden sm:inline">Download .diff</span>
                </button>
              }
            </div>
          </div>

          <!-- Identical Notice -->
          @if (res.stats.isIdentical) {
            <div class="p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-center space-y-2">
              <div class="inline-flex p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                <app-icon name="check-circle" [size]="32" />
              </div>
              <h3 class="text-base font-bold text-emerald-900 dark:text-emerald-200">
                Identical Texts — Zero Differences Found
              </h3>
              <p class="text-xs text-emerald-800 dark:text-emerald-400 max-w-md mx-auto">
                Both text inputs contain matching line structures and content.
              </p>
            </div>
          }

          <!-- Split View (Side-by-Side) -->
          @if (!res.stats.isIdentical && viewMode() === 'split') {
            <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <!-- Column Headers -->
              <div class="grid grid-cols-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <div class="px-4 py-2 border-r border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span class="text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider text-[11px]">Original Version</span>
                  <span class="text-[10px] text-slate-400 font-normal">{{ res.stats.totalOriginalLines }} lines</span>
                </div>
                <div class="px-4 py-2 flex items-center justify-between">
                  <span class="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[11px]">Modified Version</span>
                  <span class="text-[10px] text-slate-400 font-normal">{{ res.stats.totalModifiedLines }} lines</span>
                </div>
              </div>

              <!-- Split Rows Monospace Container -->
              <div class="overflow-x-auto max-h-[650px] font-mono text-xs leading-relaxed select-text">
                @for (row of res.splitRows; track row.id; let idx = $index) {
                  <div
                    [id]="'diff-row-' + idx"
                    [class.bg-yellow-500/10]="currentDiffIndex() === diffRowIndices().indexOf(idx) && currentDiffIndex() >= 0"
                    class="grid grid-cols-2 border-b border-slate-100/70 dark:border-slate-800/40 hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <!-- Left Side (Original) -->
                    <div
                      class="flex border-r border-slate-200 dark:border-slate-800 overflow-hidden min-h-[22px]"
                      [class.bg-rose-500/12]="row.left.type === 'deleted'"
                      [class.dark:bg-rose-500/20]="row.left.type === 'deleted'"
                      [class.border-l-2]="row.left.type === 'deleted'"
                      [class.border-l-rose-500]="row.left.type === 'deleted'"
                      [class.bg-slate-100/60]="row.left.type === 'empty'"
                      [class.dark:bg-slate-900/80]="row.left.type === 'empty'"
                    >
                      @if (showLineNumbers()) {
                        <div
                          class="w-10 sm:w-12 px-2 py-0.5 text-right font-mono text-[11px] select-none border-r border-slate-100 dark:border-slate-800 flex-shrink-0"
                          [class.text-rose-700]="row.left.type === 'deleted'"
                          [class.dark:text-rose-400]="row.left.type === 'deleted'"
                          [class.bg-rose-500/15]="row.left.type === 'deleted'"
                          [class.dark:bg-rose-950/50]="row.left.type === 'deleted'"
                          [class.text-slate-400]="row.left.type !== 'deleted'"
                          [class.dark:text-slate-600]="row.left.type !== 'deleted'"
                          [class.bg-slate-50/50]="row.left.type !== 'deleted'"
                          [class.dark:bg-slate-800/30]="row.left.type !== 'deleted'"
                        >
                          {{ row.left.lineNumber || '' }}
                        </div>
                      }
                      <div class="w-5 py-0.5 text-center font-bold select-none text-rose-600 dark:text-rose-400 flex-shrink-0">
                        {{ row.left.type === 'deleted' ? '-' : '' }}
                      </div>
                      <div class="px-2 py-0.5 flex-1 whitespace-pre-wrap break-all text-slate-800 dark:text-slate-200">
                        @if (row.left.parts) {
                          @for (p of row.left.parts; track $index) {
                            <span
                              [class.bg-rose-500/30]="p.type === 'deleted'"
                              [class.dark:bg-rose-500/40]="p.type === 'deleted'"
                              [class.text-rose-950]="p.type === 'deleted'"
                              [class.dark:text-rose-100]="p.type === 'deleted'"
                              [class.rounded-xs]="p.type === 'deleted'"
                              [class.font-semibold]="p.type === 'deleted'"
                              [class.line-through]="p.type === 'deleted'"
                              [class.decoration-rose-500/40]="p.type === 'deleted'"
                            >{{ p.text }}</span>
                          }
                        } @else if (row.left.type === 'deleted') {
                          <span class="text-rose-900 dark:text-rose-200 font-medium bg-rose-500/15 dark:bg-rose-500/25 px-1 py-0.5 rounded-xs line-through decoration-rose-500/40">{{ row.left.text }}</span>
                        } @else {
                          {{ row.left.text }}
                        }
                      </div>
                    </div>

                    <!-- Right Side (Modified) -->
                    <div
                      class="flex overflow-hidden min-h-[22px]"
                      [class.bg-emerald-500/12]="row.right.type === 'added'"
                      [class.dark:bg-emerald-500/20]="row.right.type === 'added'"
                      [class.border-l-2]="row.right.type === 'added'"
                      [class.border-l-emerald-500]="row.right.type === 'added'"
                      [class.bg-slate-100/60]="row.right.type === 'empty'"
                      [class.dark:bg-slate-900/80]="row.right.type === 'empty'"
                    >
                      @if (showLineNumbers()) {
                        <div
                          class="w-10 sm:w-12 px-2 py-0.5 text-right font-mono text-[11px] select-none border-r border-slate-100 dark:border-slate-800 flex-shrink-0"
                          [class.text-emerald-700]="row.right.type === 'added'"
                          [class.dark:text-emerald-400]="row.right.type === 'added'"
                          [class.bg-emerald-500/15]="row.right.type === 'added'"
                          [class.dark:bg-emerald-950/50]="row.right.type === 'added'"
                          [class.text-slate-400]="row.right.type !== 'added'"
                          [class.dark:text-slate-600]="row.right.type !== 'added'"
                          [class.bg-slate-50/50]="row.right.type !== 'added'"
                          [class.dark:bg-slate-800/30]="row.right.type !== 'added'"
                        >
                          {{ row.right.lineNumber || '' }}
                        </div>
                      }
                      <div class="w-5 py-0.5 text-center font-bold select-none text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                        {{ row.right.type === 'added' ? '+' : '' }}
                      </div>
                      <div class="px-2 py-0.5 flex-1 whitespace-pre-wrap break-all text-slate-800 dark:text-slate-200">
                        @if (row.right.parts) {
                          @for (p of row.right.parts; track $index) {
                            <span
                              [class.bg-emerald-500/30]="p.type === 'added'"
                              [class.dark:bg-emerald-500/40]="p.type === 'added'"
                              [class.text-emerald-950]="p.type === 'added'"
                              [class.dark:text-emerald-100]="p.type === 'added'"
                              [class.rounded-xs]="p.type === 'added'"
                              [class.font-semibold]="p.type === 'added'"
                            >{{ p.text }}</span>
                          }
                        } @else if (row.right.type === 'added') {
                          <span class="text-emerald-900 dark:text-emerald-200 font-medium bg-emerald-500/15 dark:bg-emerald-500/25 px-1 py-0.5 rounded-xs">{{ row.right.text }}</span>
                        } @else {
                          {{ row.right.text }}
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Unified View (Inline) -->
          @if (!res.stats.isIdentical && viewMode() === 'unified') {
            <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <div class="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span class="uppercase tracking-wider text-[11px]">Inline Unified Stream</span>
                <span class="text-[10px] text-slate-400 font-normal">Git Diff Unified Representation</span>
              </div>

              <!-- Unified Lines Monospace Container -->
              <div class="overflow-x-auto max-h-[650px] font-mono text-xs leading-relaxed select-text">
                @for (line of res.unifiedLines; track line.id; let idx = $index) {
                  <div
                    [id]="'unified-row-' + idx"
                    [class.bg-rose-500/12]="line.type === 'deleted'"
                    [class.dark:bg-rose-500/20]="line.type === 'deleted'"
                    [class.border-l-2]="line.type !== 'unchanged'"
                    [class.border-l-rose-500]="line.type === 'deleted'"
                    [class.bg-emerald-500/12]="line.type === 'added'"
                    [class.dark:bg-emerald-500/20]="line.type === 'added'"
                    [class.border-l-emerald-500]="line.type === 'added'"
                    class="flex border-b border-slate-100/70 dark:border-slate-800/40 hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-colors min-h-[22px]"
                  >
                    @if (showLineNumbers()) {
                      <div
                        class="w-10 sm:w-12 px-2 py-0.5 text-right font-mono text-[11px] select-none border-r border-slate-100 dark:border-slate-800 flex-shrink-0"
                        [class.text-rose-700]="line.type === 'deleted'"
                        [class.dark:text-rose-400]="line.type === 'deleted'"
                        [class.bg-rose-500/15]="line.type === 'deleted'"
                        [class.text-slate-400]="line.type !== 'deleted'"
                        [class.bg-slate-50/50]="line.type !== 'deleted'"
                        [class.dark:bg-slate-800/30]="line.type !== 'deleted'"
                      >
                        {{ line.oldLineNumber || '' }}
                      </div>
                      <div
                        class="w-10 sm:w-12 px-2 py-0.5 text-right font-mono text-[11px] select-none border-r border-slate-100 dark:border-slate-800 flex-shrink-0"
                        [class.text-emerald-700]="line.type === 'added'"
                        [class.dark:text-emerald-400]="line.type === 'added'"
                        [class.bg-emerald-500/15]="line.type === 'added'"
                        [class.text-slate-400]="line.type !== 'added'"
                        [class.bg-slate-50/50]="line.type !== 'added'"
                        [class.dark:bg-slate-800/30]="line.type !== 'added'"
                      >
                        {{ line.newLineNumber || '' }}
                      </div>
                    }

                    <!-- Marker Column -->
                    <div
                      class="w-6 py-0.5 text-center font-bold select-none flex-shrink-0"
                      [class.text-rose-600]="line.type === 'deleted'"
                      [class.dark:text-rose-400]="line.type === 'deleted'"
                      [class.text-emerald-600]="line.type === 'added'"
                      [class.dark:text-emerald-400]="line.type === 'added'"
                      [class.text-slate-300]="line.type === 'unchanged'"
                    >
                      {{ line.type === 'deleted' ? '-' : line.type === 'added' ? '+' : ' ' }}
                    </div>

                    <!-- Line Content -->
                    <div class="px-2 py-0.5 flex-1 whitespace-pre-wrap break-all text-slate-800 dark:text-slate-200">
                      @if (line.parts) {
                        @for (p of line.parts; track $index) {
                          <span
                            [class.bg-rose-500/30]="p.type === 'deleted'"
                            [class.dark:bg-rose-500/40]="p.type === 'deleted'"
                            [class.text-rose-950]="p.type === 'deleted'"
                            [class.dark:text-rose-100]="p.type === 'deleted'"
                            [class.bg-emerald-500/30]="p.type === 'added'"
                            [class.dark:bg-emerald-500/40]="p.type === 'added'"
                            [class.text-emerald-950]="p.type === 'added'"
                            [class.dark:text-emerald-100]="p.type === 'added'"
                            [class.rounded-xs]="p.type !== 'unchanged'"
                            [class.font-semibold]="p.type !== 'unchanged'"
                            [class.line-through]="p.type === 'deleted'"
                          >{{ p.text }}</span>
                        }
                      } @else if (line.type === 'added') {
                        <span class="text-emerald-900 dark:text-emerald-200 font-medium bg-emerald-500/15 dark:bg-emerald-500/25 px-1 py-0.5 rounded-xs">{{ line.text }}</span>
                      } @else if (line.type === 'deleted') {
                        <span class="text-rose-900 dark:text-rose-200 font-medium bg-rose-500/15 dark:bg-rose-500/25 px-1 py-0.5 rounded-xs line-through decoration-rose-500/40">{{ line.text }}</span>
                      } @else {
                        {{ line.text }}
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        }
      </app-tool-page-layout>
    }
  `
})
export class TextDiffComponent implements OnInit {
  private readonly toolRegistry = inject(ToolRegistryService);
  private readonly recentToolsService = inject(RecentToolsService);

  public readonly tool = signal<ToolMetadata | undefined>(
    this.toolRegistry.getToolById('text-diff')
  );

  // Text Inputs
  public readonly originalText = signal<string>('');
  public readonly modifiedText = signal<string>('');

  // Options
  public readonly viewMode = signal<'split' | 'unified'>('split');
  public readonly granularity = signal<DiffGranularity>('words');
  public readonly ignoreWhitespace = signal<boolean>(false);
  public readonly ignoreCase = signal<boolean>(false);
  public readonly showLineNumbers = signal<boolean>(true);
  public readonly isInputPanelOpen = signal<boolean>(true);

  // Results & Navigation
  public readonly diffResult = signal<TextDiffResult | null>(null);
  public readonly errorMessage = signal<string | null>(null);
  public readonly currentDiffIndex = signal<number>(-1);

  // Computed properties
  public readonly originalLineCount = computed(() => {
    const text = this.originalText();
    return text ? text.split('\n').length : 0;
  });

  public readonly modifiedLineCount = computed(() => {
    const text = this.modifiedText();
    return text ? text.split('\n').length : 0;
  });

  public readonly diffRowIndices = computed(() => {
    const res = this.diffResult();
    if (!res || res.stats.isIdentical) return [];
    const indices: number[] = [];
    res.splitRows.forEach((row, idx) => {
      if (row.isDiff) indices.push(idx);
    });
    return indices;
  });

  // Presets
  private readonly codeOriginal = `interface UserSession {
  userId: string;
  role: 'admin' | 'user';
  expiresAt: number;
}

export function validateSession(session: UserSession): boolean {
  if (!session.userId) {
    return false;
  }
  return Date.now() < session.expiresAt;
}`;

  private readonly codeModified = `interface UserSession {
  userId: string;
  tenantId: string;
  role: 'admin' | 'user' | 'guest';
  expiresAt: number;
  isRevoked?: boolean;
}

export function validateSession(session: UserSession): boolean {
  if (!session.userId || session.isRevoked) {
    return false;
  }
  const isNotExpired = Date.now() < session.expiresAt;
  return isNotExpired && Boolean(session.tenantId);
}`;

  private readonly configOriginal = `{
  "app": "ZeroTrace Tools",
  "version": "1.0.0",
  "environment": "staging",
  "features": {
    "darkMode": true,
    "analytics": false
  },
  "maxConcurrentConnections": 50
}`;

  private readonly configModified = `{
  "app": "ZeroTrace Tools",
  "version": "1.1.0",
  "environment": "production",
  "features": {
    "darkMode": true,
    "analytics": false,
    "textDiffChecker": true
  },
  "maxConcurrentConnections": 250,
  "region": "us-east-1"
}`;

  private readonly textOriginal = `ZeroTrace Tools is a private developer utility hub.
All data is sent to a remote server for processing.
The platform includes 12 developer tools.`;

  private readonly textModified = `ZeroTrace Tools is a 100% private developer utility hub.
All data remains strictly within your local browser sandbox.
The platform includes 14 precision developer tools.`;

  public ngOnInit(): void {
    this.recentToolsService.recordUsage('text-diff');
    // Load default sample on initial view
    this.loadPreset('code');
  }

  public loadPreset(type: 'code' | 'config' | 'text'): void {
    if (type === 'code') {
      this.originalText.set(this.codeOriginal);
      this.modifiedText.set(this.codeModified);
    } else if (type === 'config') {
      this.originalText.set(this.configOriginal);
      this.modifiedText.set(this.configModified);
    } else {
      this.originalText.set(this.textOriginal);
      this.modifiedText.set(this.textModified);
    }
    this.runDiff();
  }

  public swapTexts(): void {
    const orig = this.originalText();
    const mod = this.modifiedText();
    this.originalText.set(mod);
    this.modifiedText.set(orig);
    this.runDiff();
  }

  public clearBoth(): void {
    this.originalText.set('');
    this.modifiedText.set('');
    this.diffResult.set(null);
    this.errorMessage.set(null);
    this.currentDiffIndex.set(-1);
  }

  public onOriginalChange(val: string): void {
    this.originalText.set(val);
  }

  public onModifiedChange(val: string): void {
    this.modifiedText.set(val);
  }

  public onGranularityChange(granularity: DiffGranularity): void {
    this.granularity.set(granularity);
    this.runDiff();
  }

  public onIgnoreWhitespaceChange(val: boolean): void {
    this.ignoreWhitespace.set(val);
    this.runDiff();
  }

  public onIgnoreCaseChange(val: boolean): void {
    this.ignoreCase.set(val);
    this.runDiff();
  }

  public onKeyDown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.runDiff();
    }
  }

  public onFileUpload(event: Event, side: 'original' | 'modified'): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          if (side === 'original') {
            this.originalText.set(text);
          } else {
            this.modifiedText.set(text);
          }
          this.runDiff();
        }
      };
      reader.readAsText(file);
      input.value = '';
    }
  }

  public runDiff(): void {
    const orig = this.originalText();
    const mod = this.modifiedText();

    if (!orig && !mod) {
      this.diffResult.set(null);
      this.errorMessage.set(null);
      this.currentDiffIndex.set(-1);
      return;
    }

    const res = computeTextDiff(orig, mod, {
      granularity: this.granularity(),
      ignoreWhitespace: this.ignoreWhitespace(),
      ignoreCase: this.ignoreCase()
    });

    if (res.success) {
      this.diffResult.set(res);
      this.errorMessage.set(null);
      this.currentDiffIndex.set(this.diffRowIndices().length > 0 ? 0 : -1);
    } else {
      this.errorMessage.set(res.error || 'Failed to compute diff.');
      this.diffResult.set(null);
      this.currentDiffIndex.set(-1);
    }
  }

  public jumpToDiff(direction: 'next' | 'prev'): void {
    const indices = this.diffRowIndices();
    if (indices.length === 0) return;

    let cur = this.currentDiffIndex();
    if (direction === 'next') {
      cur = (cur + 1) % indices.length;
    } else {
      cur = (cur - 1 + indices.length) % indices.length;
    }
    this.currentDiffIndex.set(cur);

    const targetRowIdx = indices[cur];
    const rowId = this.viewMode() === 'split' ? `diff-row-${targetRowIdx}` : `unified-row-${targetRowIdx}`;
    const el = document.getElementById(rowId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  public downloadPatch(patchText: string): void {
    if (!patchText) return;
    const blob = new Blob([patchText], { type: 'text/x-diff;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zerotrace-changes.diff';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

