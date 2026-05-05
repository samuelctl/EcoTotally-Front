import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InsightsService, InsightsCompleto, RecomendacaoResponse } from '../../services/insights.service';
import { describeError } from '../../core/http-helpers';
import { LanguageService } from '../../core/language.service';

interface AnaliseIA {
  diagnostico_geral: string;
  alerta_amostra_regional: string;
  nivel_urgencia: 'alto' | 'medio' | 'baixo';
  economia_estimativa_mensal: number;
  recomendacoes: {
    titulo: string;
    descricao: string;
    categoria: string;
    impacto: 'alto' | 'medio' | 'baixo';
  }[];
}

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './insights.component.html',
  styleUrls: ['./insights.component.scss']
})
export class InsightsComponent implements OnInit {
  readonly t = inject(LanguageService).t;
  private svc = inject(InsightsService);

  dados = signal<InsightsCompleto | null>(null);
  iaObjeto = signal<AnaliseIA | null>(null);
  carregando = signal(true);
  carregandoIa = signal(false);
  erro = signal<string | null>(null);

  janelaMeses = signal(3);
  mesesProjetados = signal(3);

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.iaObjeto.set(null);

    this.svc.getProjecao(this.mesesProjetados(), this.janelaMeses()).subscribe({
      next: (d) => {
        this.dados.set(d);
        this.carregando.set(false);
      },
      error: (err) => {
        this.carregando.set(false);
        this.erro.set(describeError(err));
      }
    });
  }

  pedirIa(): void {
    if (this.carregandoIa()) return;
    this.carregandoIa.set(true);

    this.svc.getRecomendacaoIA(this.mesesProjetados(), this.janelaMeses()).subscribe({
      next: (r: RecomendacaoResponse) => {
        this.iaObjeto.set(r.analise_ia as AnaliseIA);
        this.carregandoIa.set(false);
      },
      error: (err) => {
        this.carregandoIa.set(false);
        this.erro.set(describeError(err));
      }
    });
  }

  baixandoPdf = signal(false);

  async baixarRelatorio(): Promise<void> {
    if (this.baixandoPdf()) return;
    this.baixandoPdf.set(true);
    this.erro.set(null);

    try {
      await this.svc.baixarRelatorioPdf();
    } catch (err) {
      this.erro.set(describeError(err));
    } finally {
      this.baixandoPdf.set(false);
    }
  }

  categorias(): { nome: string; info: { ultimo_mes: number; tendencia: string; total_projetado: number; crescimento_percentual: number } }[] {
    const d = this.dados();
    if (!d?.categorias) return [];
    return Object.keys(d.categorias).map((k) => ({
      nome: k,
      info: d.categorias[k]
    }));
  }

  iconeTendencia(t: string): string {
    return t === 'alta' ? '📈' : t === 'queda' ? '📉' : '➡️';
  }

  iconeTipo(nome: string): string {
    switch (nome.toLowerCase()) {
      case 'energia': return '⚡';
      case 'agua':
      case 'água': return '💧';
      case 'gas':
      case 'gás': return '🔥';
      case 'combustivel':
      case 'combustível': return '⛽';
      default: return '📊';
    }
  }

  iconeImpacto(nivel: string): string {
    return nivel === 'alto' ? '🔴' : nivel === 'medio' ? '🟡' : '🟢';
  }
}
