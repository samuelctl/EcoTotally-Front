import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_BASE_URL } from '../core/api.config';

export interface PontoReciclagem {
  id?: number;
  nome?: string;
  latitude: number;
  longitude: number;
  tipos_aceitos?: string[];
  tipos?: string[];
  descricao?: string;
  endereco?: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class MapaService {
  private http = inject(HttpClient);

  private fallback: PontoReciclagem[] = [
    { nome: 'Ponto Demo 1', latitude: -15.791459, longitude: -47.8990381, tipos_aceitos: ['vidro', 'papel'] },
    { nome: 'Ponto Demo 2', latitude: -15.8052963, longitude: -47.9173675, tipos_aceitos: ['plástico', 'metal'] },
    { nome: 'Ponto Demo 3', latitude: -15.8091535, longitude: -47.923036, tipos_aceitos: ['eletrônicos'] }
  ];

  listarPontos(lat = -15.8, lon = -47.9): Observable<PontoReciclagem[]> {
    return this.http
      .get<PontoReciclagem[]>(`${API_BASE_URL}/mapa/reciclagem?lat=${lat}&lon=${lon}`)
      .pipe(catchError(() => of(this.fallback)));
  }
}
