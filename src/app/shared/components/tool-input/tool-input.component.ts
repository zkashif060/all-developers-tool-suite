import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppIconComponent } from '../app-icon/app-icon.component';
import { ClearButtonComponent } from '../clear-button/clear-button.component';

@Component({
  selector: 'app-tool-input',
  standalone: true,
  imports: [FormsModule, AppIconComponent, ClearButtonComponent],
  template: `
    <div
      class="flex flex-col h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-all"
      [class.ring-2]="isDragOver()"
      [class.ring-primary-500]="isDragOver()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
    >
      <!-- Header Bar -->
      <div class="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {{ label() }}
          </span>
          @if (linesCount() > 0) {
            <span class="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {{ linesCount() }} {{ linesCount() === 1 ? 'line' : 'lines' }} &middot; {{ charCount() }} chars
            </span>
          }
        </div>

        <div class="flex items-center gap-2">
          @if (sampleData()) {
            <button
              type="button"
              (click)="loadSample()"
              class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
              title="Load sample input data"
            >
              <app-icon name="sparkles" [size]="12" />
              <span>Sample</span>
            </button>
          }

          <label
            tabindex="0"
            role="button"
            (keydown.enter)="fileInput.click()"
            (keydown.space)="$event.preventDefault(); fileInput.click()"
            class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            title="Upload file (.txt, .json, .csv, etc.)"
            aria-label="Upload file from disk"
          >
            <app-icon name="download" [size]="12" className="rotate-180" />
            <span>Upload</span>
            <input #fileInput type="file" class="hidden" (change)="onFileSelected($event)" [attr.accept]="acceptedFileTypes()" />
          </label>

          @if (value()) {
            <app-clear-button (cleared)="clear()" />
          }
        </div>
      </div>

      <!-- Textarea Container -->
      <div class="relative flex-1 min-h-[280px]">
        @if (isDragOver()) {
          <div class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-primary-50/90 dark:bg-primary-950/90 backdrop-blur-sm border-2 border-dashed border-primary-500 rounded-b-xl">
            <app-icon name="download" [size]="32" className="text-primary-500 rotate-180 animate-bounce mb-2" />
            <p class="text-sm font-semibold text-primary-600 dark:text-primary-300">Drop file here to load</p>
          </div>
        }

        <textarea
          [value]="value()"
          (input)="onInputChange($event)"
          [placeholder]="placeholder()"
          [rows]="rows()"
          [attr.aria-label]="label()"
          class="w-full h-full min-h-[280px] p-4 font-mono text-sm leading-relaxed bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 border-none outline-none resize-none focus:ring-0"
          spellcheck="false"
        ></textarea>
      </div>
    </div>
  `
})
export class ToolInputComponent {
  public readonly label = input<string>('Input');
  public readonly value = input<string>('');
  public readonly placeholder = input<string>('Enter or paste input here...');
  public readonly rows = input<number>(12);
  public readonly acceptedFileTypes = input<string>('*');
  public readonly sampleData = input<string>('');

  public readonly valueChange = output<string>();
  public readonly fileLoaded = output<File>();

  protected readonly isDragOver = signal<boolean>(false);

  protected readonly linesCount = computed(() => {
    const val = this.value();
    if (!val) return 0;
    return val.split('\n').length;
  });

  protected readonly charCount = computed(() => {
    return this.value().length;
  });

  public onInputChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.valueChange.emit(target.value);
  }

  public loadSample(): void {
    if (this.sampleData()) {
      this.valueChange.emit(this.sampleData());
    }
  }

  public clear(): void {
    this.valueChange.emit('');
  }

  public onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  public onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  public onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    if (event.dataTransfer?.files?.length) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  public onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files?.length) {
      this.processFile(target.files[0]);
      target.value = ''; // Reset input
    }
  }

  private processFile(file: File): void {
    this.fileLoaded.emit(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        this.valueChange.emit(text);
      }
    };
    reader.readAsText(file);
  }
}

