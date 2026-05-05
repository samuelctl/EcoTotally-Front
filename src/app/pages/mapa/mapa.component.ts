import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';

import { MapaService, PontoReciclagem } from '../../services/mapa.service';
import { describeError } from '../../core/http-helpers';
import { LanguageService } from '../../core/language.service';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.scss']
})
export class MapaComponent implements OnInit, AfterViewInit {
  readonly t = inject(LanguageService).t;
  private svc = inject(MapaService);

  pontos = signal<PontoReciclagem[]>([]);
  carregando = signal(true);
  erro = signal<string | null>(null);
  coordsUser = signal<{ lat: number; lon: number } | null>(null);

  private map!: L.Map;
  private markers: L.Marker[] = [];

  // 📍 Brasília fixa para teste
  private LAT = -15.793889;
  private LON = -47.882778;

  ngOnInit(): void {
    this.coordsUser.set({ lat: this.LAT, lon: this.LON });
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.carregar();
  }

  initMap(): void {
    this.map = L.map('map', {
      center: [this.LAT, this.LON],
      zoom: 13,
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    setTimeout(() => {
    this.map.invalidateSize();
  }, 300);

    L.marker([this.LAT, this.LON])
      .addTo(this.map)
      .bindPopup('Localização usada no teste');
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.svc.listarPontos(this.LAT, this.LON).subscribe({
      next: (lista) => {
        this.pontos.set(lista);
        this.carregando.set(false);
        this.adicionarPontosNoMapa(lista);
      },
      error: (err) => {
        this.carregando.set(false);
        this.erro.set(describeError(err));
      }
    });
  }

  adicionarPontosNoMapa(lista: PontoReciclagem[]): void {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    lista.forEach((p) => {
      const marker = L.marker([p.latitude, p.longitude])
        .addTo(this.map)
        .bindPopup(`
          <strong>${p.nome || this.t()('map_point')}</strong><br>
          ${this.tipos(p).join(', ')}
        `);

      this.markers.push(marker);
    });
  }

  abrirNoMaps(p: PontoReciclagem): void {
    const url = `https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`;
    window.open(url, '_blank');
  }

  tipos(p: PontoReciclagem): string[] {
    return p.tipos_aceitos ?? p.tipos ?? [];
  }
}