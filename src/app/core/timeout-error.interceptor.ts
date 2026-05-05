import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, timeout } from 'rxjs';
import { HTTP_TIMEOUT_MS } from './api.config';
import { CUSTOM_TIMEOUT_MS } from '../services/insights.service';
import { AuthService } from './auth.service';

export const timeoutErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const timeoutMs = req.context.get(CUSTOM_TIMEOUT_MS) ?? HTTP_TIMEOUT_MS; // usa 60s pra IA, 15s pro resto

  return next(req).pipe(
    timeout(timeoutMs),
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        const onPublic = ['/login', '/cadastro', '/esqueci-senha', '/redefinir-senha']
          .some((p) => router.url.startsWith(p));
        if (!onPublic) {
          auth.logout();
          router.navigate(['/login'], { queryParams: { expirado: 1 } });
        }
      }
      return throwError(() => err);
    })
  );
};
