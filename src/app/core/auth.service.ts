import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
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

  private tokenCache: string | null = this.safeLocalGet(KEYS.token);
  private emailCache: string = this.safeLocalGet(KEYS.email) || '';
  private usuarioCache: UsuarioLocal | null = this.parseUsuario(this.safeLocalGet(KEYS.usuario));
  private hydrated = false;
  private hydratePromise?: Promise<void>;

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_BASE_URL}/login/auth/login`, payload)
      .pipe(
        tap((res) => {
          this.tokenCache = res.access_token;
          this.emailCache = payload.email;
          void this.setPref(KEYS.token, res.access_token);
          void this.setPref(KEYS.tokenType, res.token_type || 'Bearer');
          void this.setPref(KEYS.email, payload.email);
          // SEGURANÇA: NÃO armazenamos a senha. Se o token expirar -> login de novo.
        })
      );
  }

  async hydrate(): Promise<void> {
    if (this.hydrated) return;
    if (this.hydratePromise) return this.hydratePromise;

    this.hydratePromise = Promise.all([
      Preferences.get({ key: KEYS.token }),
      Preferences.get({ key: KEYS.email }),
      Preferences.get({ key: KEYS.usuario })
    ]).then(([token, email, usuario]) => {
      this.tokenCache = token.value || this.tokenCache;
      this.emailCache = email.value || this.emailCache || '';
      this.usuarioCache = this.parseUsuario(usuario.value) || this.usuarioCache;
      this.hydrated = true;
    }).catch(() => {
      this.hydrated = true;
    });

    return this.hydratePromise;
  }

  getToken(): string | null { return this.tokenCache; }

  async getTokenAsync(): Promise<string | null> {
    await this.hydrate();
    return this.tokenCache;
  }

  isLoggedIn(): boolean { return !!this.getToken(); }

  async isLoggedInAsync(): Promise<boolean> {
    return !!(await this.getTokenAsync());
  }

  logout(): void {
    this.tokenCache = null;
    this.emailCache = '';
    this.usuarioCache = null;
    void Promise.all([
      Preferences.remove({ key: KEYS.token }),
      Preferences.remove({ key: KEYS.tokenType }),
      Preferences.remove({ key: KEYS.email }),
      Preferences.remove({ key: KEYS.usuario })
    ]);
    this.safeLocalRemove(KEYS.token);
    this.safeLocalRemove(KEYS.tokenType);
    this.safeLocalRemove(KEYS.email);
    this.safeLocalRemove(KEYS.usuario);
  }

  getEmail(): string { return this.emailCache || ''; }

  setUsuarioLocal(u: UsuarioLocal): void {
    this.usuarioCache = u;
    void this.setPref(KEYS.usuario, JSON.stringify(u));
  }

  getUsuarioLocal(): UsuarioLocal | null { return this.usuarioCache; }

  getNome(): string {
    return this.getUsuarioLocal()?.nome || 'Usuário';
  }

  private async setPref(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value });
    this.safeLocalSet(key, value); // fallback web/compatibilidade
  }

  private parseUsuario(raw: string | null): UsuarioLocal | null {
    if (!raw) return null;
    try { return JSON.parse(raw) as UsuarioLocal; } catch { return null; }
  }

  private safeLocalGet(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  private safeLocalSet(key: string, value: string): void {
    try { localStorage.setItem(key, value); } catch {}
  }
  private safeLocalRemove(key: string): void {
    try { localStorage.removeItem(key); } catch {}
  }
}
