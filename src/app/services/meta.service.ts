import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';
import { MetaCreateRequest, MetaResponse } from '../models/meta.model';

@Injectable({ providedIn: 'root' })
export class MetaService {
  private http = inject(HttpClient);
  private url = `${API_BASE_URL}/metas`;

  listar(): Observable<MetaResponse[]> {
    return this.http.get<MetaResponse[]>(`${this.url}/me`);
  }
  criar(payload: MetaCreateRequest): Observable<MetaResponse> {
    return this.http.post<MetaResponse>(`${this.url}/`, payload);
  }
  editar(id: number, payload: MetaCreateRequest): Observable<MetaResponse> {
    return this.http.put<MetaResponse>(`${this.url}/${id}`, payload);
  }
  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
