import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, OnDestroy, inject, signal } from '@angular/core';
import * as L from 'leaflet';

import { MapaService, PontoReciclagem } from '../../services/mapa.service';
import { describeError } from '../../core/http-helpers';
import { LanguageService } from '../../core/language.service';

const reciclagemIcon = L.divIcon({
  className: 'eco-map-marker',
  html: '♻',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -18]
});

const userIcon = L.divIcon({
  className: 'eco-map-user-marker',
  html: '●',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
});

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.scss']
})
export class MapaComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly t = inject(LanguageService).t;
  private svc = inject(MapaService);

  pontos = signal<PontoReciclagem[]>([]);
  carregando = signal(true);
  erro = signal<string | null>(null);
  coordsUser = signal<{ lat: number; lon: number } | null>(null);

  private map?: L.Map;
  private markers: L.Marker[] = [];

  private readonly LAT = -15.793889;
  private readonly LON = -47.882778;

  ngOnInit(): void {
    this.coordsUser.set({ lat: this.LAT, lon: this.LON });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
      this.carregar();
      setTimeout(() => this.map?.invalidateSize(), 500);
    }, 100);
  }

  ngOnDestroy(): void {
    this.markers.forEach(marker => marker.remove());
    this.map?.remove();
  }

  private initMap(): void {
    if (this.map) return;

    this.map = L.map('map', {
      center: [this.LAT, this.LON],
      zoom: 13,
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      zoomControl: true,
      attributionControl: true
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19
    }).addTo(this.map);

    L.marker([this.LAT, this.LON], { icon: userIcon })
      .addTo(this.map)
      .bindPopup('Localização usada no teste');

    this.map.whenReady(() => {
      setTimeout(() => this.map?.invalidateSize(), 300);
    });
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.svc.listarPontos(this.LAT, this.LON).subscribe({
      next: (lista) => {
        this.pontos.set(lista);
        this.carregando.set(false);
        this.adicionarPontosNoMapa(lista);
        setTimeout(() => this.map?.invalidateSize(), 300);
      },
      error: (err) => {
        this.carregando.set(false);
        this.erro.set(describeError(err));
      }
    });
  }

  private adicionarPontosNoMapa(lista: PontoReciclagem[]): void {
    if (!this.map) return;

    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    lista.forEach((p) => {
      const marker = L.marker([p.latitude, p.longitude], {
        icon: reciclagemIcon
      })
        .addTo(this.map!)
        .bindPopup(`
          <strong>${p.nome || this.t()('map_point')}</strong><br>
          ${this.tipos(p).join(', ')}
        `);

      this.markers.push(marker);
    });

    if (lista.length > 0) {
      const bounds = L.latLngBounds([
        [this.LAT, this.LON],
        ...lista.map(p => [p.latitude, p.longitude] as [number, number])
      ]);

      this.map.fitBounds(bounds, {
        padding: [30, 30],
        maxZoom: 14
      });
    }
  }

  abrirNoMaps(p: PontoReciclagem): void {
    const url = `https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`;
    window.open(url, '_blank');
  }

  tipos(p: PontoReciclagem): string[] {
    return p.tipos_aceitos ?? p.tipos ?? [];
  }
}