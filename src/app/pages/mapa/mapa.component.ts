import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MapaService, PontoReciclagem } from '../../services/mapa.service';
import { describeError } from '../../core/http-helpers';
import { LanguageService } from '../../core/language.service';

interface MapaTile {
  x: number;
  y: number;
  z: number;
  url: string;
}

interface PontoNoMapa {
  ponto: PontoReciclagem;
  left: number;
  top: number;
}

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.scss']
})
export class MapaComponent implements OnInit {
  readonly t = inject(LanguageService).t;
  private svc = inject(MapaService);

  pontos = signal<PontoReciclagem[]>([]);
  carregando = signal(true);
  erro = signal<string | null>(null);
  coordsUser = signal<{ lat: number; lon: number } | null>(null);

  private readonly USE_FAKE_LOCATION = true;
  private readonly BRASILIA_LAT = -15.793889;
  private readonly BRASILIA_LON = -47.882778;
  private readonly MAP_ZOOM = 13;
  private readonly TILE_SIZE = 256;
  private readonly GRID_SIZE = 3;

  tiles = computed<MapaTile[]>(() => {
    const centro = this.coordsUser() ?? { lat: this.BRASILIA_LAT, lon: this.BRASILIA_LON };
    const centerTileX = Math.floor(this.lonToTile(centro.lon, this.MAP_ZOOM));
    const centerTileY = Math.floor(this.latToTile(centro.lat, this.MAP_ZOOM));
    const tiles: MapaTile[] = [];

    for (let y = -1; y <= 1; y++) {
      for (let x = -1; x <= 1; x++) {
        const tileX = centerTileX + x;
        const tileY = centerTileY + y;
        tiles.push({
          x: tileX,
          y: tileY,
          z: this.MAP_ZOOM,
          url: `https://tile.openstreetmap.org/${this.MAP_ZOOM}/${tileX}/${tileY}.png`
        });
      }
    }

    return tiles;
  });

  pontosNoMapa = computed<PontoNoMapa[]>(() => {
    const centro = this.coordsUser() ?? { lat: this.BRASILIA_LAT, lon: this.BRASILIA_LON };
    const centerTileX = Math.floor(this.lonToTile(centro.lon, this.MAP_ZOOM));
    const centerTileY = Math.floor(this.latToTile(centro.lat, this.MAP_ZOOM));
    const topLeftX = (centerTileX - 1) * this.TILE_SIZE;
    const topLeftY = (centerTileY - 1) * this.TILE_SIZE;
    const totalPixels = this.GRID_SIZE * this.TILE_SIZE;

    return this.pontos()
      .map((ponto) => {
        const x = this.lonToTile(ponto.longitude, this.MAP_ZOOM) * this.TILE_SIZE;
        const y = this.latToTile(ponto.latitude, this.MAP_ZOOM) * this.TILE_SIZE;

        return {
          ponto,
          left: ((x - topLeftX) / totalPixels) * 100,
          top: ((y - topLeftY) / totalPixels) * 100
        };
      })
      .filter((m) => m.left >= -5 && m.left <= 105 && m.top >= -5 && m.top <= 105);
  });

  ngOnInit(): void {
    if (this.USE_FAKE_LOCATION) {
      this.coordsUser.set({ lat: this.BRASILIA_LAT, lon: this.BRASILIA_LON });
      this.carregar(this.BRASILIA_LAT, this.BRASILIA_LON);
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          this.coordsUser.set({ lat: p.coords.latitude, lon: p.coords.longitude });
          this.carregar(p.coords.latitude, p.coords.longitude);
        },
        () => {
          this.coordsUser.set({ lat: this.BRASILIA_LAT, lon: this.BRASILIA_LON });
          this.carregar(this.BRASILIA_LAT, this.BRASILIA_LON);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    } else {
      this.coordsUser.set({ lat: this.BRASILIA_LAT, lon: this.BRASILIA_LON });
      this.carregar(this.BRASILIA_LAT, this.BRASILIA_LON);
    }
  }

  carregar(lat = this.BRASILIA_LAT, lon = this.BRASILIA_LON): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.svc.listarPontos(lat, lon).subscribe({
      next: (lista) => {
        this.pontos.set(lista);
        this.carregando.set(false);
      },
      error: (err) => {
        this.pontos.set([]);
        this.carregando.set(false);
        this.erro.set(describeError(err));
      }
    });
  }

  abrirNoMaps(p: PontoReciclagem): void {
    const url = `https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`;
    window.open(url, '_blank');
  }

  tipos(p: PontoReciclagem): string[] {
    return p.tipos_aceitos ?? p.tipos ?? [];
  }

  private lonToTile(lon: number, zoom: number): number {
    return ((lon + 180) / 360) * Math.pow(2, zoom);
  }

  private latToTile(lat: number, zoom: number): number {
    const latRad = (lat * Math.PI) / 180;
    return (
      (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) /
      2
    ) * Math.pow(2, zoom);
  }
}
