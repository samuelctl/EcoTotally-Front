import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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

  listarPontos(lat = -15.793889, lon = -47.882778): Observable<PontoReciclagem[]> {
    const params = new HttpParams()
      .set('lat', String(lat))
      .set('lon', String(lon));

    return this.http
      .get<PontoReciclagem[]>(`${API_BASE_URL}/mapa/reciclagem`, { params })
      .pipe(
        map((pontos) =>
          (pontos ?? [])
            .filter((p) => Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude)))
            .map((p) => ({
              ...p,
              latitude: Number(p.latitude),
              longitude: Number(p.longitude),
              tipos_aceitos: p.tipos_aceitos ?? p.tipos ?? []
            }))
        )
      );
  }
}
