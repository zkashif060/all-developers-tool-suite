import { Injectable, computed, signal } from '@angular/core';
import { CATEGORIES_DATA, TOOLS_DATA } from '../data/tools.data';
import { CategoryInfo, ToolCategory, ToolMetadata } from '../models/tool.model';

@Injectable({
  providedIn: 'root'
})
export class ToolRegistryService {
  private readonly _tools = signal<ToolMetadata[]>(TOOLS_DATA);
  private readonly _categories = signal<CategoryInfo[]>(CATEGORIES_DATA);

  public readonly tools = this._tools.asReadonly();
  public readonly categories = this._categories.asReadonly();

  public readonly popularTools = computed(() =>
    this._tools().filter(t => t.popular)
  );

  public getToolById(id: string): ToolMetadata | undefined {
    return this._tools().find(t => t.id === id);
  }

  public getToolByRoute(route: string): ToolMetadata | undefined {
    return this._tools().find(t => t.route === route);
  }

  public getToolsByCategory(category: ToolCategory): ToolMetadata[] {
    return this._tools().filter(t => t.category === category);
  }

  public searchTools(query: string, categoryFilter?: ToolCategory | 'all'): ToolMetadata[] {
    const clean = query.trim().toLowerCase();
    return this._tools().filter(tool => {
      // Category match
      if (categoryFilter && categoryFilter !== 'all' && tool.category !== categoryFilter) {
        return false;
      }
      if (!clean) return true;

      // Text match
      const nameMatch = tool.name.toLowerCase().includes(clean);
      const descMatch = tool.description.toLowerCase().includes(clean);
      const catMatch = tool.category.toLowerCase().includes(clean);
      const keywordMatch = tool.keywords.some(k => k.toLowerCase().includes(clean));

      // Tokenized word match (e.g. "text difference" matches if both words appear in metadata)
      const words = clean.split(/\s+/).filter(w => w.length > 1);
      const allWordsMatch =
        words.length > 1 &&
        words.every(w =>
          tool.name.toLowerCase().includes(w) ||
          tool.description.toLowerCase().includes(w) ||
          tool.keywords.some(k => k.toLowerCase().includes(w))
        );

      return nameMatch || descMatch || catMatch || keywordMatch || allWordsMatch;
    });
  }
}

