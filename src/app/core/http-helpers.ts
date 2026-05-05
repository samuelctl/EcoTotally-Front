import { HttpErrorResponse } from '@angular/common/http';

/** Extrai uma mensagem amigável de qualquer erro HTTP. */
export function describeError(err: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Sem conexão com o servidor. Verifique sua internet.';
    const detail = (err.error && (err.error.detail ?? err.error.message)) as unknown;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg);
    if (err.status === 401) return 'Sessão expirada. Entre de novo.';
    if (err.status === 403) return 'Acesso negado.';
    if (err.status === 404) return 'Não encontrado.';
    if (err.status >= 500) return 'Servidor indisponível. Tente novamente em instantes.';
    return err.message || fallback;
  }
  if (err instanceof Error) {
    if (err.name === 'TimeoutError') return 'A requisição demorou demais. Tente novamente.';
    return err.message;
  }
  return fallback;
}
