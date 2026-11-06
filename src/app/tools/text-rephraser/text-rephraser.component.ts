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
  swapSentenceAlternative,
  RephraseTone,
  RephraseResult,
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
                (click)="loadSample('casualText')"
                class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-semibold transition-colors"
              >
                Everyday Easy Words
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
          <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
            <!-- Tone Selector Tabs -->
            <div class="flex flex-wrap items-center gap-1 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                (click)="selectTone('simple')"
                class="px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5"
                [class.bg-white]="tone() === 'simple' || tone() === 'natural'"
                [class.dark:bg-slate-900]="tone() === 'simple' || tone() === 'natural'"
                [class.text-emerald-600]="tone() === 'simple' || tone() === 'natural'"
                [class.dark:text-emerald-400]="tone() === 'simple' || tone() === 'natural'"
                [class.shadow-xs]="tone() === 'simple' || tone() === 'natural'"
                [class.text-slate-600]="tone() !== 'simple' && tone() !== 'natural'"
                [class.dark:text-slate-400]="tone() !== 'simple' && tone() !== 'natural'"
              >
                <app-icon name="user-check" [size]="13" />
                Simple & Human (Anti-AI)
              </button>
              <button
                type="button"
                (click)="selectTone('professional')"
                class="px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5"
                [class.bg-white]="tone() === 'professional'"
                [class.dark:bg-slate-900]="tone() === 'professional'"
                [class.text-primary]="tone() === 'professional'"
                [class.shadow-xs]="tone() === 'professional'"
                [class.text-slate-600]="tone() !== 'professional'"
                [class.dark:text-slate-400]="tone() !== 'professional'"
              >
                <app-icon name="briefcase" [size]="13" />
                Professional & Business
              </button>
              <button
                type="button"
                (click)="selectTone('concise')"
                class="px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5"
                [class.bg-white]="tone() === 'concise'"
                [class.dark:bg-slate-900]="tone() === 'concise'"
                [class.text-primary]="tone() === 'concise'"
                [class.shadow-xs]="tone() === 'concise'"
                [class.text-slate-600]="tone() !== 'concise'"
                [class.dark:text-slate-400]="tone() !== 'concise'"
              >
                <app-icon name="scissors" [size]="13" />
                Concise & Direct
              </button>
              <button
                type="button"
                (click)="selectTone('academic')"
                class="px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5"
                [class.bg-white]="tone() === 'academic'"
                [class.dark:bg-slate-900]="tone() === 'academic'"
                [class.text-primary]="tone() === 'academic'"
                [class.shadow-xs]="tone() === 'academic'"
                [class.text-slate-600]="tone() !== 'academic'"
                [class.dark:text-slate-400]="tone() !== 'academic'"
              >
                <app-icon name="book-open" [size]="13" />
                Academic & Scholarly
              </button>
              <button
                type="button"
                (click)="selectTone('technical')"
                class="px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5"
                [class.bg-white]="tone() === 'technical'"
                [class.dark:bg-slate-900]="tone() === 'technical'"
                [class.text-primary]="tone() === 'technical'"
                [class.shadow-xs]="tone() === 'technical'"
                [class.text-slate-600]="tone() !== 'technical'"
                [class.dark:text-slate-400]="tone() !== 'technical'"
              >
                <app-icon name="terminal" [size]="13" />
                Technical & RFC
              </button>
            </div>

            <!-- Metrics -->
            @if (result(); as res) {
              <div class="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                  <app-icon name="check" [size]="12" />
                  {{ res.sentencesRephrased }} of {{ res.totalSentences }} Sentences Rephrased ({{ res.rephrasePercentage }}%)
                </span>
                @if (res.easyWordsElevatedCount > 0) {
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 font-semibold border border-sky-200 dark:border-sky-800">
                    <app-icon name="sparkles" [size]="12" />
                    {{ res.easyWordsElevatedCount }} Easy Words Upgraded
                  </span>
                }
                <span>Words: <strong class="font-mono text-slate-700 dark:text-slate-300">{{ res.originalWordCount }} → {{ res.rephrasedWordCount }}</strong></span>
                <span>Replacements: <strong class="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{{ res.replacements.length }}</strong></span>
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
                [ngModel]="inputText()"
                (ngModelChange)="onInputChange($event)"
                rows="16"
                placeholder="Paste or type text to rephrase professionally..."
                class="w-full p-4 font-sans text-sm leading-relaxed bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none resize-y"
              ></textarea>
            </div>

            <!-- Right Pane: Rephrased Output -->
            <div class="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <div class="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span class="flex items-center gap-2">
                  <app-icon name="sparkles" [size]="14" class="text-emerald-500" />
                  REPHRASED OUTPUT ({{ tone().toUpperCase() }})
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

          <!-- Interactive Sentence-by-Sentence Rewrite Studio -->
          @if (result().sentences.length > 0) {
            <div class="flex flex-col gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div class="flex items-center gap-2.5">
                  <div class="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <app-icon name="check-circle" [size]="18" />
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Sentence-by-Sentence Rewrite Studio
                    </h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400">
                      Every sentence in your paragraph is actively rewritten. Click any alternative option below to instantly swap it into your final text.
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <app-icon name="check" [size]="12" />
                    {{ result().sentencesRephrased }} of {{ result().totalSentences }} Sentences Rephrased ({{ result().rephrasePercentage }}%)
                  </span>
                </div>
              </div>

              <!-- Sentence Cards Grid -->
              <div class="flex flex-col gap-3">
                @for (sent of result().sentences; track sent.id) {
                  <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex flex-col gap-3 transition-colors hover:border-slate-300 dark:hover:border-slate-700">
                    <!-- Card Header -->
                    <div class="flex items-center justify-between text-xs">
                      <span class="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span class="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[10px] font-mono">
                          {{ sent.index + 1 }}
                        </span>
                        Sentence {{ sent.index + 1 }}
                      </span>
                      <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {{ sent.strategy }}
                      </span>
                    </div>

                    <!-- Original vs Rephrased Comparison -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div class="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span class="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Original Sentence</span>
                        <p class="text-slate-600 dark:text-slate-400 leading-relaxed">{{ sent.original }}</p>
                      </div>
                      <div class="p-3 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60">
                        <span class="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Active Rephrase</span>
                        <p class="text-slate-900 dark:text-slate-100 font-medium leading-relaxed">{{ sent.rephrased }}</p>
                      </div>
                    </div>

                    <!-- Alternative Options Pills -->
                    @if (sent.alternatives.length > 0) {
                      <div class="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <span class="text-[11px] font-medium text-slate-400">Alternative Variations:</span>
                        @for (alt of sent.alternatives; track alt; let altIdx = $index) {
                          <button
                            type="button"
                            (click)="selectAlternative(sent.index, alt)"
                            class="px-2.5 py-1 text-xs rounded-lg border transition-colors text-left"
                            [class.bg-emerald-600]="sent.rephrased === alt"
                            [class.text-white]="sent.rephrased === alt"
                            [class.border-emerald-600]="sent.rephrased === alt"
                            [class.bg-white]="sent.rephrased !== alt"
                            [class.dark:bg-slate-900]="sent.rephrased !== alt"
                            [class.text-slate-700]="sent.rephrased !== alt"
                            [class.dark:text-slate-300]="sent.rephrased !== alt"
                            [class.border-slate-200]="sent.rephrased !== alt"
                            [class.dark:border-slate-700]="sent.rephrased !== alt"
                            [class.hover:border-emerald-400]="sent.rephrased !== alt"
                          >
                            <span class="font-semibold mr-1 opacity-70">Option {{ altIdx + 1 }}:</span>
                            {{ alt }}
                          </button>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }

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
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] text-slate-400 italic">{{ rep.reason }}</span>
                      @if (rep.isEasyWord) {
                        <span class="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Easy Word
                        </span>
                      }
                    </div>
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
  public readonly tone = signal<RephraseTone>('simple');

  // Holds manual swaps made in Sentence Studio
  public readonly manualResult = signal<RephraseResult | null>(null);

  public readonly result = computed(() => {
    const manual = this.manualResult();
    if (manual && manual.originalText === this.inputText() && manual.tone === this.tone()) {
      return manual;
    }
    return rephraseText(this.inputText(), this.tone());
  });

  public readonly outputText = computed(() => this.result().rephrasedText);

  public ngOnInit(): void {
    this.recentToolsService.recordUsage('text-rephraser');
  }

  public onInputChange(val: string): void {
    this.manualResult.set(null);
    this.inputText.set(val);
  }

  public selectTone(newTone: RephraseTone): void {
    this.manualResult.set(null);
    this.tone.set(newTone);
  }

  public selectAlternative(sentenceIndex: number, altText: string): void {
    const current = this.result();
    const updated = swapSentenceAlternative(current, sentenceIndex, altText);
    this.manualResult.set(updated);
  }

  public loadSample(key: 'technologyEssay' | 'casualText' | 'businessEmail' | 'technicalSpec' | 'academicReport'): void {
    this.manualResult.set(null);
    this.inputText.set(REPHRASE_SAMPLES[key].text);
    if (key === 'technologyEssay' || key === 'casualText') this.tone.set('simple');
    if (key === 'businessEmail') this.tone.set('professional');
    if (key === 'technicalSpec') this.tone.set('technical');
    if (key === 'academicReport') this.tone.set('academic');
  }

  public clearAll(): void {
    this.manualResult.set(null);
    this.inputText.set('');
  }
}
