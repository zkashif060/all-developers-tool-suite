import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { ToolMetadata } from '../models/tool.model';
import { ToolRegistryService } from './tool-registry.service';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly STORAGE_KEY = 'devtools_favorites';
  private readonly toolRegistry = inject(ToolRegistryService);

  private readonly _favoriteIds = signal<string[]>(this.getInitialFavorites());

  public readonly favoriteIds = this._favoriteIds.asReadonly();

  public readonly favoriteTools = computed<ToolMetadata[]>(() => {
    const ids = this._favoriteIds();
    const allTools = this.toolRegistry.tools();
    return ids
      .map(id => allTools.find(t => t.id === id))
      .filter((t): t is ToolMetadata => !!t);
  });

  public readonly favoriteCount = computed(() => this._favoriteIds().length);

  constructor() {
    effect(() => {
      const ids = this._favoriteIds();
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ids));
        }
      } catch (e) {
        console.warn('Could not persist favorites to localStorage', e);
      }
    });
  }

  public isFavorite(toolId: string): boolean {
    return this._favoriteIds().includes(toolId);
  }

  public toggleFavorite(toolId: string): boolean {
    const current = this._favoriteIds();
    if (current.includes(toolId)) {
      this._favoriteIds.set(current.filter(id => id !== toolId));
      return false;
    } else {
      this._favoriteIds.set([...current, toolId]);
      return true;
    }
  }

  public clearAllFavorites(): void {
    this._favoriteIds.set([]);
  }

  private getInitialFavorites(): string[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            // Verify all are strings
            return parsed.filter(item => typeof item === 'string');
          }
        }
      }
    } catch (e) {
      console.warn('Corrupted favorites in localStorage, resetting to default empty state', e);
    }
    // Default popular tools as initial favorites for new users
    return ['json-formatter', 'jwt-decoder', 'uuid-generator'];
  }
}

