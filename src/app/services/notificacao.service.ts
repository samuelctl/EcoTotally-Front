import { Injectable } from '@angular/core';

const PREFS_KEY = 'eco_prefs';
const NOTIF_KEY = 'eco_notif_fired';

@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private isEnabled(): boolean {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return true;
      const p = JSON.parse(raw);
      return p.notificacoes !== false;
    } catch {
      return true;
    }
  }

  private canNotify(): boolean {
    return this.isEnabled() &&
      'Notification' in window &&
      Notification.permission === 'granted';
  }

  /** Check meta goals and fire notifications when needed */
  verificarMetas(metas: Array<{ tipo: string; pct: number; status: string; nome: string }>): void {
    if (!this.canNotify()) return;

    const fired: Record<string, number> = this.loadFired();
    const now = Date.now();
    const cooldown = 1000 * 60 * 60 * 4; // 4 hours per meta

    for (const m of metas) {
      const key = `meta_${m.nome}_${m.status}`;
      const lastFired = fired[key] ?? 0;
      if (now - lastFired < cooldown) continue;

      if (m.status === 'estourada') {
        this.send(
          `⚠️ Meta estourada: ${m.tipo}`,
          `Você ultrapassou o limite de ${m.nome}. Veja seus consumos.`
        );
        fired[key] = now;
      } else if (m.status === 'atencao') {
        this.send(
          `🟡 Atenção: ${m.tipo}`,
          `Você está em ${Math.round(m.pct)}% do limite de ${m.nome}.`
        );
        fired[key] = now;
      }
    }

    this.saveFired(fired);
  }

  private send(title: string, body: string): void {
    try {
      new Notification(title, { body, icon: 'logo-ecototally.png', badge: 'logo-ecototally.png' });
    } catch { /* ignore */ }
  }

  private loadFired(): Record<string, number> {
    try {
      const raw = localStorage.getItem(NOTIF_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private saveFired(data: Record<string, number>): void {
    try {
      localStorage.setItem(NOTIF_KEY, JSON.stringify(data));
    } catch { /* ignore */ }
  }
}
