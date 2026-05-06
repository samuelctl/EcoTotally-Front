import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, map, switchMap } from 'rxjs';
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

  private tokenCache: string | null = null;
  private emailCache = '';
  private usuarioCache: UsuarioLocal | null = null;
  private hydrated = false;
  private hydratePromise?: Promise<void>;

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_BASE_URL}/login/auth/login`, payload)
      .pipe(
        switchMap((res) =>
          from(this.saveSession(res, payload.email.trim())).pipe(map(() => res))
        )
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
      this.tokenCache = token.value || this.safeLocalGet(KEYS.token);
      this.emailCache = email.value || this.safeLocalGet(KEYS.email) || '';
      this.usuarioCache = this.parseUsuario(usuario.value) || this.parseUsuario(this.safeLocalGet(KEYS.usuario));
      this.hydrated = true;
    }).catch(() => {
      this.tokenCache = this.safeLocalGet(KEYS.token);
      this.emailCache = this.safeLocalGet(KEYS.email) || '';
      this.usuarioCache = this.parseUsuario(this.safeLocalGet(KEYS.usuario));
      this.hydrated = true;
    });

    return this.hydratePromise;
  }

  getToken(): string | null {
    return this.tokenCache;
  }

  async getTokenAsync(): Promise<string | null> {
    await this.hydrate();
    return this.tokenCache;
  }

  isLoggedIn(): boolean {
    return !!this.tokenCache;
  }

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

  getEmail(): string {
    return this.emailCache || '';
  }

  setUsuarioLocal(u: UsuarioLocal): void {
    this.usuarioCache = u;
    void this.setPersisted(KEYS.usuario, JSON.stringify(u));
  }

  getUsuarioLocal(): UsuarioLocal | null {
    return this.usuarioCache;
  }

  getNome(): string {
    return this.getUsuarioLocal()?.nome || 'Usuário';
  }

  private async saveSession(res: LoginResponse, email: string): Promise<void> {
    this.tokenCache = res.access_token;
    this.emailCache = email;

    await Promise.all([
      this.setPersisted(KEYS.token, res.access_token),
      this.setPersisted(KEYS.tokenType, res.token_type || 'Bearer'),
      this.setPersisted(KEYS.email, email)
    ]);

    this.hydrated = true;
  }

  private async setPersisted(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value });
    this.safeLocalSet(key, value); // fallback para web/PWA
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
