import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, forkJoin, switchMap } from 'rxjs';
import { ConsumoService } from '../../services/consumo.service';
import { MetaService } from '../../services/meta.service';
import { ConsumoRequest, ConsumoResponse, getConsumoId, getConsumoValor } from '../../models/consumo.model';
import { MetaResponse } from '../../models/meta.model';
import { POLL_INTERVAL_MS } from '../../core/api.config';
import { createSmartRefresh$ } from '../../core/smart-refresh';
import { describeError } from '../../core/http-helpers';
import { LanguageService } from '../../core/language.service';

@Component({
  selector: 'app-consumo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consumo.component.html',
  styleUrls: ['./consumo.component.scss']
})
export class ConsumoComponent implements OnInit, OnDestroy {
  readonly t = inject(LanguageService).t;
  private svc = inject(ConsumoService);
  private metaSvc = inject(MetaService);

  readonly tipos = ['Energia', 'Agua', 'Gas', 'Combustivel', 'Outro'];

  itens = signal<ConsumoResponse[]>([]);
  metas = signal<MetaResponse[]>([]);
  carregando = signal(true);
  erro = signal<string | null>(null);
  salvando = signal(false);

  // form
  tipo = 'Energia';
  gasto: number | null = null;
  data = new Date().toISOString().slice(0, 10);
  metaIdSelecionada: number | null = null;

  // metas filtradas pelo tipo selecionado (mais relevantes primeiro)
  metasDoTipo = computed<MetaResponse[]>(() => {
    return this.metas().filter((m) => m.tipo_meta === this.tipo);
  });

  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = createSmartRefresh$(POLL_INTERVAL_MS).pipe(
      switchMap(() => forkJoin({
        consumos: this.svc.listarMeus(),
        metas: this.metaSvc.listar()
      }))
    ).subscribe({
      next: ({ consumos, metas }) => {
        this.itens.set(this.ordenar(consumos));
        this.metas.set(metas);
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

  recarregar(): void {
    this.erro.set(null);
    this.carregando.set(true);
    this.svc.listarMeus().subscribe({
      next: (l) => { this.itens.set(this.ordenar(l)); this.carregando.set(false); },
      error: (err) => { this.carregando.set(false); this.erro.set(describeError(err)); }
    });
  }

  onTipoChange(): void {
    // Se a meta selecionada não for do novo tipo, limpa
    const meta = this.metas().find((m) => m.id_meta === this.metaIdSelecionada);
    if (meta && meta.tipo_meta !== this.tipo) this.metaIdSelecionada = null;
  }

  criar(): void {
    if (this.salvando() || this.gasto == null || isNaN(Number(this.gasto))) {
      this.erro.set('Informe um valor válido.');
      return;
    }
    const payload: ConsumoRequest = {
      tipo: this.tipo,
      gasto: Number(this.gasto),
      data: this.data,
      meta_id: this.metaIdSelecionada ?? null
    };

    const tempId = `tmp-${Date.now()}`;
    const otimista: ConsumoResponse = { ...payload, id: tempId };
    const snapshot = this.itens();
    this.itens.set(this.ordenar([otimista, ...snapshot]));
    this.salvando.set(true);
    this.erro.set(null);

    this.svc.criar(payload).subscribe({
      next: (criado) => {
        this.salvando.set(false);
        this.gasto = null;
        this.metaIdSelecionada = null;
        this.itens.set(this.ordenar(this.itens().map((c) =>
          (c.id === tempId ? { ...otimista, ...criado } : c)
        )));
      },
      error: (err) => {
        this.itens.set(snapshot);
        this.salvando.set(false);
        this.erro.set(describeError(err, 'Não foi possível criar o consumo.'));
      }
    });
  }

  deletar(item: ConsumoResponse): void {
    const id = getConsumoId(item);
    if (id == null) { this.erro.set('Item sem identificador.'); return; }

    const snapshot = this.itens();
    this.itens.set(snapshot.filter((c) => getConsumoId(c) !== id));
    this.erro.set(null);

    if (typeof id === 'string' && id.startsWith('tmp-')) return;

    this.svc.deletar(id).subscribe({
      error: (err) => {
        this.itens.set(snapshot);
        this.erro.set(describeError(err, 'Não foi possível deletar.'));
      }
    });
  }

  trackId = (_: number, item: ConsumoResponse) => getConsumoId(item) ?? Math.random();
  valor = (c: ConsumoResponse) => getConsumoValor(c);

  nomeMeta(metaId: number | null | undefined): string | null {
    if (!metaId) return null;
    const m = this.metas().find((x) => x.id_meta === metaId);
    return m ? m.tipo_meta : null;
  }

  private ordenar(lista: ConsumoResponse[]): ConsumoResponse[] {
    return [...lista].sort((a, b) => {
      const da = (a.data || '') as string;
      const db = (b.data || '') as string;
      return db.localeCompare(da);
    });
  }
}
