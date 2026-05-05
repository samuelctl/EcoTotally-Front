import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, switchMap } from 'rxjs';
import { POLL_INTERVAL_MS } from '../../core/api.config';
import { createSmartRefresh$ } from '../../core/smart-refresh';
import { SimulacaoService } from '../../services/simulacao.service';
import { CriarSimulacaoRequest, SimulacaoResponse, getSimulacaoId } from '../../models/simulacao.model';
import { describeError } from '../../core/http-helpers';
import { LanguageService } from '../../core/language.service';

// Tarifas médias de referência (Brasil) – usadas só pra estimar custo no cliente
// quando o backend não retorna `custo`/`valor_calculado`.
const TARIFA = {
  Energia: { unidade: 'kWh', preco: 0.92 },
  Agua: { unidade: 'm³', preco: 9.50 }
};

@Component({
  selector: 'app-simulacao',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './simulacao.component.html',
  styleUrls: ['./simulacao.component.scss']
})
export class SimulacaoComponent implements OnInit, OnDestroy {
  readonly t = inject(LanguageService).t;
  private svc = inject(SimulacaoService);

  readonly tipos = ['Energia', 'Agua'];

  itens = signal<SimulacaoResponse[]>([]);
  carregando = signal(true);
  erro = signal<string | null>(null);
  salvando = signal(false);

  atividade = '';
  tipo = 'Energia';
  consumoValor: number | null = null;

  private sub?: Subscription;

  // Resumo agregado para exibir no topo
  resumo = computed(() => {
    const lista = this.itens();
    const totalCusto = lista.reduce((acc, s) => acc + this.custoEstimado(s), 0);
    return { qtd: lista.length, totalCusto };
  });

  ngOnInit(): void {
    this.sub = createSmartRefresh$(POLL_INTERVAL_MS).pipe(
      switchMap(() => this.svc.listar())
    ).subscribe({
      next: (l) => { this.itens.set(l); this.carregando.set(false); this.erro.set(null); },
      error: (err) => { this.carregando.set(false); this.erro.set(describeError(err)); }
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  recarregar(): void {
    this.erro.set(null); this.carregando.set(true);
    this.svc.listar().subscribe({
      next: (l) => { this.itens.set(l); this.carregando.set(false); },
      error: (err) => { this.carregando.set(false); this.erro.set(describeError(err)); }
    });
  }

  criar(): void {
    if (this.salvando()) return;
    if (!this.atividade.trim() || this.consumoValor == null) {
      this.erro.set('Preencha atividade e valor.');
      return;
    }
    const payload: CriarSimulacaoRequest = {
      atividade: this.atividade.trim(),
      tipo: this.tipo,
      consumo_valor: Number(this.consumoValor)
    };

    const tempId = -Date.now();
    const otimista: SimulacaoResponse = { ...payload, id_simulacao: tempId };
    const snapshot = this.itens();
    this.itens.set([otimista, ...snapshot]);
    this.salvando.set(true);
    this.erro.set(null);

    this.svc.criar(payload).subscribe({
      next: (criado) => {
        this.salvando.set(false);
        this.atividade = '';
        this.consumoValor = null;
        this.itens.set(this.itens().map((s) =>
          (s.id_simulacao === tempId ? { ...otimista, ...criado } : s)
        ));
      },
      error: (err) => {
        this.itens.set(snapshot);
        this.salvando.set(false);
        this.erro.set(describeError(err, 'Não foi possível criar a simulação.'));
      }
    });
  }

  deletar(item: SimulacaoResponse): void {
    const id = getSimulacaoId(item);
    if (id == null) { this.erro.set('Simulação sem identificador.'); return; }

    const snapshot = this.itens();
    this.itens.set(snapshot.filter((s) => getSimulacaoId(s) !== id));
    this.erro.set(null);

    if (id < 0) return;

    this.svc.deletar(id).subscribe({
      error: (err) => {
        this.itens.set(snapshot);
        this.erro.set(describeError(err, 'Não foi possível deletar.'));
      }
    });
  }

  trackId = (_: number, s: SimulacaoResponse) => getSimulacaoId(s) ?? Math.random();

  /** Valor de consumo bruto (kWh, m³, …) */
  consumo(s: SimulacaoResponse): number {
    return Number(s.consumo_valor ?? s.consumo ?? 0);
  }

  /** Unidade de medida segundo o tipo */
  unidade(s: SimulacaoResponse): string {
    const t = (s.tipo || '') as keyof typeof TARIFA;
    return TARIFA[t]?.unidade ?? 'un';
  }

  /** Custo em R$ — usa valor do backend se houver, senão estima */
  custoEstimado(s: SimulacaoResponse): number {
    const back = Number(s.custo ?? s.valor_calculado ?? 0);
    if (back > 0) return back;
    const t = (s.tipo || '') as keyof typeof TARIFA;
    const preco = TARIFA[t]?.preco ?? 0;
    return this.consumo(s) * preco;
  }
}
