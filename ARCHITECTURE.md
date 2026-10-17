# Kurio — arquitetura e decisões

## Visão geral

Aplicação React + TypeScript + Vite. O TanStack Router controla rotas e parâmetros de busca. O TanStack Query controla dados remotos e mutations, e o Axios é o cliente REST (`src/api/client.ts`). Tailwind CSS 4, estilos CSS da Kurio e componentes shadcn/ui formam a camada visual.

Nenhum servidor blockchain ou gateway de pagamento real é utilizado. O MSW 2 intercepta `/api/*` e os WebSockets simulados no navegador. **O `localStorage` do navegador é o banco da demonstração**, isolado por perfil do navegador, não um banco compartilhado de produção.

## Pastas

| Caminho               | Responsabilidade                                        |
| --------------------- | ------------------------------------------------------- |
| `src/routes/`         | Páginas e rotas TanStack Router                         |
| `src/kurio/`          | Componentes de layout, catálogo e skeletons             |
| `src/contracts/`      | Contratos e schemas Zod                                 |
| `src/services/`       | APIs REST via Axios                                     |
| `src/features/`       | TanStack Query: consultas, mutations e caches           |
| `src/mocks/handlers/` | Handlers HTTP do MSW                                    |
| `src/mocks/domain/`   | Regras do catálogo, cotação e liquidação                |
| `src/mocks/storage/`  | Persistência local das fixtures                         |
| `src/realtime/`       | Cliente Socket.IO, ciclo de vida, reconciliação e hooks |
| `src/mocks/realtime/` | Binding Socket.IO via MSW e cenários determinísticos    |
| `tests/`              | Testes Playwright de UI e integração de tempo real      |
| `visual/`             | Testes de regressão visual com baselines a aprovar      |

## Contratos REST

Todos os caminhos são relativos a `/api`:

- Autenticação: `/auth/register`, `/auth/login`, `/auth/session`, `/auth/logout`, `/auth/profile`, `/auth/change-password`.
- Catálogo: `GET /nfts`, `GET /nfts/:id`, `GET /collections`.
- Favoritos: `GET /favorites`, `POST /favorites/:nftId`, `DELETE /favorites/:nftId`.
- Carrinho: `GET /cart`, `POST /cart/items`, `PATCH/DELETE /cart/items/:nftId/:editionId`, `POST /cart/merge`.
- Carteiras: `GET/POST /wallets`, `PATCH /wallets/:walletId`; conexão: `/wallet-connection` e ações de conectar, trocar rede e desconectar.
- Cotações: `POST /quotes`, `GET /quotes/:quoteId`, `POST /quotes/:quoteId/validate`.
- Pedidos: `POST /orders` com header `Idempotency-Key`, `GET /orders`, `GET /orders/:orderId`, `GET /orders/by-key/:key`.

Erros HTTP (401, 404, 409, 410, 422 e erros de rede simulados) são respostas do MSW. Os valores financeiros são representados como strings decimais e calculados com `decimal.js`.

## Busca, filtros e paginação

Home (`/`) e Mercado (`/market`) interpretam `q`, `category`, `sort`, `tab`, `maxPriceEth` e `page` por meio de `src/kurio/catalog-search.ts`. Alterações navegam para uma nova URL; refresh e Voltar restauram o estado. Os parâmetros são usados diretamente na chamada REST e na query key correspondente.

Não existe atributo de **rede por NFT** nas fixtures. Por isso, a lista de redes aparece apenas como contexto, sem alegar filtros por redes não implementadas.

## Cache e mutations

Query keys incluem parâmetros da busca e proprietário quando a consulta é privada. Após alterações em favoritos, o cache é atualizado otimisticamente e revertido em erro; ao finalizar, ele é revalidado via REST. Mudanças financeiras não são aplicadas otimisticamente.

No login/logout e ao trocar a sessão, dados privados e subscriptions da sessão anterior são eliminados. A expiração de sessão provoca limpeza do token; no checkout, a tentativa de pedido usa uma chave estável gravada antes da requisição e pode ser recuperada após timeout.

## Tempo real

Após `worker.start()`, a aplicação importa dinamicamente o cliente `socket.io-client` para garantir que o interceptor de WebSocket do MSW esteja ativo. O binding adapta o handshake do Engine.IO ao MSW. Os eventos `nft.updated` e `order.updated` carregam identidade e versão.

Fluxo: mutation REST → MSW → persistência → publisher → WebSocket → `socket.io-client` → verificação de versão → cancelamento/invalidação do TanStack Query → nova leitura REST.

Eventos antigos/duplicados não repetem efeitos financeiros. A reconexão usa REST para reconciliar eventuais eventos perdidos. Um pedido confirmado ou recusado é terminal. O mock não representa um socket distribuído de produção nem um saldo real de carteira.

## Pagamentos e consistência

As cotações possuem prazo e são revalidadas antes da criação do pedido e na liquidação. Os snapshots preservam valores e itens do momento da compra. A chave de idempotência impede um segundo pedido para a mesma tentativa. O estoque é alterado somente após confirmação simulada.

**Limitação:** as gravações em múltiplas chaves do `localStorage` não são transações ACID. Não utilizar essa arquitetura para pagamentos reais ou concorrência multiusuário.

## Testes e auditoria

- `npm run test:realtime`: transporte Socket.IO, versões, pedidos e sessão.
- `npm run test:ui`: navegação pública, busca/URL, login e carrinho.
- `npm run test:visual:update`: gerar baselines que **devem ser revisadas** contra os PNGs do Figma antes do commit.
- `npm run test:visual`: comparar com baselines aprovadas.
- `npm run audit:lighthouse`: auditar duas páginas em desktop/mobile, três execuções por perfil, salvando HTML, JSON e medianas.

O resultado de auditoria não foi antecipado nem inventado; consulte `lighthouse-reports/summary.json` após a execução real.

## Deploy

`vercel.json` ativa fallback para `index.html`, permitindo acesso direto e refresh nas rotas. `.env.production` habilita MSW no build de demonstração; o harness de testes fica desabilitado. Os assets estão em `public/`, incluindo o service worker. Verifique a conexão WebSocket e o checkout na URL HTTPS publicada.

## Limitações conhecidas

- Login Google/Facebook, ENS real, MetaMask e pagamento on-chain são demonstrativos, não integrações reais.
- A persistência dos mocks é local ao navegador e não compartilhada entre dispositivos.
- A renderização não foi certificada pixel a pixel contra o Figma neste ambiente.
- Os testes de screenshot requerem baselines aprovadas antes de poderem servir como regressão visual.
- A auditoria Lighthouse precisa ser executada numa máquina com Chrome/Chromium e acesso ao pacote Lighthouse.
