# EcoTotally — Correções & Melhorias (Angular)

## Performance / Bateria (mobile)
- **Polling substituído por `createSmartRefresh$`:** o `interval(10000)` que rodava constantemente foi trocado por um observável inteligente que só atualiza quando a página está visível (`visibilitychange`) ou a janela recupera o foco. Intervalo aumentado de 10s para 60s.
- Arquivo `src/app/core/smart-refresh.ts` criado.

## URLs corrigidas
- `ConsumoService`: `/consumos/consumos/me` → `/consumos/me`
- `MetaService`: `/metas/metas/me` → `/metas/me`
- `SimulacaoService`: `/simulacao/simulacoes/` → `/simulacoes/`

## Outras melhorias
- `api.config.ts`: `POLL_INTERVAL_MS` aumentado de 10 000ms para 60 000ms (economia de dados)
