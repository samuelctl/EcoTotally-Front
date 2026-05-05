import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'eco_theme_mode';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>(this.load());

  constructor() {
    this.apply(this.mode());

    // Reage a mudanças do tema do sistema quando estiver em "system"
    const mq = window.matchMedia?.('(prefers-color-scheme: light)');
    mq?.addEventListener?.('change', () => {
      if (this.mode() === 'system') this.apply('system');
    });
  }

  setMode(m: ThemeMode): void {
    this.mode.set(m);
    try { localStorage.setItem(STORAGE_KEY, m); } catch { /* ignore */ }
    this.apply(m);
  }

  private load(): ThemeMode {
    try {
      const v = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (v === 'light' || v === 'dark' || v === 'system') return v;
    } catch { /* ignore */ }
    return 'dark';
  }

  private apply(m: ThemeMode): void {
    const root = document.documentElement;
    let effective: 'light' | 'dark' = 'dark';
    if (m === 'light') effective = 'light';
    else if (m === 'dark') effective = 'dark';
    else {
      effective = window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    root.setAttribute('data-theme', effective);
  }
}
