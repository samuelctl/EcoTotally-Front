import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

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

  if (isPublicRoute(req.url, req.method.toUpperCase())) return next(req);

  const token = localStorage.getItem('eco_access_token');
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err) => {
      if (err?.status === 401) {
        // Limpa token e redireciona para login com aviso de sessão expirada
        localStorage.removeItem('eco_access_token');
        localStorage.removeItem('eco_token_type');
        router.navigate(['/login'], { queryParams: { expirado: '1' } });
      }
      return throwError(() => err);
    })
  );
};
