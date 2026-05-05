import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Subscription, forkJoin, switchMap } from 'rxjs';
import { ConsumoService } from '../../services/consumo.service';
import { SimulacaoService } from '../../services/simulacao.service';
import { ConsumoResponse, getConsumoValor } from '../../models/consumo.model';
import { SimulacaoResponse } from '../../models/simulacao.model';
import { POLL_INTERVAL_MS } from '../../core/api.config';
import { createSmartRefresh$ } from '../../core/smart-refresh';
import { describeError } from '../../core/http-helpers';

interface Barra { label: string; valor: number; cor: string; sub?: string; }

const CORES = ['#2ef8a0', '#19c97d', '#7ff5bb', '#ffd66e', '#ff8b8b', '#9ad6ff', '#c79bff', '#ff9ad6'];

const TARIFA_SIM = {
  Energia: { unidade: 'kWh', preco: 0.92 },
  Agua: { unidade: 'm³', preco: 9.50 }
} as const;

@Component({
  selector: 'app-graficos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './graficos.component.html',
  styleUrls: ['./graficos.component.scss']
})
export class GraficosComponent implements OnInit, OnDestroy {
  private cSvc = inject(ConsumoService);
  private sSvc = inject(SimulacaoService);

  consumos = signal<ConsumoResponse[]>([]);
  simulacoes = signal<SimulacaoResponse[]>([]);
  carregando = signal(true);
  erro = signal<string | null>(null);

  aba = signal<'consumos' | 'simulacoes'>('consumos');

  // ===== Consumos =====
  porTipoConsumo = computed<Barra[]>(() => {
    const map = new Map<string, number>();
    for (const c of this.consumos()) {
      const k = (c.tipo || 'Outro') as string;
      map.set(k, (map.get(k) || 0) + getConsumoValor(c));
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, valor], i) => ({ label, valor, cor: CORES[i % CORES.length] }));
  });

  totalConsumos = computed(() => this.porTipoConsumo().reduce((a, b) => a + b.valor, 0));
  maxConsumo = computed(() => Math.max(1, ...this.porTipoConsumo().map(b => b.valor)));

  // ===== Simulações =====
  porTipoSimulacao = computed<Barra[]>(() => {
    const acc = new Map<string, { qtd: number; consumo: number; custo: number }>();
    for (const s of this.simulacoes()) {
      const t = (s.tipo || 'Outro') as string;
      const cur = acc.get(t) || { qtd: 0, consumo: 0, custo: 0 };
      const consumoVal = Number(s.consumo_valor ?? s.consumo ?? 0);
      const custoBack = Number(s.custo ?? s.valor_calculado ?? 0);
      const tarifa = (TARIFA_SIM as any)[t]?.preco ?? 0;
      const custo = custoBack > 0 ? custoBack : consumoVal * tarifa;
      cur.qtd += 1;
      cur.consumo += consumoVal;
      cur.custo += custo;
      acc.set(t, cur);
    }
    return Array.from(acc.entries())
      .sort((a, b) => b[1].custo - a[1].custo)
      .map(([label, info], i) => {
        const unidade = (TARIFA_SIM as any)[label]?.unidade ?? 'un';
        return {
          label,
          valor: info.custo,
          cor: CORES[i % CORES.length],
          sub: `${info.qtd} simulações · ${info.consumo.toFixed(1)} ${unidade}`
        };
      });
  });

  totalSimulacoes = computed(() => this.porTipoSimulacao().reduce((a, b) => a + b.valor, 0));
  maxSimulacao = computed(() => Math.max(1, ...this.porTipoSimulacao().map(b => b.valor)));

  // ===== Tendência mensal de consumos =====
  tendenciaMensal = computed<{ label: string; valor: number; pct: number }[]>(() => {
    const map = new Map<string, number>();
    for (const c of this.consumos()) {
      const data = (c.data || '') as string;
      if (!data) continue;
      const ym = data.slice(0, 7); // yyyy-mm
      map.set(ym, (map.get(ym) || 0) + getConsumoValor(c));
    }
    const entries = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
    const max = Math.max(1, ...entries.map(([, v]) => v));
    return entries.map(([ym, valor]) => {
      const [y, m] = ym.split('-');
      const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return {
        label: `${nomes[Number(m) - 1] || m}/${y.slice(2)}`,
        valor,
        pct: Math.round((valor / max) * 100)
      };
    });
  });

  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = createSmartRefresh$(POLL_INTERVAL_MS).pipe(
      switchMap(() => forkJoin({
        consumos: this.cSvc.listarMeus(),
        simulacoes: this.sSvc.listar()
      }))
    ).subscribe({
      next: ({ consumos, simulacoes }) => {
        this.consumos.set(consumos);
        this.simulacoes.set(simulacoes);
        this.carregando.set(false);
        this.erro.set(null);
      },
      error: (err) => {
        this.carregando.set(false);
        this.erro.set(describeError(err));
      }
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  pct(b: Barra, max: number): number {
    return Math.round((b.valor / max) * 100);
  }

  setAba(a: 'consumos' | 'simulacoes') { this.aba.set(a); }
}
