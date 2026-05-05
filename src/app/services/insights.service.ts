import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpContext, HttpContextToken } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';
import { AuthService } from '../core/auth.service';

export const CUSTOM_TIMEOUT_MS = new HttpContextToken<number | null>(() => null);

export interface CategoriaInsight {
  ultimo_mes: number;
  crescimento_percentual: number;
  tendencia: 'alta' | 'queda' | 'estavel';
  previsao: number[];
  total_projetado: number;
}

export interface ComparativoTipo {
  media_mensal_usuario: number;
  media_mensal_regional: number;
  diferenca: number;
  situacao: string;
}

export interface ComparativoRegional {
  media_mensal_usuario: number;
  media_mensal_regional: number;
  diferenca: number;
  situacao: string;
  total_usuarios_regiao: number;
  confianca_amostra: { nivel: string; mensagem: string };
  por_tipo: { [tipo: string]: ComparativoTipo };
}

export interface Score {
  valor: number;
  nivel: string;
  motivos: string[];
}

export interface InsightsCompleto {
  usuario_id: number;
  regiao: string;
  janela_meses_analisada: number;
  meses_considerados: string[];
  meses_projetados: number;
  previsao_total: number;
  categorias: { [tipo: string]: CategoriaInsight };
  comparativo_regional: ComparativoRegional;
  score: Score;
}

export interface RecomendacaoResponse {
  usuario_id: number;
  insights: InsightsCompleto;
  analise_ia: string | unknown;
}

@Injectable({ providedIn: 'root' })
export class InsightsService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  getProjecao(mesesProjetados = 3, janelaMeses = 3): Observable<InsightsCompleto> {
    return this.http.get<InsightsCompleto>(
      `${API_BASE_URL}/insights/projecao?meses_projetados=${mesesProjetados}&janela_meses=${janelaMeses}`
    );
  }

  getRecomendacaoIA(mesesProjetados = 3, janelaMeses = 3): Observable<RecomendacaoResponse> {
    return this.http.post<RecomendacaoResponse>(
      `${API_BASE_URL}/ia/recomendacoes?meses_projetados=${mesesProjetados}&janela_meses=${janelaMeses}`,
      {},
      { context: new HttpContext().set(CUSTOM_TIMEOUT_MS, 60_000) }
    );
  }

  urlRelatorio(): string {
    return `${API_BASE_URL}/pdf/relatorio`;
  }

  async baixarRelatorioPdf(filename = 'relatorio_ecototally.pdf'): Promise<void> {
    const token = this.auth.getToken();

    if (!token) {
      throw new Error('Você precisa estar logado para baixar o relatório.');
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    try {
      // Tenta baixar como blob (download direto)
      const blob = await firstValueFrom(
        this.http.get(this.urlRelatorio(), { headers, responseType: 'blob' })
      );

      // Verifica se a resposta é realmente um PDF
      if (blob.type === 'application/pdf' || blob.size > 100) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      } else {
        // Fallback: abre em nova aba com o token na URL
        this.abrirPdfNovaAba(token);
      }
    } catch {
      // Fallback: abre em nova aba
      this.abrirPdfNovaAba(token);
    }
  }

  /** Fallback: abre o PDF em nova aba usando Authorization header via fetch + blob URL */
  private abrirPdfNovaAba(token: string): void {
    const url = this.urlRelatorio();
    // Usa fetch nativo para suportar headers em nova aba
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.blob();
      })
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const win = window.open(blobUrl, '_blank');
        // Se o popup foi bloqueado, força download
        if (!win) {
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = 'relatorio_ecototally.pdf';
          a.click();
        }
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      })
      .catch(() => {
        // Último recurso: navega direto (sem header, mas abre o endpoint)
        window.open(url, '_blank');
      });
  }
}
