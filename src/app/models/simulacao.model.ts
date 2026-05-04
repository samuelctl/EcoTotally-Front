export type TipoSimulacao = 'Energia' | 'Agua' | string;

export interface CriarSimulacaoRequest {
  atividade: string;
  tipo: TipoSimulacao;
  consumo_valor: number;
  data?: string;
}

export interface SimulacaoResponse {
  id_simulacao?: number;
  id?: number;
  tipo?: TipoSimulacao;
  atividade?: string;
  nome_atividade?: string;
  consumo_valor?: number;
  consumo?: number;
  custo?: number;
  valor_calculado?: number;
  descricao?: string;
  data_registro?: string;
  data?: string;
  created_at?: string;
  [key: string]: unknown;
}

/** Helper: o backend retorna `id_simulacao`. */
export function getSimulacaoId(s: SimulacaoResponse): number | undefined {
  return s.id_simulacao ?? s.id;
}
