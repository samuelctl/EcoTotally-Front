import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';
import { CriarSimulacaoRequest, SimulacaoResponse } from '../models/simulacao.model';

@Injectable({ providedIn: 'root' })
export class SimulacaoService {
  private http = inject(HttpClient);
  private url = `${API_BASE_URL}/simulacoes`;

  listar(): Observable<SimulacaoResponse[]> {
    return this.http.get<SimulacaoResponse[]>(`${this.url}/`);
  }
  criar(payload: CriarSimulacaoRequest): Observable<SimulacaoResponse> {
    return this.http.post<SimulacaoResponse>(`${this.url}/`, payload);
  }
  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
