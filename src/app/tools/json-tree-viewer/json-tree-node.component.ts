import { Component, input, output } from '@angular/core';
import { JsonTreeNode, JsonNodeType } from './json-tree-viewer.engine';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-json-tree-node',
  standalone: true,
  imports: [AppIconComponent],
  template: `
    <div class="flex flex-col select-text font-mono text-xs">
      <!-- Node Row -->
      <div
        (click)="onNodeClick()"
        class="group flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
        [class.bg-amber-500/15]="node().matchesFilter"
        [class.ring-1]="node().matchesFilter"
        [class.ring-amber-500/40]="node().matchesFilter"
        [style.paddingLeft.px]="node().depth * 18 + 8"
      >
        <!-- Chevron Toggle (for Object / Array) -->
        @if (node().type === 'object' || node().type === 'array') {
          <button
            type="button"
            (click)="toggleExpand($event)"
            class="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-transform cursor-pointer"
          >
            <app-icon
              [name]="node().isExpanded ? 'chevron-down' : 'chevron-right'"
              [size]="13"
            />
          </button>
        } @else {
          <span class="w-[13px] inline-block"></span>
        }

        <!-- Property Key / Index -->
        <span
          class="font-semibold"
          [class.text-indigo-600]="node().type === 'object' || node().type === 'array'"
          [class.dark:text-indigo-400]="node().type === 'object' || node().type === 'array'"
          [class.text-slate-800]="node().type !== 'object' && node().type !== 'array'"
          [class.dark:text-slate-200]="node().type !== 'object' && node().type !== 'array'"
        >
          {{ node().key }}:
        </span>

        <!-- Type Tag Badge -->
        <span
          class="px-1.5 py-0.2 rounded text-[10px] uppercase font-bold"
          [class]="getTypeBadgeClass(node().type)"
        >
          {{ getTypeLabel(node().type) }}
        </span>

        <!-- Value / Preview -->
        @if (node().type === 'object' || node().type === 'array') {
          <span class="text-slate-400 text-[11px] italic">
            {{ node().preview }}
          </span>
        } @else {
          <span
            class="font-medium break-all"
            [class]="getValueColorClass(node().type)"
          >
            {{ node().preview }}
          </span>
        }

        <!-- Hover Quick Actions (Copy Path & Copy Value) -->
        <div class="ml-auto opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
          <button
            type="button"
            (click)="copyNodePath($event)"
            class="px-1.5 py-0.5 text-[10px] rounded bg-slate-200 dark:bg-slate-700 hover:bg-primary hover:text-white transition-colors"
            title="Copy JSONPath"
          >
            Path
          </button>
          <button
            type="button"
            (click)="copyNodeValue($event)"
            class="px-1.5 py-0.5 text-[10px] rounded bg-slate-200 dark:bg-slate-700 hover:bg-primary hover:text-white transition-colors"
            title="Copy Value"
          >
            Copy
          </button>
        </div>
      </div>

      <!-- Recursive Children Rendering -->
      @if (node().isExpanded && node().children && node().children!.length > 0) {
        <div class="flex flex-col">
          @for (child of node().children; track child.id) {
            <app-json-tree-node
              [node]="child"
              (selectPath)="selectPath.emit($event)"
              (copiedNotification)="copiedNotification.emit($event)"
            />
          }
        </div>
      }
    </div>
  `
})
export class JsonTreeNodeComponent {
  public readonly node = input.required<JsonTreeNode>();
  public readonly selectPath = output<string>();
  public readonly copiedNotification = output<string>();

  public toggleExpand(event: MouseEvent): void {
    event.stopPropagation();
    const current = this.node();
    current.isExpanded = !current.isExpanded;
  }

  public onNodeClick(): void {
    this.selectPath.emit(this.node().path);
    if (this.node().type === 'object' || this.node().type === 'array') {
      this.node().isExpanded = !this.node().isExpanded;
    }
  }

  public copyNodePath(event: MouseEvent): void {
    event.stopPropagation();
    navigator.clipboard.writeText(this.node().path);
    this.copiedNotification.emit(`Copied path: ${this.node().path}`);
  }

  public copyNodeValue(event: MouseEvent): void {
    event.stopPropagation();
    const val = typeof this.node().value === 'object'
      ? JSON.stringify(this.node().value, null, 2)
      : String(this.node().value);
    navigator.clipboard.writeText(val);
    this.copiedNotification.emit(`Copied value of ${this.node().key}`);
  }

  public getTypeLabel(type: JsonNodeType): string {
    switch (type) {
      case 'string': return 'str';
      case 'number': return 'num';
      case 'boolean': return 'bool';
      case 'null': return 'null';
      case 'array': return 'arr';
      case 'object': return 'obj';
    }
  }

  public getTypeBadgeClass(type: JsonNodeType): string {
    switch (type) {
      case 'string':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'number':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'boolean':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      case 'null':
        return 'bg-slate-500/10 text-slate-500 dark:text-slate-400';
      case 'array':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'object':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400';
    }
  }

  public getValueColorClass(type: JsonNodeType): string {
    switch (type) {
      case 'string':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'number':
        return 'text-amber-600 dark:text-amber-400';
      case 'boolean':
        return 'text-purple-600 dark:text-purple-400';
      case 'null':
        return 'text-slate-400 italic';
      default:
        return 'text-slate-700 dark:text-slate-300';
    }
  }
}
