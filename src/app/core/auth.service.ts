import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from './api.config';

export interface LoginRequest { email: string; senha: string; }
export interface LoginResponse { access_token: string; token_type: string; }

export interface UsuarioLocal {
  id?: number | string;
  nome?: string;
  email?: string;
  cidade?: string;
}

const KEYS = {
  token: 'eco_access_token',
  tokenType: 'eco_token_type',
  email: 'eco_usuario_email',
  usuario: 'eco_usuario_local'
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_BASE_URL}/login/auth/login`, payload)
      .pipe(
        tap((res) => {
          localStorage.setItem(KEYS.token, res.access_token);
          localStorage.setItem(KEYS.tokenType, res.token_type || 'Bearer');
          localStorage.setItem(KEYS.email, payload.email);
          // SEGURANÇA: NÃO armazenamos a senha. Se o token expirar -> login de novo.
        })
      );
  }

  getToken(): string | null { return localStorage.getItem(KEYS.token); }
  isLoggedIn(): boolean { return !!this.getToken(); }

  logout(): void {
    localStorage.removeItem(KEYS.token);
    localStorage.removeItem(KEYS.tokenType);
    localStorage.removeItem(KEYS.email);
    localStorage.removeItem(KEYS.usuario);
  }

  getEmail(): string { return localStorage.getItem(KEYS.email) || ''; }

  setUsuarioLocal(u: UsuarioLocal): void {
    localStorage.setItem(KEYS.usuario, JSON.stringify(u));
  }

  getUsuarioLocal(): UsuarioLocal | null {
    const raw = localStorage.getItem(KEYS.usuario);
    if (!raw) return null;
    try { return JSON.parse(raw) as UsuarioLocal; } catch { return null; }
  }

  getNome(): string {
    return this.getUsuarioLocal()?.nome || 'Usuário';
  }
}
