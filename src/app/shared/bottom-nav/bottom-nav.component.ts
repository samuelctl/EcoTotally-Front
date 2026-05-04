import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';

interface NavItem { key: string; label: string; route: string; icon: string; }

const STORAGE_KEY = 'eco_nav_visivel';
const PUBLIC_PREFIXES = ['/login', '/cadastro', '/esqueci-senha', '/redefinir-senha'];

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss']
})
export class BottomNavComponent {
  private router = inject(Router);

  readonly itens: NavItem[] = [
  { key: 'menu', label: 'Início', route: '/menu', icon: 'home' },
  { key: 'consumo', label: 'Consumo', route: '/consumo', icon: 'file' },
  { key: 'metas', label: 'Metas', route: '/metas', icon: 'target' },
  { key: 'simulacao', label: 'Simular', route: '/simulacao', icon: 'zap' },
  { key: 'graficos', label: 'Gráficos', route: '/graficos', icon: 'chart' },
  { key: 'insights', label: 'Insights', route: '/insights', icon: 'bulb' },
  { key: 'mapa', label: 'Mapa', route: '/mapa', icon: 'map' },
  { key: 'perfil', label: 'Perfil', route: '/perfil', icon: 'user' },
  { key: 'configuracoes', label: 'Config', route: '/configuracoes', icon: 'settings' }
];

  readonly visivel = signal<boolean>(this.loadVisible());
  readonly currentPath = signal<string>(this.router.url);

  // Estado interno do gesto de swipe
  private touchStartY = 0;
  private touchStartX = 0;
  private touching = false;

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => this.currentPath.set((e as NavigationEnd).urlAfterRedirects));
  }

  /** Esconde a navbar nas telas públicas (login etc.) */
  get rotaPublica(): boolean {
    const url = this.currentPath();
    return PUBLIC_PREFIXES.some((p) => url.startsWith(p)) || url === '/' ;
  }

  isAtivo(route: string): boolean {
    return this.currentPath().startsWith(route);
  }

  toggle(): void {
    const novo = !this.visivel();
    this.visivel.set(novo);
    try { localStorage.setItem(STORAGE_KEY, novo ? '1' : '0'); } catch { /* ignore */ }
  }

  private loadVisible(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) return true;
      return raw === '1';
    } catch {
      return true;
    }
  }

  /* ===== Swipe detection no body ===== */
  @HostListener('window:touchstart', ['$event'])
  onTouchStart(ev: TouchEvent) {
    if (this.rotaPublica) return;
    const t = ev.touches[0];
    if (!t) return;
    this.touchStartY = t.clientY;
    this.touchStartX = t.clientX;
    this.touching = true;
  }

  @HostListener('window:touchend', ['$event'])
  onTouchEnd(ev: TouchEvent) {
    if (!this.touching || this.rotaPublica) return;
    this.touching = false;
    const t = ev.changedTouches[0];
    if (!t) return;
    const dy = t.clientY - this.touchStartY;
    const dx = Math.abs(t.clientX - this.touchStartX);

    // Swipe quase vertical, com magnitude mínima
    if (dx > 60 || Math.abs(dy) < 55) return;

    // Só consideramos swipe iniciado no terço inferior da tela
    if (this.touchStartY < window.innerHeight * 0.6) return;

    if (dy > 0 && this.visivel()) {
      // Swipe para baixo -> esconde
      this.visivel.set(false);
      try { localStorage.setItem(STORAGE_KEY, '0'); } catch { /* ignore */ }
    } else if (dy < 0 && !this.visivel()) {
      // Swipe para cima -> mostra
      this.visivel.set(true);
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
    }
  }
}
