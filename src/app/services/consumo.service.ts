import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';
import { ConsumoRequest, ConsumoResponse } from '../models/consumo.model';

@Injectable({ providedIn: 'root' })
export class ConsumoService {
  private http = inject(HttpClient);
  private url = `${API_BASE_URL}/consumos`;

  listarMeus(): Observable<ConsumoResponse[]> {
    return this.http.get<ConsumoResponse[]>(`${this.url}/me`);
  }
  criar(payload: ConsumoRequest): Observable<ConsumoResponse> {
    return this.http.post<ConsumoResponse>(`${this.url}/`, payload);
  }
  editar(id: number | string, payload: ConsumoRequest): Observable<ConsumoResponse> {
    return this.http.put<ConsumoResponse>(`${this.url}/${id}`, payload);
  }
  deletar(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
