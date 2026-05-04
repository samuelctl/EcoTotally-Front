export const API_BASE_URL = 'https://ecototally.onrender.com';

/** Timeout default para todas as requisições (ms). */
export const HTTP_TIMEOUT_MS = 15000;

/**
 * Intervalo de polling — usado apenas como fallback quando a página fica
 * visível após longo período de inatividade.
 * Para uso no mobile: preferir visibilitychange (ver createSmartRefresh$).
 */
export const POLL_INTERVAL_MS = 60_000; // 60s (era 10s — economia de bateria)
