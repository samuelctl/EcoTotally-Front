import { Injectable, signal, computed } from '@angular/core';

export type Lang = 'pt-BR' | 'en-US' | 'es-ES';

const PREFS_KEY = 'eco_prefs';
const LANG_KEY  = 'eco_lang';

// ─────────────────────────────────────────────────────────────
// Dicionário global – todas as páginas do app
// ─────────────────────────────────────────────────────────────
const DICT: Record<Lang, Record<string, string>> = {
  'pt-BR': {
    // bottom-nav
    nav_home:        'Início',
    nav_consumo:     'Consumo',
    nav_simular:     'Simular',
    nav_graficos:    'Gráficos',
    nav_insights:    'Insights',
    nav_mapa:        'Mapa',
    nav_config:      'Config',

    // menu
    menu_hi:         'Olá,',
    menu_impact:     'Seu impacto, em tempo real',
    menu_updated:    'Atualizado automaticamente a cada 10s.',
    menu_consumos:   'Consumos',
    menu_simulacoes: 'Simulações',
    menu_gasto:      'Gasto total acumulado',
    menu_metas:      'Metas',
    menu_ver_todas:  'Ver todas →',
    menu_sem_meta:   'Nenhuma meta criada',
    menu_sem_meta_sub: 'Defina limites de gastos e acompanhe seu progresso',
    menu_atalhos:    'Atalhos',
    menu_tile_consumo:   'Consumo',
    menu_tile_consumo_s: 'Registre seus gastos',
    menu_tile_metas:     'Metas',
    menu_tile_metas_s:   'Defina limites',
    menu_tile_simular:   'Simular',
    menu_tile_simular_s: 'Calcule impactos',
    menu_tile_graficos:  'Gráficos',
    menu_tile_graficos_s:'Visualize tendências',
    menu_tile_insights:  'Insights',
    menu_tile_insights_s:'Recomendações IA',
    menu_tile_mapa:      'Mapa',
    menu_tile_mapa_s:    'Pontos de reciclagem',
    menu_tile_perfil:    'Perfil',
    menu_tile_perfil_s:  'Editar dados',

    // consumo page
    con_title:       'Consumo',
    con_subtitle:    'Registre e acompanhe seus consumos.',
    con_tipo:        'Tipo',
    con_gasto:       'Gasto (R$)',
    con_data:        'Data',
    con_meta:        'Vincular a uma meta',
    con_meta_opt:    'opcional',
    con_sem_meta:    '— Sem meta vinculada —',
    con_metas_tipo:  'Metas de',
    con_outras_metas:'Outras metas',
    con_sem_metas_msg:'Nenhuma meta cadastrada ainda. Crie em Metas 🎯',
    con_add_btn:     '+ Adicionar consumo',
    con_hist:        'Histórico',
    con_vazio:       'Nenhum consumo registrado ainda.\nCrie o primeiro acima ☝️',

    // configurações
    settings:        '⚙️ Configurações',
    subtitle:        'Personalize sua experiência no EcoTotally.',
    profile:         'Perfil',
    viewProfile:     'Ver meu perfil',
    appearance:      '🎨 Aparência',
    appDesc:         'Escolha como o app deve ser exibido.',
    light:           'Claro',
    dark:            'Escuro',
    system:          'Sistema',
    reduceAnim:      'Reduzir animações',
    notifications:   '🔔 Notificações',
    alertsLabel:     'Alertas de consumo e metas',
    preferences:     '🌐 Preferências',
    language:        'Idioma',
    energyUnit:      'Unidade de energia',
    dataReports:     '📄 Dados e relatórios',
    dataDesc:        'Baixe seu relatório completo em PDF ou limpe o cache local.',
    downloadPdf:     '📄 Baixar relatório (PDF)',
    generatingPdf:   'Gerando PDF…',
    clearCache:      '🧹 Limpar cache do app',
    about:           'ℹ️ Sobre',
    version:         'Versão',
    support:         'Suporte',
    privacy:         'Política de privacidade',
    terms:           'Termos de uso',
    view:            'Ver',
    account:         '🚪 Conta',
    logout:          'Sair da conta',
    themeUpdated:    'Tema atualizado.',
    reportDownloaded:'Relatório baixado com sucesso.',
    cacheCleared:    'Cache limpo.',
    confirmCache:    'Limpar dados em cache do app? Suas configurações serão mantidas, mas você pode precisar entrar de novo.',
  },

  'en-US': {
    nav_home:        'Home',
    nav_consumo:     'Usage',
    nav_simular:     'Simulate',
    nav_graficos:    'Charts',
    nav_insights:    'Insights',
    nav_mapa:        'Map',
    nav_config:      'Settings',

    menu_hi:         'Hello,',
    menu_impact:     'Your impact, in real time',
    menu_updated:    'Auto-updated every 10s.',
    menu_consumos:   'Entries',
    menu_simulacoes: 'Simulations',
    menu_gasto:      'Total accumulated cost',
    menu_metas:      'Goals',
    menu_ver_todas:  'View all →',
    menu_sem_meta:   'No goals created',
    menu_sem_meta_sub: 'Set spending limits and track your progress',
    menu_atalhos:    'Shortcuts',
    menu_tile_consumo:   'Usage',
    menu_tile_consumo_s: 'Log your expenses',
    menu_tile_metas:     'Goals',
    menu_tile_metas_s:   'Set limits',
    menu_tile_simular:   'Simulate',
    menu_tile_simular_s: 'Calculate impacts',
    menu_tile_graficos:  'Charts',
    menu_tile_graficos_s:'View trends',
    menu_tile_insights:  'Insights',
    menu_tile_insights_s:'AI recommendations',
    menu_tile_mapa:      'Map',
    menu_tile_mapa_s:    'Recycling points',
    menu_tile_perfil:    'Profile',
    menu_tile_perfil_s:  'Edit info',

    con_title:       'Usage',
    con_subtitle:    'Log and track your consumption.',
    con_tipo:        'Type',
    con_gasto:       'Cost (R$)',
    con_data:        'Date',
    con_meta:        'Link to a goal',
    con_meta_opt:    'optional',
    con_sem_meta:    '— No goal linked —',
    con_metas_tipo:  'Goals for',
    con_outras_metas:'Other goals',
    con_sem_metas_msg:'No goals yet. Create one in Goals 🎯',
    con_add_btn:     '+ Add entry',
    con_hist:        'History',
    con_vazio:       'No entries yet.\nCreate your first one above ☝️',

    settings:        '⚙️ Settings',
    subtitle:        'Personalize your EcoTotally experience.',
    profile:         'Profile',
    viewProfile:     'View my profile',
    appearance:      '🎨 Appearance',
    appDesc:         'Choose how the app should look.',
    light:           'Light',
    dark:            'Dark',
    system:          'System',
    reduceAnim:      'Reduce animations',
    notifications:   '🔔 Notifications',
    alertsLabel:     'Consumption & goal alerts',
    preferences:     '🌐 Preferences',
    language:        'Language',
    energyUnit:      'Energy unit',
    dataReports:     '📄 Data & reports',
    dataDesc:        'Download your full PDF report or clear local cache.',
    downloadPdf:     '📄 Download report (PDF)',
    generatingPdf:   'Generating PDF…',
    clearCache:      '🧹 Clear app cache',
    about:           'ℹ️ About',
    version:         'Version',
    support:         'Support',
    privacy:         'Privacy policy',
    terms:           'Terms of use',
    view:            'View',
    account:         '🚪 Account',
    logout:          'Sign out',
    themeUpdated:    'Theme updated.',
    reportDownloaded:'Report downloaded successfully.',
    cacheCleared:    'Cache cleared.',
    confirmCache:    'Clear app cache? Your settings will be kept, but you may need to sign in again.',
  },

  'es-ES': {
    nav_home:        'Inicio',
    nav_consumo:     'Consumo',
    nav_simular:     'Simular',
    nav_graficos:    'Gráficos',
    nav_insights:    'Insights',
    nav_mapa:        'Mapa',
    nav_config:      'Config',

    menu_hi:         '¡Hola,',
    menu_impact:     'Tu impacto, en tiempo real',
    menu_updated:    'Actualizado automáticamente cada 10s.',
    menu_consumos:   'Consumos',
    menu_simulacoes: 'Simulaciones',
    menu_gasto:      'Gasto total acumulado',
    menu_metas:      'Metas',
    menu_ver_todas:  'Ver todas →',
    menu_sem_meta:   'Ninguna meta creada',
    menu_sem_meta_sub: 'Define límites de gasto y sigue tu progreso',
    menu_atalhos:    'Accesos rápidos',
    menu_tile_consumo:   'Consumo',
    menu_tile_consumo_s: 'Registra tus gastos',
    menu_tile_metas:     'Metas',
    menu_tile_metas_s:   'Define límites',
    menu_tile_simular:   'Simular',
    menu_tile_simular_s: 'Calcula impactos',
    menu_tile_graficos:  'Gráficos',
    menu_tile_graficos_s:'Visualiza tendencias',
    menu_tile_insights:  'Insights',
    menu_tile_insights_s:'Recomendaciones IA',
    menu_tile_mapa:      'Mapa',
    menu_tile_mapa_s:    'Puntos de reciclaje',
    menu_tile_perfil:    'Perfil',
    menu_tile_perfil_s:  'Editar datos',

    con_title:       'Consumo',
    con_subtitle:    'Registra y controla tus consumos.',
    con_tipo:        'Tipo',
    con_gasto:       'Gasto (R$)',
    con_data:        'Fecha',
    con_meta:        'Vincular a una meta',
    con_meta_opt:    'opcional',
    con_sem_meta:    '— Sin meta vinculada —',
    con_metas_tipo:  'Metas de',
    con_outras_metas:'Otras metas',
    con_sem_metas_msg:'Aún no hay metas. Crea una en Metas 🎯',
    con_add_btn:     '+ Agregar consumo',
    con_hist:        'Historial',
    con_vazio:       'Ningún consumo registrado.\nCrea el primero arriba ☝️',

    settings:        '⚙️ Configuración',
    subtitle:        'Personaliza tu experiencia en EcoTotally.',
    profile:         'Perfil',
    viewProfile:     'Ver mi perfil',
    appearance:      '🎨 Apariencia',
    appDesc:         'Elige cómo debe mostrarse la app.',
    light:           'Claro',
    dark:            'Oscuro',
    system:          'Sistema',
    reduceAnim:      'Reducir animaciones',
    notifications:   '🔔 Notificaciones',
    alertsLabel:     'Alertas de consumo y metas',
    preferences:     '🌐 Preferencias',
    language:        'Idioma',
    energyUnit:      'Unidad de energía',
    dataReports:     '📄 Datos e informes',
    dataDesc:        'Descarga tu informe completo en PDF o limpia la caché local.',
    downloadPdf:     '📄 Descargar informe (PDF)',
    generatingPdf:   'Generando PDF…',
    clearCache:      '🧹 Limpiar caché de la app',
    about:           'ℹ️ Acerca de',
    version:         'Versión',
    support:         'Soporte',
    privacy:         'Política de privacidad',
    terms:           'Términos de uso',
    view:            'Ver',
    account:         '🚪 Cuenta',
    logout:          'Cerrar sesión',
    themeUpdated:    'Tema actualizado.',
    reportDownloaded:'Informe descargado con éxito.',
    cacheCleared:    'Caché limpiada.',
    confirmCache:    '¿Limpiar caché de la app? Tu configuración se mantendrá, pero puede que tengas que iniciar sesión de nuevo.',
  },
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private _lang = signal<Lang>(this.loadLang());

  readonly lang = this._lang.asReadonly();

  /** Traduz uma chave. Fallback para pt-BR se não achar. */
  readonly t = computed(() => {
    const dict = DICT[this._lang()] ?? DICT['pt-BR'];
    return (key: string) => dict[key] ?? DICT['pt-BR'][key] ?? key;
  });

  setLang(lang: Lang): void {
    this._lang.set(lang);
    document.documentElement.setAttribute('lang', lang);
    try { localStorage.setItem(LANG_KEY, lang); } catch {}
  }

  private loadLang(): Lang {
    try {
      const fromPrefs = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}')?.idioma;
      if (fromPrefs && DICT[fromPrefs as Lang]) return fromPrefs as Lang;
      const fromKey = localStorage.getItem(LANG_KEY) as Lang;
      if (fromKey && DICT[fromKey]) return fromKey;
    } catch {}
    return 'pt-BR';
  }
}
