import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InsightsService, InsightsCompleto, RecomendacaoResponse } from '../../services/insights.service';
import { describeError } from '../../core/http-helpers';

interface BlocoIA {
  tipo: 'titulo' | 'sub' | 'paragrafo' | 'item' | 'destaque';
  texto: string;
}

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './insights.component.html',
  styleUrls: ['./insights.component.scss']
})
export class InsightsComponent implements OnInit {
  private svc = inject(InsightsService);

  dados = signal<InsightsCompleto | null>(null);
  iaTexto = signal<string | null>(null);
  carregando = signal(true);
  carregandoIa = signal(false);
  erro = signal<string | null>(null);

  janelaMeses = signal(3);
  mesesProjetados = signal(3);

  iaBlocos = computed<BlocoIA[]>(() => {
    const t = this.iaTexto();
    if (!t) return [];
    return this.parseIA(t);
  });

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.iaTexto.set(null);

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
        const t =
          typeof r.analise_ia === 'string'
            ? r.analise_ia
            : JSON.stringify(r.analise_ia, null, 2);

        this.iaTexto.set(t);
        this.carregandoIa.set(false);
      },
      error: (err) => {
        this.carregandoIa.set(false);
        this.erro.set(describeError(err));
      }
    });
  }

  // ✅ versão correta mantida (com download real + token)
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

  private parseIA(raw: string): BlocoIA[] {
    const linhas = raw.replace(/\r\n/g, '\n').split('\n');
    const blocos: BlocoIA[] = [];
    let buffer: string[] = [];

    const flush = () => {
      const txt = buffer.join(' ').trim();
      if (txt) {
        blocos.push({
          tipo: 'paragrafo',
          texto: this.formatInline(txt)
        });
      }
      buffer = [];
    };

    for (const linhaRaw of linhas) {
      const linha = linhaRaw.trim();

      if (!linha) {
        flush();
        continue;
      }

      const h = linha.match(/^(#{1,3})\s+(.+)$/);
      if (h) {
        flush();
        const nivel = h[1].length;
        blocos.push({
          tipo: nivel === 1 ? 'titulo' : 'sub',
          texto: this.formatInline(h[2])
        });
        continue;
      }

      const item = linha.match(/^[-*•]\s+(.+)$/);
      if (item) {
        flush();
        blocos.push({
          tipo: 'item',
          texto: this.formatInline(item[1])
        });
        continue;
      }

      const destaque = linha.match(/^([⚡💧🔥⛽🌱📊💡✅⚠️🎯📈📉🔋])\s*(.+)$/);
      if (destaque) {
        flush();
        blocos.push({
          tipo: 'destaque',
          texto: this.formatInline(`${destaque[1]} ${destaque[2]}`)
        });
        continue;
      }

      buffer.push(linha);
    }

    flush();
    return blocos;
  }

  private formatInline(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }
}