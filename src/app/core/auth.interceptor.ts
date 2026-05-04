import { HttpInterceptorFn } from '@angular/common/http';

function isPublicRoute(url: string, method: string): boolean {
  let path = '';
  try { path = new URL(url).pathname; } catch { path = url.split('?')[0]; }

  if (path.includes('/login/auth/login') || path.endsWith('/auth/login')) return true;
  if (method === 'POST' && (path === '/usuario' || path === '/usuario/')) return true;
  if (path.includes('/esqueci-senha') || path.includes('/redefinir-senha')) return true;
  return false;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (isPublicRoute(req.url, req.method.toUpperCase())) return next(req);

  const token = localStorage.getItem('eco_access_token');
  if (!token) return next(req);

  return next(
    req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
  );
};
