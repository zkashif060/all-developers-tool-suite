import { Injectable, computed, effect, signal } from '@angular/core';
import { ThemeMode } from '../models/theme.model';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'devtools_theme';
  private readonly mediaQuery = (typeof window !== 'undefined' && typeof window.matchMedia === 'function')
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

  private readonly systemPrefersDark = signal<boolean>(
    this.mediaQuery ? this.mediaQuery.matches : false
  );

  public readonly currentTheme = signal<ThemeMode>(this.getInitialTheme());

  public readonly isDark = computed(() => {
    const mode = this.currentTheme();
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return this.systemPrefersDark();
  });

  constructor() {
    // Listen to system color-scheme changes
    if (this.mediaQuery) {
      this.mediaQuery.addEventListener('change', (e) => {
        this.systemPrefersDark.set(e.matches);
      });
    }

    // Apply class to HTML root whenever isDark changes
    effect(() => {
      const dark = this.isDark();
      if (typeof document !== 'undefined') {
        if (dark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    });

    // Save to localStorage whenever currentTheme changes
    effect(() => {
      const theme = this.currentTheme();
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(this.STORAGE_KEY, theme);
        }
      } catch (e) {
        console.warn('Could not persist theme preference to localStorage', e);
      }
    });
  }

  public setTheme(mode: ThemeMode): void {
    this.currentTheme.set(mode);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.STORAGE_KEY, mode);
      }
    } catch (e) {
      console.warn('Could not persist theme preference to localStorage', e);
    }
  }

  public toggleTheme(): void {
    const current = this.currentTheme();
    if (current === 'light') {
      this.setTheme('dark');
    } else if (current === 'dark') {
      this.setTheme('system');
    } else {
      this.setTheme('light');
    }
  }

  public toggleDarkLight(): void {
    this.setTheme(this.isDark() ? 'light' : 'dark');
  }

  private getInitialTheme(): ThemeMode {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(this.STORAGE_KEY) as ThemeMode | null;
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          return stored;
        }
      }
    } catch (e) {
      console.warn('Failed reading theme from localStorage', e);
    }
    return 'system';
  }
}
