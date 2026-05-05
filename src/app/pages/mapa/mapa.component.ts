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

  private map!: L.Map;

  // 📍 Brasília fixa
  private LAT = -15.793889;
  private LON = -47.882778;

  ngOnInit(): void {
    this.carregar();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  initMap() {
    this.map = L.map('map', {
      center: [this.LAT, this.LON],
      zoom: 13,
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);
  }

  carregar(): void {
    this.svc.listarPontos(this.LAT, this.LON).subscribe({
      next: (lista) => {
        this.pontos.set(lista);
        this.carregando.set(false);

        // 🔥 adiciona os pontos no mapa
        lista.forEach(p => {
          L.marker([p.latitude, p.longitude])
            .addTo(this.map)
            .bindPopup(`<b>${p.nome}</b><br>${(p.tipos || []).join(', ')}`);
        });
      },
      error: (err) => {
        this.carregando.set(false);
        this.erro.set(describeError(err));
      }
    });
  }
}