import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LanguageService } from '../../core/language.service';

interface NavItem {
  key: string;
  labelKey: string;
  route: string;
  icon: string;
}

const STORAGE_KEY = 'eco_nav_visivel';

const PUBLIC_PREFIXES = [
  '/login', '/cadastro', '/esqueci-senha', '/redefinir-senha', '/privacidade', '/termos'
];

const NAV_ITEMS: NavItem[] = [
  { key: 'menu',         labelKey: 'nav_home',     route: '/menu',          icon: 'home' },
  { key: 'consumo',      labelKey: 'nav_consumo',  route: '/consumo',       icon: 'file' },
  { key: 'simulacao',    labelKey: 'nav_simular',  route: '/simulacao',     icon: 'zap' },
  { key: 'graficos',     labelKey: 'nav_graficos', route: '/graficos',      icon: 'chart' },
  { key: 'insights',     labelKey: 'nav_insights', route: '/insights',      icon: 'bulb' },
  { key: 'mapa',         labelKey: 'nav_mapa',     route: '/mapa',          icon: 'map' },
  { key: 'configuracoes',labelKey: 'nav_config',   route: '/configuracoes', icon: 'settings' },
];

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss']
})
export class BottomNavComponent {
  private router = inject(Router);
  private langSvc = inject(LanguageService);

  readonly visivel = signal<boolean>(this.loadVisible());
  readonly currentPath = signal<string>(this.router.url);

  /** Itens com label traduzida — recalcula quando idioma muda */
  readonly itens = computed(() => {
    const t = this.langSvc.t();
    return NAV_ITEMS.map(i => ({ ...i, label: t(i.labelKey) }));
  });

  private touchStartY = 0;
  private touchStartX = 0;
  private touching = false;

  constructor() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.currentPath.set((e as NavigationEnd).urlAfterRedirects);
      });
  }

  get rotaPublica(): boolean {
    const url = this.currentPath().split('?')[0].split('#')[0];
    return PUBLIC_PREFIXES.some((p) => url.startsWith(p)) || url === '/';
  }

  isAtivo(route: string): boolean {
    return this.currentPath().split('?')[0].split('#')[0] === route;
  }

  itensVisiveis() {
    return this.itens().filter((item) => !this.isAtivo(item.route));
  }

  toggle(): void {
    const novo = !this.visivel();
    this.visivel.set(novo);
    try { localStorage.setItem(STORAGE_KEY, novo ? '1' : '0'); } catch {}
  }

  private loadVisible(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) return true;
      return raw === '1';
    } catch { return true; }
  }

  @HostListener('window:touchstart', ['$event'])
  onTouchStart(ev: TouchEvent): void {
    if (this.rotaPublica) return;
    const t = ev.touches[0];
    if (!t) return;
    this.touchStartY = t.clientY;
    this.touchStartX = t.clientX;
    this.touching = true;
  }

  @HostListener('window:touchend', ['$event'])
  onTouchEnd(ev: TouchEvent): void {
    if (!this.touching || this.rotaPublica) return;
    this.touching = false;
    const t = ev.changedTouches[0];
    if (!t) return;
    const dy = t.clientY - this.touchStartY;
    const dx = Math.abs(t.clientX - this.touchStartX);
    if (dx > 60 || Math.abs(dy) < 55) return;
    if (this.touchStartY < window.innerHeight * 0.6) return;
    if (dy > 0 && this.visivel()) {
      this.visivel.set(false);
      try { localStorage.setItem(STORAGE_KEY, '0'); } catch {}
    } else if (dy < 0 && !this.visivel()) {
      this.visivel.set(true);
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    }
  }
}
