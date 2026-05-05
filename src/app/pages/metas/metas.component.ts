import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, forkJoin, switchMap } from 'rxjs';
import { POLL_INTERVAL_MS } from '../../core/api.config';
import { createSmartRefresh$ } from '../../core/smart-refresh';
import { describeError } from '../../core/http-helpers';
import { LanguageService } from '../../core/language.service';
import { MetaService } from '../../services/meta.service';
import { ConsumoService } from '../../services/consumo.service';
import { MetaCreateRequest, MetaResponse, metaValorObjetivo } from '../../models/meta.model';
import { ConsumoResponse, getConsumoValor } from '../../models/consumo.model';
import { NotificacaoService } from '../../services/notificacao.service';

interface MetaComProgresso {
  meta: MetaResponse;
  acumulado: number;
  pct: number;
  restante: number;
  status: 'ok' | 'atencao' | 'estourada';
  diasRestantes: number;
}

@Component({
  selector: 'app-metas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './metas.component.html',
  styleUrls: ['./metas.component.scss']
})
export class MetasComponent implements OnInit, OnDestroy {
  readonly t = inject(LanguageService).t;
  private metaSvc = inject(MetaService);
  private consumoSvc = inject(ConsumoService);
  private notifSvc = inject(NotificacaoService);

  readonly tipos = ['Energia', 'Agua', 'Gas', 'Combustivel', 'Outro'];

  metas = signal<MetaResponse[]>([]);
  consumos = signal<ConsumoResponse[]>([]);
  carregando = signal(true);
  erro = signal<string | null>(null);
  salvando = signal(false);

  // form
  modoEdicao = signal<number | null>(null);
  formAberto = signal(false);
  tipoMeta = 'Energia';
  valorObjetivo: number | null = null;
  dataInicio = new Date().toISOString().slice(0, 10);
  dataFim = (() => {
    const d = new Date(); d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  })();

  private sub?: Subscription;

  metasComProgresso = computed<MetaComProgresso[]>(() => {
    const cs = this.consumos();
    const hoje = new Date();
    return this.metas().map((m) => {
      const acumulado = cs
        .filter((c) => c.meta_id === m.id_meta)
        .reduce((acc, c) => acc + getConsumoValor(c), 0);
      const objetivo = metaValorObjetivo(m);
      const pct = objetivo > 0 ? Math.min(200, (acumulado / objetivo) * 100) : 0;
      const restante = Math.max(0, objetivo - acumulado);
      const status: MetaComProgresso['status'] =
        acumulado > objetivo ? 'estourada' : pct >= 80 ? 'atencao' : 'ok';
      const fim = new Date(m.data_fim);
      const diasRestantes = Math.max(
        0,
        Math.ceil((fim.getTime() - hoje.getTime()) / 86400000)
      );
      return { meta: m, acumulado, pct, restante, status, diasRestantes };
    }).sort((a, b) => a.diasRestantes - b.diasRestantes);
  });

  ngOnInit(): void {
    this.sub = createSmartRefresh$(POLL_INTERVAL_MS).pipe(
      switchMap(() => forkJoin({
        metas: this.metaSvc.listar(),
        consumos: this.consumoSvc.listarMeus()
      }))
    ).subscribe({
      next: ({ metas, consumos }) => {
        this.metas.set(metas);
        this.consumos.set(consumos);
        this.carregando.set(false);
        this.erro.set(null);
        // Fire browser notifications for goals at risk
        const progresso = this.metasComProgresso();
        this.notifSvc.verificarMetas(progresso.map(mp => ({
          tipo: mp.meta.tipo_meta,
          nome: mp.meta.tipo_meta,
          pct: mp.pct,
          status: mp.status,
        })));
      },
      error: (err) => {
        this.carregando.set(false);
        this.erro.set(describeError(err));
      }
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  abrirNova(): void {
    this.modoEdicao.set(null);
    this.tipoMeta = 'Energia';
    this.valorObjetivo = null;
    this.dataInicio = new Date().toISOString().slice(0, 10);
    const f = new Date(); f.setMonth(f.getMonth() + 1);
    this.dataFim = f.toISOString().slice(0, 10);
    this.formAberto.set(true);
  }

  abrirEdicao(m: MetaResponse): void {
    this.modoEdicao.set(m.id_meta);
    this.tipoMeta = m.tipo_meta;
    this.valorObjetivo = Number(m.valor_objetivo);
    this.dataInicio = (m.data_inicio || '').slice(0, 10);
    this.dataFim = (m.data_fim || '').slice(0, 10);
    this.formAberto.set(true);
  }

  fecharForm(): void { this.formAberto.set(false); }

  salvar(): void {
    if (this.salvando()) return;
    if (this.valorObjetivo == null || isNaN(Number(this.valorObjetivo)) || Number(this.valorObjetivo) <= 0) {
      this.erro.set('Informe um valor objetivo maior que zero.');
      return;
    }
    if (this.dataFim < this.dataInicio) {
      this.erro.set('Data fim deve ser depois da data início.');
      return;
    }
    const payload: MetaCreateRequest = {
      tipo_meta: this.tipoMeta,
      valor_objetivo: Number(this.valorObjetivo),
      data_inicio: this.dataInicio,
      data_fim: this.dataFim
    };
    this.salvando.set(true);
    this.erro.set(null);
    const id = this.modoEdicao();
    const obs = id != null ? this.metaSvc.editar(id, payload) : this.metaSvc.criar(payload);
    obs.subscribe({
      next: (saved) => {
        this.salvando.set(false);
        const lista = this.metas();
        if (id != null) {
          this.metas.set(lista.map((m) => m.id_meta === id ? { ...m, ...saved } : m));
        } else {
          this.metas.set([saved, ...lista]);
        }
        this.formAberto.set(false);
      },
      error: (err) => {
        this.salvando.set(false);
        this.erro.set(describeError(err, 'Não foi possível salvar a meta.'));
      }
    });
  }

  deletar(m: MetaResponse): void {
    if (!confirm(`Excluir a meta "${m.tipo_meta}"?`)) return;
    const snap = this.metas();
    this.metas.set(snap.filter((x) => x.id_meta !== m.id_meta));
    this.metaSvc.deletar(m.id_meta).subscribe({
      error: (err) => {
        this.metas.set(snap);
        this.erro.set(describeError(err, 'Não foi possível excluir.'));
      }
    });
  }

  iconeTipo(tipo: string): string {
    switch (tipo) {
      case 'Energia': return '⚡';
      case 'Agua': return '💧';
      case 'Gas': return '🔥';
      case 'Combustivel': return '⛽';
      default: return '🎯';
    }
  }
}
