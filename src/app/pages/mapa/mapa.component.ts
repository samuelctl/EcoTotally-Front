import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
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
export class MapaComponent implements OnInit {
  readonly t = inject(LanguageService).t;
  private svc = inject(MapaService);

  pontos = signal<PontoReciclagem[]>([]);
  carregando = signal(true);
  erro = signal<string | null>(null);
  coordsUser = signal<{ lat: number; lon: number } | null>(null);

  // 🔥 FLAG DE TESTE
  private USE_FAKE_LOCATION = true;

  // 📍 Brasília
  private FAKE_LAT = -15.793889;
  private FAKE_LON = -47.882778;

  ngOnInit(): void {
    if (this.USE_FAKE_LOCATION) {
      // 👉 usa localização fixa
      this.coordsUser.set({ lat: this.FAKE_LAT, lon: this.FAKE_LON });
      this.carregar(this.FAKE_LAT, this.FAKE_LON);
      return;
    }

    // 👉 localização real (quando desligar o modo teste)
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          this.coordsUser.set({ lat: p.coords.latitude, lon: p.coords.longitude });
          this.carregar(p.coords.latitude, p.coords.longitude);
        },
        () => this.carregar(this.FAKE_LAT, this.FAKE_LON) // fallback
      );
    } else {
      this.carregar(this.FAKE_LAT, this.FAKE_LON);
    }
  }

  carregar(lat = this.FAKE_LAT, lon = this.FAKE_LON): void {
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