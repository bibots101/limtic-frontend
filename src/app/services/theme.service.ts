import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'limtic-theme';

  theme = signal<'dark' | 'light'>('dark');

  constructor() {
    const saved = localStorage.getItem(this.STORAGE_KEY) as 'dark' | 'light' | null;
    const initial = saved ?? 'dark';
    this.theme.set(initial);
    this.applyTheme(initial);
  }

  toggle() {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    localStorage.setItem(this.STORAGE_KEY, next);
    this.applyTheme(next);
  }

  private applyTheme(t: 'dark' | 'light') {
    document.body.setAttribute('data-theme', t);
  }
}
