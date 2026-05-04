export interface ConsumoRequest {
  tipo: string;
  gasto: number;
  data: string;
  meta_id?: number | null;
}

export interface ConsumoResponse {
  id?: number | string;
  consumo_id?: number | string;
  tipo?: string;
  gasto?: number;
  valor?: number;
  total?: number;
  preco?: number;
  data?: string;
  descricao?: string;
  meta_id?: number | null;
  [key: string]: unknown;
}

export function getConsumoId(c: ConsumoResponse): number | string | undefined {
  return c.consumo_id ?? c.id;
}

export function getConsumoValor(c: ConsumoResponse): number {
  return Number(c.gasto ?? c.valor ?? c.total ?? c.preco ?? 0);
}
