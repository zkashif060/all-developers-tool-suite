import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { ToolMetadata } from '../models/tool.model';
import { ToolRegistryService } from './tool-registry.service';

@Injectable({
  providedIn: 'root'
})
export class RecentToolsService {
  private readonly STORAGE_KEY = 'devtools_recents';
  private readonly MAX_RECENTS = 5;
  private readonly toolRegistry = inject(ToolRegistryService);

  private readonly _recentIds = signal<string[]>(this.getInitialRecents());

  public readonly recentTools = computed<ToolMetadata[]>(() => {
    const ids = this._recentIds();
    const all = this.toolRegistry.tools();
    return ids
      .map(id => all.find(t => t.id === id))
      .filter((t): t is ToolMetadata => !!t);
  });

  constructor() {
    effect(() => {
      const ids = this._recentIds();
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ids));
        }
      } catch (e) {
        console.warn('Could not persist recent tools to localStorage', e);
      }
    });
  }

  public recordUsage(toolId: string): void {
    // Only record if tool exists in registry
    if (!this.toolRegistry.getToolById(toolId)) return;

    const current = this._recentIds().filter(id => id !== toolId);
    this._recentIds.set([toolId, ...current].slice(0, this.MAX_RECENTS));
  }

  private getInitialRecents(): string[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            return parsed.filter(item => typeof item === 'string');
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse recents from localStorage', e);
    }
    return ['json-formatter', 'base64', 'jwt-decoder'];
  }
}

