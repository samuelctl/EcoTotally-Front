import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { ThemeService, ThemeMode } from '../../core/theme.service';
import { InsightsService } from '../../services/insights.service';
import { describeError } from '../../core/http-helpers';

interface Prefs {
  notificacoes: boolean;
  unidade: 'kWh' | 'MJ';
  idioma: 'pt-BR' | 'en-US' | 'es-ES';
  reduzirAnimacoes: boolean;
}

const PREFS_KEY = 'eco_prefs';
const APP_VERSION = '2.0.0';

const LANG_LABELS: Record<string, Record<string, string>> = {
  'pt-BR': {
    settings: '⚙️ Configurações',
    subtitle: 'Personalize sua experiência no EcoTotally.',
    appearance: '🎨 Aparência',
    light: 'Claro',
    dark: 'Escuro',
    system: 'Sistema',
    reduceAnim: 'Reduzir animações',
    notifications: '🔔 Notificações',
    alertsLabel: 'Alertas de consumo e metas',
    preferences: '🌐 Preferências',
    language: 'Idioma',
    energyUnit: 'Unidade de energia',
    dataReports: '📄 Dados e relatórios',
    dataDesc: 'Baixe seu relatório completo em PDF ou limpe o cache local.',
    downloadPdf: '📄 Baixar relatório (PDF)',
    generatingPdf: 'Gerando PDF…',
    clearCache: '🧹 Limpar cache do app',
    about: 'ℹ️ Sobre',
    version: 'Versão',
    support: 'Suporte',
    privacy: 'Política de privacidade',
    terms: 'Termos de uso',
    view: 'Ver',
    account: '🚪 Conta',
    logout: 'Sair da conta',
    themeUpdated: 'Tema atualizado.',
    reportDownloaded: 'Relatório baixado com sucesso.',
    cacheCleared: 'Cache limpo.',
    confirmCache: 'Limpar dados em cache do app? Suas configurações serão mantidas, mas você pode precisar entrar de novo.',
  },
  'en-US': {
    settings: '⚙️ Settings',
    subtitle: 'Personalize your EcoTotally experience.',
    appearance: '🎨 Appearance',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    reduceAnim: 'Reduce animations',
    notifications: '🔔 Notifications',
    alertsLabel: 'Consumption & goal alerts',
    preferences: '🌐 Preferences',
    language: 'Language',
    energyUnit: 'Energy unit',
    dataReports: '📄 Data & reports',
    dataDesc: 'Download your full PDF report or clear local cache.',
    downloadPdf: '📄 Download report (PDF)',
    generatingPdf: 'Generating PDF…',
    clearCache: '🧹 Clear app cache',
    about: 'ℹ️ About',
    version: 'Version',
    support: 'Support',
    privacy: 'Privacy policy',
    terms: 'Terms of use',
    view: 'View',
    account: '🚪 Account',
    logout: 'Sign out',
    themeUpdated: 'Theme updated.',
    reportDownloaded: 'Report downloaded successfully.',
    cacheCleared: 'Cache cleared.',
    confirmCache: 'Clear app cache? Your settings will be kept, but you may need to sign in again.',
  },
  'es-ES': {
    settings: '⚙️ Configuración',
    subtitle: 'Personaliza tu experiencia en EcoTotally.',
    appearance: '🎨 Apariencia',
    light: 'Claro',
    dark: 'Oscuro',
    system: 'Sistema',
    reduceAnim: 'Reducir animaciones',
    notifications: '🔔 Notificaciones',
    alertsLabel: 'Alertas de consumo y metas',
    preferences: '🌐 Preferencias',
    language: 'Idioma',
    energyUnit: 'Unidad de energía',
    dataReports: '📄 Datos e informes',
    dataDesc: 'Descarga tu informe completo en PDF o limpia la caché local.',
    downloadPdf: '📄 Descargar informe (PDF)',
    generatingPdf: 'Generando PDF…',
    clearCache: '🧹 Limpiar caché de la app',
    about: 'ℹ️ Acerca de',
    version: 'Versión',
    support: 'Soporte',
    privacy: 'Política de privacidad',
    terms: 'Términos de uso',
    view: 'Ver',
    account: '🚪 Cuenta',
    logout: 'Cerrar sesión',
    themeUpdated: 'Tema actualizado.',
    reportDownloaded: 'Informe descargado con éxito.',
    cacheCleared: 'Caché limpiada.',
    confirmCache: '¿Limpiar caché de la app? Tu configuración se mantendrá, pero puede que tengas que iniciar sesión de nuevo.',
  },
};

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './configuracoes.component.html',
  styleUrls: ['./configuracoes.component.scss']
})
export class ConfiguracoesComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private insights = inject(InsightsService);
  theme = inject(ThemeService);

  readonly versao = APP_VERSION;
  readonly emailUsuario = computed(() => this.auth.getEmail() || this.auth.getUsuarioLocal()?.email || '—');
  readonly nomeUsuario = computed(() => this.auth.getNome());

  prefs = signal<Prefs>(this.load());

  baixandoPdf = signal(false);
  msgOk = signal<string | null>(null);
  msgErro = signal<string | null>(null);

  t = computed(() => LANG_LABELS[this.prefs().idioma] ?? LANG_LABELS['pt-BR']);

  ngOnInit(): void {
    this.applyLanguage(this.prefs().idioma);
    this.applyAnimations(this.prefs().reduzirAnimacoes);
  }

  setTheme(m: ThemeMode): void {
    this.theme.setMode(m);
    this.flash(this.t()['themeUpdated'] ?? 'Tema atualizado.');
  }

  togglePref<K extends keyof Prefs>(key: K, value: Prefs[K]): void {
    const next = { ...this.prefs(), [key]: value };
    this.prefs.set(next);

    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {}

    if (key === 'idioma') {
      this.applyLanguage(value as string);
    }

    if (key === 'reduzirAnimacoes') {
      this.applyAnimations(value as boolean);
    }

    if (key === 'notificacoes') {
      this.handleNotificationPref(value as boolean);
    }
  }

  async baixarRelatorio(): Promise<void> {
    if (this.baixandoPdf()) return;

    this.baixandoPdf.set(true);
    this.msgErro.set(null);

    try {
      await this.insights.baixarRelatorioPdf();
      this.flash(this.t()['reportDownloaded'] ?? 'Relatório baixado com sucesso.');
    } catch (err) {
      this.msgErro.set(describeError(err, 'Não foi possível baixar o relatório.'));
    } finally {
      this.baixandoPdf.set(false);
    }
  }

  limparCache(): void {
    const msg = this.t()['confirmCache'] ?? 'Limpar dados em cache do app?';

    if (!confirm(msg)) return;

    const prefs = localStorage.getItem(PREFS_KEY);
    const theme = localStorage.getItem('eco_theme_mode');

    try {
      localStorage.clear();

      if (prefs) {
        localStorage.setItem(PREFS_KEY, prefs);
      }

      if (theme) {
        localStorage.setItem('eco_theme_mode', theme);
      }
    } catch {}

    this.flash(this.t()['cacheCleared'] ?? 'Cache limpo.');
    this.router.navigate(['/login']);
  }

  sair(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  private applyLanguage(lang: string): void {
    document.documentElement.setAttribute('lang', lang);

    try {
      localStorage.setItem('eco_lang', lang);
    } catch {}
  }

  private applyAnimations(reduce: boolean): void {
    if (reduce) {
      document.documentElement.style.setProperty('--anim-duration', '0ms');
    } else {
      document.documentElement.style.removeProperty('--anim-duration');
    }
  }

  private handleNotificationPref(enabled: boolean): void {
    if (!enabled) return;
    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('EcoTotally 🌱', {
            body: 'Alertas de consumo e metas ativados!',
            icon: 'logo-ecototally.png',
          });
        } else {
          const next = { ...this.prefs(), notificacoes: false };
          this.prefs.set(next);

          try {
            localStorage.setItem(PREFS_KEY, JSON.stringify(next));
          } catch {}
        }
      });
    } else if (Notification.permission === 'granted') {
      new Notification('EcoTotally 🌱', {
        body: 'Alertas de consumo e metas ativados!',
        icon: 'logo-ecototally.png',
      });
    }
  }

  private flash(msg: string): void {
    this.msgOk.set(msg);
    setTimeout(() => this.msgOk.set(null), 2200);
  }

  private load(): Prefs {
    const def: Prefs = {
      notificacoes: true,
      unidade: 'kWh',
      idioma: 'pt-BR',
      reduzirAnimacoes: false,
    };

    try {
      const raw = localStorage.getItem(PREFS_KEY);

      if (!raw) return def;

      const parsed = JSON.parse(raw);
      delete parsed['emailMarketing'];

      return { ...def, ...parsed };
    } catch {
      return def;
    }
  }
}