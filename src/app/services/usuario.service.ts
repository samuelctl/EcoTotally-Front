import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';

export interface CadastroUsuarioRequest { nome: string; email: string; senha: string; cidade: string; }
export interface AtualizarUsuarioRequest { nome: string; email: string; senha: string; cidade: string; }
export interface UsuarioMeResponse {
  id?: number | string;
  nome?: string;
  email?: string;
  cidade?: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);

  cadastrar(payload: CadastroUsuarioRequest): Observable<unknown> {
    return this.http.post(`${API_BASE_URL}/usuario`, payload);
  }
  buscarMe(): Observable<UsuarioMeResponse> {
    return this.http.get<UsuarioMeResponse>(`${API_BASE_URL}/usuario/me`);
  }
  atualizar(payload: AtualizarUsuarioRequest): Observable<unknown> {
    return this.http.put(`${API_BASE_URL}/usuario/me`, payload);
  }
  deletar(): Observable<unknown> {
    return this.http.delete(`${API_BASE_URL}/usuario/me`);
  }
}
