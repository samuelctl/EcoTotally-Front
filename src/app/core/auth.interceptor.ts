import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

function isPublicRoute(url: string, method: string): boolean {
  let path = '';
  try { path = new URL(url).pathname; } catch { path = url.split('?')[0]; }

  if (path.includes('/login/auth/login') || path.endsWith('/auth/login')) return true;
  if (method === 'POST' && (path === '/usuario' || path === '/usuario/')) return true;
  if (path.includes('/esqueci-senha') || path.includes('/redefinir-senha')) return true;
  return false;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  if (isPublicRoute(req.url, req.method.toUpperCase())) return next(req);

  return from(auth.getTokenAsync()).pipe(
    switchMap((token) => {
      const authReq = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;
      return next(authReq);
    }),
    catchError((err) => {
      if (err?.status === 401) {
        auth.logout();
        router.navigate(['/login'], { queryParams: { expirado: '1' } });
      }
      return throwError(() => err);
    })
  );
};
