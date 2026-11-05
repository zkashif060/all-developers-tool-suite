import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolRegistryService } from '../../core/services/tool-registry.service';
import { RecentToolsService } from '../../core/services/recent-tools.service';
import { ToolMetadata } from '../../core/models/tool.model';
import { ToolPageLayoutComponent } from '../../shared/components/tool-page-layout/tool-page-layout.component';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { CopyButtonComponent } from '../../shared/components/copy-button/copy-button.component';
import { DownloadButtonComponent } from '../../shared/components/download-button/download-button.component';
import {
  rephraseText,
  RephraseTone,
  REPHRASE_SAMPLES
} from './text-rephraser.engine';

@Component({
  selector: 'app-text-rephraser',
  standalone: true,
  imports: [
    FormsModule,
    ToolPageLayoutComponent,
    AppIconComponent,
    CopyButtonComponent,
    DownloadButtonComponent
  ],
  template: `
    @if (tool(); as t) {
      <app-tool-page-layout [tool]="t">
        <div class="flex flex-col gap-6">
          <!-- Toolbar & Presets -->
          <div class="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Samples:</span>
              <button
                type="button"
                (click)="loadSample('technologyEssay')"
                class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Technology Essay
              </button>
              <button
                type="button"
                (click)="loadSample('businessEmail')"
                class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Client Email
              </button>
              <button
                type="button"
                (click)="loadSample('technicalSpec')"
                class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Technical Spec
              </button>
              <button
                type="button"
                (click)="loadSample('academicReport')"
                class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Research Analysis
              </button>
            </div>

            <button
              type="button"
              (click)="clearAll()"
              class="px-2.5 py-1 text-xs font-medium rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Clear
            </button>
          </div>

          <!-- Configuration Controls Bar -->
          <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-wrap items-center gap-6 text-xs">
            <!-- Tone Selector Tabs -->
            <div class="flex items-center gap-1 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                (click)="selectTone('professional')"
                class="px-3 py-1.5 rounded-md font-semibold transition-colors"
                [class.bg-white]="tone() === 'professional'"
                [class.dark:bg-slate-900]="tone() === 'professional'"
                [class.text-primary]="tone() === 'professional'"
                [class.shadow-xs]="tone() === 'professional'"
                [class.text-slate-600]="tone() !== 'professional'"
                [class.dark:text-slate-400]="tone() !== 'professional'"
              >
                Professional & Business
              </button>
              <button
                type="button"
                (click)="selectTone('concise')"
                class="px-3 py-1.5 rounded-md font-semibold transition-colors"
                [class.bg-white]="tone() === 'concise'"
                [class.dark:bg-slate-900]="tone() === 'concise'"
                [class.text-primary]="tone() === 'concise'"
                [class.shadow-xs]="tone() === 'concise'"
                [class.text-slate-600]="tone() !== 'concise'"
                [class.dark:text-slate-400]="tone() !== 'concise'"
              >
                Concise & Direct
              </button>
              <button
                type="button"
                (click)="selectTone('technical')"
                class="px-3 py-1.5 rounded-md font-semibold transition-colors"
                [class.bg-white]="tone() === 'technical'"
                [class.dark:bg-slate-900]="tone() === 'technical'"
                [class.text-primary]="tone() === 'technical'"
                [class.shadow-xs]="tone() === 'technical'"
                [class.text-slate-600]="tone() !== 'technical'"
                [class.dark:text-slate-400]="tone() !== 'technical'"
              >
                Technical & RFC
              </button>
              <button
                type="button"
                (click)="selectTone('academic')"
                class="px-3 py-1.5 rounded-md font-semibold transition-colors"
                [class.bg-white]="tone() === 'academic'"
                [class.dark:bg-slate-900]="tone() === 'academic'"
                [class.text-primary]="tone() === 'academic'"
                [class.shadow-xs]="tone() === 'academic'"
                [class.text-slate-600]="tone() !== 'academic'"
                [class.dark:text-slate-400]="tone() !== 'academic'"
              >
                Academic & Scholarly
              </button>
            </div>

            <!-- Metrics -->
            @if (result(); as res) {
              <div class="ml-auto flex flex-wrap items-center gap-4 text-slate-500 dark:text-slate-400">
                <span>Words: <strong class="font-mono text-slate-700 dark:text-slate-300">{{ res.originalWordCount }} → {{ res.rephrasedWordCount }}</strong></span>
                <span>Enhanced Phrases: <strong class="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{{ res.replacements.length }}</strong></span>
                @if (res.wordsReduced > 0) {
                  <span>Saved: <strong class="font-mono text-emerald-600 dark:text-emerald-400 font-bold">-{{ res.wordsReduced }} words</strong></span>
                }
              </div>
            }
          </div>

          <!-- Dual Monospace / Text Panes -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Left Pane: Original Text -->
            <div class="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <div class="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span class="flex items-center gap-2">
                  <app-icon name="file-text" [size]="14" />
                  ORIGINAL TEXT INPUT
                </span>
                <span class="text-slate-400 font-mono text-[11px]">{{ result().originalWordCount }} words</span>
              </div>
              <textarea
                [(ngModel)]="inputText"
                rows="16"
                placeholder="Paste or type text to rephrase professionally..."
                class="w-full p-4 font-sans text-sm leading-relaxed bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none resize-y"
              ></textarea>
            </div>

            <!-- Right Pane: Rephrased Professional Output -->
            <div class="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <div class="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span class="flex items-center gap-2">
                  <app-icon name="sparkles" [size]="14" class="text-primary" />
                  REPHRASED PROFESSIONAL TEXT
                </span>
                <div class="flex items-center gap-2">
                  @if (outputText()) {
                    <app-copy-button [text]="outputText()" label="Copy Rephrased" />
                    <app-download-button [content]="outputText()" filename="rephrased-text.txt" label="Download" />
                  }
                </div>
              </div>
              <div class="relative flex-1 bg-slate-50/40 dark:bg-slate-950/40">
                <textarea
                  [value]="outputText()"
                  readonly
                  rows="16"
                  placeholder="Rephrased text will appear here automatically..."
                  class="w-full p-4 font-sans text-sm leading-relaxed bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none resize-y select-text"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Replaced Phrases & Vocabulary Inspector -->
          @if (result().replacements.length > 0) {
            <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col gap-3">
              <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <app-icon name="check-circle" [size]="15" class="text-emerald-500" />
                  Linguistic Replacements & Enhancements ({{ result().replacements.length }})
                </h3>
                <span class="text-[11px] text-slate-400">Rule-based, 100% Client-Side Linguistic Engine</span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                @for (rep of result().replacements; track rep.id) {
                  <div class="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs flex flex-col gap-1">
                    <div class="flex items-center justify-between font-mono">
                      <span class="line-through text-rose-500/80">{{ rep.original }}</span>
                      <span class="text-slate-400">→</span>
                      <strong class="text-emerald-600 dark:text-emerald-400 font-bold">{{ rep.replacement }}</strong>
                    </div>
                    <span class="text-[10px] text-slate-400 italic">{{ rep.reason }}</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </app-tool-page-layout>
    }
  `
})
export class TextRephraserComponent implements OnInit {
  private readonly toolRegistry = inject(ToolRegistryService);
  private readonly recentToolsService = inject(RecentToolsService);

  public readonly tool = signal<ToolMetadata | undefined>(
    this.toolRegistry.getToolById('text-rephraser')
  );

  public readonly inputText = signal<string>(REPHRASE_SAMPLES['technologyEssay'].text);
  public readonly tone = signal<RephraseTone>('professional');

  public readonly result = computed(() => {
    return rephraseText(this.inputText(), this.tone());
  });

  public readonly outputText = computed(() => this.result().rephrasedText);

  public ngOnInit(): void {
    this.recentToolsService.recordUsage('text-rephraser');
  }

  public selectTone(newTone: RephraseTone): void {
    this.tone.set(newTone);
  }

  public loadSample(key: 'technologyEssay' | 'businessEmail' | 'technicalSpec' | 'academicReport'): void {
    this.inputText.set(REPHRASE_SAMPLES[key].text);
    if (key === 'technologyEssay' || key === 'businessEmail') this.tone.set('professional');
    if (key === 'technicalSpec') this.tone.set('technical');
    if (key === 'academicReport') this.tone.set('academic');
  }

  public clearAll(): void {
    this.inputText.set('');
  }
}

