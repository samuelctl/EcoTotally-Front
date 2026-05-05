import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription, forkJoin, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { POLL_INTERVAL_MS } from '../../core/api.config';
import { createSmartRefresh$ } from '../../core/smart-refresh';
import { ConsumoService } from '../../services/consumo.service';
import { SimulacaoService } from '../../services/simulacao.service';
import { MetaService } from '../../services/meta.service';
import { getConsumoValor, ConsumoResponse } from '../../models/consumo.model';
import { MetaResponse, metaValorObjetivo } from '../../models/meta.model';

interface MetaResumo {
  meta: MetaResponse;
  acumulado: number;
  pct: number;
  status: 'ok' | 'atencao' | 'estourada';
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private consumoSvc = inject(ConsumoService);
  private simSvc = inject(SimulacaoService);
  private metaSvc = inject(MetaService);

  nome = signal(this.auth.getNome());
  consumos = signal<ConsumoResponse[]>([]);
  metas = signal<MetaResponse[]>([]);
  totalSimulacoes = signal<number>(0);
  carregando = signal(true);

  totalConsumos = computed(() => this.consumos().length);
  somaGasto = computed(() => this.consumos().reduce((acc, c) => acc + getConsumoValor(c), 0));

  metasResumo = computed<MetaResumo[]>(() => {
    const cs = this.consumos();
    return this.metas().map((m) => {
      const acumulado = cs
        .filter((c) => c.meta_id === m.id_meta)
        .reduce((acc, c) => acc + getConsumoValor(c), 0);
      const objetivo = metaValorObjetivo(m);
      const pct = objetivo > 0 ? Math.min(200, (acumulado / objetivo) * 100) : 0;
      const status: MetaResumo['status'] =
        acumulado > objetivo ? 'estourada' : pct >= 80 ? 'atencao' : 'ok';
      return { meta: m, acumulado, pct, status };
    }).slice(0, 3);
  });

  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = createSmartRefresh$(POLL_INTERVAL_MS).pipe(
      switchMap(() => forkJoin({
        consumos: this.consumoSvc.listarMeus(),
        metas: this.metaSvc.listar()
      }))
    ).subscribe({
      next: ({ consumos, metas }) => {
        this.consumos.set(consumos);
        this.metas.set(metas);
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false)
    });

    this.simSvc.listar().subscribe({
      next: (s) => this.totalSimulacoes.set(s.length),
      error: () => { /* silencioso */ }
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }
}
