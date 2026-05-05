# EcoTotally — Frontend Angular (novo)

Frontend reescrito do zero em **Angular 18 standalone**, consumindo a API
`https://ecototally.onrender.com`.

## Principais melhorias

- ✅ **Atualização instantânea (Optimistic UI)**: criar/deletar consumo, simulação
  ou meta atualiza a tela imediatamente, sem esperar a API.
- ✅ **Polling em background (10s)** nas telas de lista, então mudanças feitas em
  outro lugar aparecem sozinhas.
- ✅ **Sem loading infinito**: timeout de 15s em toda requisição. Erro = mostra
  mensagem clara com botão "Tentar novamente".
- ✅ **Bottom nav controlável**: swipe pra baixo esconde, swipe pra cima mostra,
  e há um botão flutuante (FAB) que liga/desliga a navbar.
- ✅ **Mobile-first responsivo**: layouts pensados pra celular, com breakpoints
  pra tablet/desktop.
- ✅ **HTTP Interceptor** com Authorization automático e tratamento global de 401
  (redireciona pra login quando o token expira).
- ✅ **Senha não persistida em localStorage** (correção de segurança).

## Como rodar

```bash
npm install
npm start
# abre em http://localhost:4200
```

## Build de produção

```bash
npm run build
# saída em dist/ecototally
```

## API

Configurada em `src/app/core/api.config.ts`:

```ts
export const API_BASE_URL = 'https://ecototally.onrender.com';
```

Troque para `http://localhost:8000` se rodar o FastAPI local.

## Estrutura

```
src/app/
  core/         # api.config, auth.service, auth.interceptor, http helpers
  services/     # consumo, simulacao, meta, mapa, insights, usuario, chat
  models/       # interfaces compartilhadas
  shared/
    bottom-nav/ # navbar inferior com swipe + FAB toggle
  pages/
    login, cadastro, menu, perfil, consumo, simulacao,
    mapa, insights, graficos, esqueci-senha, redefinir-senha
```
