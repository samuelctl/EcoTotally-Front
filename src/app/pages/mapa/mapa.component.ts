import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MapaService, PontoReciclagem } from '../../services/mapa.service';
import { describeError } from '../../core/http-helpers';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.scss']
})
export class MapaComponent implements OnInit {
  private svc = inject(MapaService);

  pontos = signal<PontoReciclagem[]>([]);
  carregando = signal(true);
  erro = signal<string | null>(null);
  coordsUser = signal<{ lat: number; lon: number } | null>(null);

  ngOnInit(): void {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          this.coordsUser.set({ lat: p.coords.latitude, lon: p.coords.longitude });
          this.carregar(p.coords.latitude, p.coords.longitude);
        },
        () => this.carregar()
      );
    } else { this.carregar(); }
  }

  carregar(lat = -15.8, lon = -47.9): void {
    this.svc.listarPontos(lat, lon).subscribe({
      next: (l) => { this.pontos.set(l); this.carregando.set(false); },
      error: (err) => { this.carregando.set(false); this.erro.set(describeError(err)); }
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
