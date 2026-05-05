import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpContext, HttpContextToken } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
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
    const token = await this.auth.getTokenAsync();

    if (!token) {
      throw new Error('Você precisa estar logado para baixar o relatório.');
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const blob = await firstValueFrom(
      this.http.get(this.urlRelatorio(), { headers, responseType: 'blob' })
    );

    if (!(blob.type === 'application/pdf' || blob.size > 100)) {
      throw new Error('O servidor não retornou um PDF válido.');
    }

    if (Capacitor.isNativePlatform()) {
      await this.salvarECompartilharPdf(blob, filename);
      return;
    }

    this.baixarPdfWeb(blob, filename);
  }

  private baixarPdfWeb(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  private async salvarECompartilharPdf(blob: Blob, filename: string): Promise<void> {
    const base64Data = await this.blobToBase64(blob);

    const saved = await Filesystem.writeFile({
      path: filename,
      data: base64Data,
      directory: Directory.Cache,
      recursive: true
    });

    await Share.share({
      title: 'Relatório EcoTotally',
      text: 'Relatório EcoTotally em PDF',
      url: saved.uri,
      dialogTitle: 'Salvar ou compartilhar relatório'
    });
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Não foi possível ler o PDF.'));
      reader.onload = () => {
        const result = String(reader.result || '');
        resolve(result.includes(',') ? result.split(',')[1] : result);
      };
      reader.readAsDataURL(blob);
    });
  }

}
