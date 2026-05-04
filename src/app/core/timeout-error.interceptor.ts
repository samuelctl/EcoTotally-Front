import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, timeout } from 'rxjs';
import { HTTP_TIMEOUT_MS } from './api.config';

/**
 * Aplica timeout em TODAS as requisições e trata 401 globalmente
 * (limpa storage e redireciona pro login). Evita loading infinito.
 */
export const timeoutErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    timeout(HTTP_TIMEOUT_MS),
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        // Token expirou ou inválido
        const onPublic = ['/login', '/cadastro', '/esqueci-senha', '/redefinir-senha']
          .some((p) => router.url.startsWith(p));
        if (!onPublic) {
          localStorage.removeItem('eco_access_token');
          localStorage.removeItem('eco_token_type');
          router.navigate(['/login'], { queryParams: { expirado: 1 } });
        }
      }
      return throwError(() => err);
    })
  );
};
