export interface MetaCreateRequest {
  tipo_meta: string;
  valor_objetivo: number;
  data_inicio: string; // yyyy-mm-dd
  data_fim: string;    // yyyy-mm-dd
}

export interface MetaResponse {
  id_meta: number;
  usuario_id?: number;
  tipo_meta: string;
  valor_objetivo: number | string;
  data_inicio: string;
  data_fim: string;
}

export function metaValorObjetivo(m: MetaResponse): number {
  return Number(m.valor_objetivo);
}
