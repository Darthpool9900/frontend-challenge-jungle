# Kurio — NFT Marketplace

**Jungle Gaming — Frontend Challenge | React + TypeScript | Desktop e Mobile**

> Marketplace de NFTs desenvolvido como solução do desafio técnico de frontend da Jungle Gaming. A aplicação implementa descoberta de obras digitais, catálogo, detalhes, favoritos, carrinho, autenticação, perfil, carteiras, checkout, pedidos e sincronização em tempo real, usando exclusivamente dados e serviços simulados no navegador.
>
> **Importante:** não há blockchain, cobrança, transação financeira nem wallet real. Todos os valores, usuários, pedidos e endereços aqui utilizados são **fictícios**.

**Enunciado:** [Jungle Gaming — Frontend Challenge](https://github.com/junglegaming/frontend-challenge)  
**Design:** [Figma — Frontend Challenge](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge)  
**Repositório da solução:** inserir o endereço público deste repositório ao publicar.  
**Aplicação publicada:** inserir a URL do deploy após a publicação.

## Sumário

1. [O desafio e os objetivos](#1-o-desafio-e-os-objetivos)
2. [Escopo implementado](#2-escopo-implementado)
3. [Tecnologias obrigatórias e aplicação prática](#3-tecnologias-obrigatórias-e-aplicação-prática)
4. [Arquitetura e organização](#4-arquitetura-e-organização)
5. [Instalação e ambiente](#5-instalação-e-ambiente)
6. [Credenciais e demonstração guiada](#6-credenciais-e-demonstração-guiada)
7. [Modelagem, contratos REST e regras de negócio](#7-modelagem-contratos-rest-e-regras-de-negócio)
8. [Autenticação, sessão e persistência](#8-autenticação-sessão-e-persistência)
9. [TanStack Query, sincronização e atualização otimista](#9-tanstack-query-sincronização-e-atualização-otimista)
10. [Socket.IO e cenários de tempo real](#10-socketio-e-cenários-de-tempo-real)
11. [MSW, fixtures, cenários e reset](#11-msw-fixtures-cenários-e-reset)
12. [Interface, Figma, Tailwind e shadcn/ui](#12-interface-figma-tailwind-e-shadcnui)
13. [Testes E2E — 48 cenários](#13-testes-e2e--48-cenários)
14. [Regressão visual — 10 cenários](#14-regressão-visual--10-cenários)
15. [Lighthouse — 12 medições e análise](#15-lighthouse--12-medições-e-análise)
16. [Comandos e reprodução dos resultados](#16-comandos-e-reprodução-dos-resultados)
17. [Git, artefatos e deploy](#17-git-artefatos-e-deploy)
18. [Limitações e decisões técnicas](#18-limitações-e-decisões-técnicas)
19. [Rastreabilidade dos requisitos](#19-rastreabilidade-dos-requisitos)
20. [Referências e entrega](#20-referências-e-entrega)

---

## 1. O desafio e os objetivos

O **Frontend Challenge da Jungle Gaming** propõe implementar um **NFT Marketplace em React e TypeScript**, de acordo com os frames e a identidade visual do Figma. A avaliação contempla fidelidade visual e responsividade; jornadas de compra e conta; integração REST; gerenciamento de estado assíncrono; atualização em tempo real; mocks reproduzíveis; testes automatizados; acessibilidade; performance; e documentação.

O enunciado estabelece que a experiência deve funcionar integralmente **sem serviços reais** de blockchain, autenticação, carteiras ou gateway. A camada de API precisa ser simulada de forma consistente, inclusive nas falhas e situações de concorrência, e não pode ser substituída por botões que apenas exibem mensagens de sucesso.

**Principais objetivos técnicos tratados nesta solução:**

- Reproduzir a composição visual Kurio nos layouts desktop e mobile do Figma, incluindo os estados de carregamento e erro não desenhados.
- Oferecer navegação, busca e filtros que sobrevivam ao refresh e histórico do navegador.
- Manter coerência entre o catálogo, os itens do carrinho, as cotações e o estoque por edição.
- Evitar cobrança fictícia duplicada quando o usuário clica repetidas vezes ou ocorre timeout.
- Reconciliar mudanças de preço e pedidos por **REST + Socket.IO**, inclusive após desconexão.
- Exibir dados privados somente para o usuário da sessão atual.
- Possibilitar que qualquer avaliador execute um checkout completo com credenciais e serviços de teste.
- Versionar testes E2E, baselines visuais e os relatórios das auditorias.

### Critérios e pontuação definidos pela Jungle Gaming

| Critério | Pontos |
|---|---:|
| Fidelidade visual e responsividade | 20 |
| Fluxos e experiência de uso | 20 |
| Integração e estado | 15 |
| Tempo real | 10 |
| Mocking | 10 |
| Testes | 10 |
| Acessibilidade | 5 |
| Performance | 5 |
| Arquitetura e documentação | 5 |
| **Total** | **100** |

O enunciado aponta como **eliminatórios**: ausência de uso efetivo da stack obrigatória; fluxos principais apenas visuais; compra confirmada sem resposta da simulação; exposição de dados de um usuário a outro; eventos de tempo real simulados diretamente por setters ou callbacks de UI; ou ausência de E2E executáveis. As metas Lighthouse são critérios de qualidade/pontuação e precisam ser documentadas mesmo quando não alcançadas.

## 2. Escopo implementado

| Tela / endereço | Funcionalidades e comportamentos |
|---|---|
| `/` — Início | Destaque visual, navegação, catálogo, filtros e ordenação, cards, conteúdo promocional. |
| `/market` — Mercado | Busca textual, categorias, filtro de preço, rede simulada, ordenação, paginação, estados de loading/erro/vazio e filtros no mobile. |
| `/nft/:nftId` — Detalhe | Imagens, descrição, criador, atributos, edições, preço, estoque, quantidade, favoritos e compra. |
| `/cart` — Carrinho | Itens por NFT/edição, ajuste de quantidades, remoção, cupom, subtotal e acesso ao checkout. |
| `/checkout` — Pagamento | Dados do colecionador, carteira, rede, revisão de cotação, conexão simulada e confirmação da tentativa. |
| `/order/:orderId` — Confirmação | Pedido pendente, confirmado ou recusado; itens, taxas, total e referência simulada da transação. |
| `/login` — Login | Autenticação pelo mock, erros e navegação para conta. |
| `/register` — Cadastro | Criação de usuário, confirmação de senha e conflito de e-mail. |
| `/profile` — Perfil | Dados de perfil, avatar, alteração de senha e validações. |
| `/wallets` — Carteiras | Cadastro, edição, carteira principal/secundária e seleção de rede. |
| `/favorites` — Favoritos | Inclusão, remoção, persistência e estado isolado por usuário. |
| `/orders` — Pedidos | Histórico e acompanhamento de pedidos simulados do colecionador. |

Também existem páginas auxiliares/rotas editoriais, como `/creators` e `/learn`. Não representam um backend de conteúdo completo nem ampliação dos requisitos centrais do desafio.

**Comportamentos transversais:** rotas e itens inexistentes, autenticação exigida nos fluxos privados, persistência entre refreshes, feedback de ações, controle de estoque, rede desconectada, cotação desatualizada, timeout e restauração do pedido.

## 3. Tecnologias obrigatórias e aplicação prática

| Tecnologia | Uso real no projeto | Evidência no código |
|---|---|---|
| **React 19** | Componentes de interface, composição de telas e hooks | `src/main.tsx`, `src/routes/`, `src/kurio/` |
| **TypeScript** | Tipagem da interface, transporte e domínio | `src/contracts/`, `src/services/`, `tsconfig*.json` |
| **TanStack Router** | Rotas, parâmetros da URL, history e proteção | `src/routes/`, `src/routeTree.gen.ts` |
| **TanStack Query** | Consultas, mutations, retries, cache e invalidação | `src/features/`, `src/main.tsx` |
| **Axios** | Cliente REST centralizado com token de autenticação | `src/api/client.ts`, `src/services/` |
| **REST APIs** | Contratos reais de requisição/resposta interceptados pelo MSW | `src/mocks/handlers/`, `src/contracts/` |
| **Socket.IO Client** | Conexão, eventos, reconexão e reconciliação | `src/realtime/` |
| **Tailwind CSS 4** | Utilitários de layout e paleta integrada às variáveis Kurio | `src/index.css`, `vite.config.ts`, JSX das telas |
| **shadcn/ui** | Botões, inputs, labels, cards, textarea, select e primitivas | `src/components/ui/` e imports nas telas |
| **MSW 2** | Simulação HTTP e interceptação de WebSocket | `src/mocks/browser.ts`, `src/mocks/handlers/`, `src/mocks/realtime/` |
| **Playwright** | Testes de jornada, mocks, tempo real e screenshots | `tests/`, `visual/`, `playwright*.config.ts` |
| **Lighthouse** | Auditoria de performance, acessibilidade, boas práticas e SEO | `scripts/audit-lighthouse.mjs`, `lighthouse-reports/` |

**Ferramentas complementares:** Vite 8 e plugin do TanStack Router (build e code splitting), Zod (schemas e validação), Decimal.js (precisão monetária), Lucide React (ícones), Radix UI e Class Variance Authority (componentes), ESLint e npm.

### Tailwind + shadcn/ui sem perder o Figma

A interface original foi mantida visualmente enquanto os controles passaram a utilizar **componentes reais do diretório `src/components/ui/`**, como `Button`, `Input`, `Label`, `Card`, `Textarea` e `NativeSelect`. Alguns recebem a opção `unstyled` para manter o CSS personalizado já ajustado ao Figma. Isso **não** significa que os componentes estejam apenas instalados: eles são importados e renderizados nas telas.

O **Tailwind CSS 4** é compilado pelo plugin `@tailwindcss/vite`, possui `@import "tailwindcss"` no CSS e utilitários empregados no JSX (`flex`, `grid`, `items-center`, `relative`, `min-w-0`, `bg-kurio-panel`, entre outros). As cores `kurio-*` usam aliases das variáveis do tema.

**Descrição técnica precisa:** a solução usa **Tailwind + shadcn/ui + CSS personalizado**; o layout não foi inteiramente reescrito em utilities Tailwind. Isso permite preservar as regras visuais, o comportamento responsivo e as baselines.

Detalhes adicionais: [`docs/INTEGRACAO-SHADCN-TAILWIND.md`](./docs/INTEGRACAO-SHADCN-TAILWIND.md).

## 4. Arquitetura e organização

### Visão do fluxo de dados

```text
Interface React / TanStack Router
              │
        Hooks / mutations
          TanStack Query
              │
         Services REST
              │
        Axios /api/*
              │
      MSW (Service Worker)
              │
    Domínio e armazenamento
    (localStorage / fixtures)
              │
     Publicador Socket.IO
              │
 @mswjs/socket.io-binding
              │
      socket.io-client
              │
 Verificação de versão / Query cache
              │
     Atualização da interface
```

A aplicação é uma **SPA (Single-Page Application)**. Os serviços e endpoints mockados representam uma fronteira de rede, não retornos artificiais escondidos dentro dos componentes. O `localStorage` funciona como persistência da demonstração em cada navegador; não é um servidor centralizado.

### Pastas e responsabilidades

```text
.
├── src/
│   ├── api/                 # Instância Axios e interceptação do token
│   ├── components/ui/       # Componentes shadcn/ui reutilizáveis
│   ├── contracts/           # Contratos TypeScript e schemas Zod
│   ├── features/            # Hooks, query keys, cache e mutations
│   ├── kurio/               # Design, layout, cards, skeletons e filtros
│   ├── mocks/
│   │   ├── data/            # Fixtures de NFTs, coleções e cupons
│   │   ├── domain/          # Regras de catálogo, cotação e pedido
│   │   ├── handlers/        # Endpoints HTTP interceptados pelo MSW
│   │   ├── realtime/        # Socket.IO mockado, cenários e harness
│   │   └── storage/         # Bancos simulados com persistência local
│   ├── realtime/            # Cliente Socket.IO, sincronização e lifecycle
│   ├── routes/              # Páginas e arquivos do TanStack Router
│   ├── services/            # Cliente de cada recurso REST
│   ├── index.css            # Tailwind, tokens e CSS visual Kurio
│   └── main.tsx             # Bootstrap, QueryClient, Router e MSW
├── public/                  # Artes, SVGs e mockServiceWorker.js
├── tests/                   # 48 casos E2E (3 arquivos)
├── visual/                  # 10 testes visuais e 10 baselines PNG
├── lighthouse-reports/      # 12 HTML, 12 JSON e summary.json
├── scripts/                 # Automação Lighthouse
├── docs/                    # Material arquitetural e da migração
├── ARCHITECTURE.md          # Decisões e limitações
├── playwright.config.ts     # Execução E2E
├── playwright.visual.config.ts
├── vite.config.ts
├── vercel.json
├── package.json
└── package-lock.json
```

### Decisões arquiteturais

- **Separação de responsabilidades:** páginas → hooks → serviços → Axios → handlers MSW → domínio/persistência.
- **Contratos tipados:** schemas Zod validam identificadores, dados, carteira, preço, quantidade e pedidos.
- **Estado remoto separado da UI:** TanStack Query mantém chaves de cache e mutations; React gerencia estados locais de interação.
- **Dinheiro como string decimal:** `Decimal.js` evita erros associados a floats binários nas contas ETH.
- **Pedidos idempotentes:** chaves estáveis impedem duplicação em timeout/reenvio.
- **REST como fonte de verdade:** Socket.IO avisa da alteração; a interface reconcilia com o estado persistido.
- **Mock opt-in:** ativação explícita por `VITE_ENABLE_MOCKS`; harness de testes independente.
- **Experiência visual:** CSS Kurio preservado, shadcn/ui e Tailwind empregados sem substituir indiscriminadamente o design.

Consulte também [`ARCHITECTURE.md`](./ARCHITECTURE.md) para a documentação complementar de domínio e decisões.

## 5. Instalação e ambiente

### Pré-requisitos

- **Node.js:** a auditoria anexada foi executada em **v24.14.1**; utilize uma versão recente compatível com Vite 8 (recomendado Node 24).
- **npm** e navegador Chromium/Chrome.
- Não é necessário banco de dados, conta blockchain, carteira MetaMask, chave privada, servidor externo ou gateway de pagamento.

### Instalação limpa

```powershell
# Na pasta do projeto
npm ci

# Criar configuração local a partir do exemplo
Copy-Item .env.example .env.local

# Desenvolvimento
npm run dev
```

Abra a URL exibida pelo Vite. Os mocks devem estar ativos para que os endpoints `/api/*` funcionem sem backend.

### Variáveis de ambiente

O arquivo versionável `.env.example` documenta:

```dotenv
VITE_ENABLE_MOCKS=true
VITE_ENABLE_TEST_HARNESS=false
# VITE_SOCKET_URL=
# VITE_SOCKET_PATH=/socket.io/
```

| Variável | Finalidade |
|---|---|
| `VITE_ENABLE_MOCKS=true` | Ativar o Service Worker MSW, APIs e socket simulados. Necessário no build de demonstração. |
| `VITE_ENABLE_TEST_HARNESS=true` | Expor recursos de instrumentação dos testes automatizados. **Não habilitar no deploy público.** |
| `VITE_SOCKET_URL` | URL opcional para transporte Socket.IO externo, caso se use outro ambiente. |
| `VITE_SOCKET_PATH` | Caminho opcional do socket. |
| `AUDIT_BASE_URL` | Origem opcional usada pelo script Lighthouse; padrão `http://127.0.0.1:4173`. |

**Atenção:** por segurança, **`.env`, `.env.local` e `.env.production` não são versionados** segundo o `.gitignore` atualizado. Em uma cópia limpa, crie `.env.local` para desenvolvimento e configure a variável `VITE_ENABLE_MOCKS=true` no ambiente de build da Vercel. Não dependa de um `.env.production` local para um clone funcionar.

### Build e preview

```powershell
$env:VITE_ENABLE_MOCKS="true"
$env:VITE_ENABLE_TEST_HARNESS="false"
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

O preview fica em `http://127.0.0.1:4173/`. O build otimizado é escrito em `dist/` e deve servir `/mockServiceWorker.js` de `public/`.

## 6. Credenciais e demonstração guiada

### Usuários fictícios

| E-mail | Senha | Tipo |
|---|---|---|
| `ana@jungle.test` | `Demo@12345` | Colecionador de demonstração |
| `lucas@jungle.test` | `Demo@12345` | Segundo usuário para isolamento de estado |

Estas credenciais estão nas fixtures (`src/mocks/storage/auth.store.ts`), não em um sistema real de autenticação. Senhas são derivadas em hash com **PBKDF2 + SHA-256, salt e 100.000 iterações** dentro do mock; a finalidade é evitar armazenar a senha em claro na base simulada, não oferecer segurança equivalente a um backend real.

**Endereço Ethereum fictício para os testes:**

```text
0x1111111111111111111111111111111111111111
```

### Jornada completa de compra

1. Entre na **Home** (`/`) ou no **Mercado** (`/market`). Explore as coleções, utilize busca, categoria, ordenação e paginação. A consulta deve refletir a URL após refresh e histórico.
2. Abra `/nft/nft-001` (**Emerald Ape #042**), verifique galeria e edições. Selecione uma edição em estoque e a quantidade permitida.
3. Acione **Comprar** para incluir o item no carrinho; navegue até `/cart`. Edite a quantidade, remova itens se desejar e verifique o resumo.
4. Teste o cupom `KURIO10` ou `ETH005` e observe subtotal, desconto, taxa e total em ETH.
5. Faça login com `ana@jungle.test`. Itens adicionados como visitante devem ser preservados/mesclados com os dados da conta.
6. Cadastre uma carteira na tela **Carteiras** ou no próprio checkout, usando o endereço fictício acima. A conexão e a troca de rede são simuladas.
7. No **Checkout**, confira os dados do colecionador, a cotação e os itens. Confirme a compra simulada.
8. Veja o pedido pendente ou confirmado em `/order/:orderId` e os detalhes de itens, subtotal, desconto, taxa, total e referência de transação.
9. Acesse `/orders` para rever os pedidos, `/favorites` para os favoritos e `/profile` para manutenção dos dados da conta.

**Não ocorre transferência de criptomoedas ou NFT real.** A referência de transação exibida é fabricada pelo mock.

### Cupons disponíveis nas fixtures

| Código | Resultado |
|---|---|
| `KURIO10` | Desconto percentual de **10%**. |
| `ETH005` | Desconto fixo de **0,05 ETH**. |
| `EXPIRED10` | Cupom expirado (erro de demonstração). |
| Código inexistente | Erro de cupom inválido. |

### Redes simuladas

As carteiras e cotações admitem `ethereum`, `polygon`, `base` e `arbitrum`. As taxas de rede são **fixtures em ETH**, não dados de gas obtidos de blockchain real. A disponibilidade de NFTs por rede na UI pode ser limitada pelas fixtures do catálogo.

## 7. Modelagem, contratos REST e regras de negócio

Todas as rotas HTTP abaixo usam a origem `/api` e são interceptadas por MSW. As requisições de aplicação passam pelos serviços em `src/services/` e pela instância Axios em `src/api/client.ts`.

### Recursos e operações

| Método e rota | Operação / resposta esperada |
|---|---|
| `GET /api/health` | Saúde do mock. |
| `POST /api/auth/register` | Cadastro com verificação de dados e conflito. |
| `POST /api/auth/login` | Criação de sessão/token fictício. |
| `GET /api/auth/session` | Consulta/revalidação da sessão. |
| `POST /api/auth/logout` | Encerramento de sessão. |
| `PATCH /api/auth/profile` | Atualização de dados e avatar. |
| `POST /api/auth/change-password` | Alteração validada de senha. |
| `GET /api/nfts` | Busca, categoria, coleção, raridade, disponibilidade, faixa de preço, sort e paginação. |
| `GET /api/nfts/:id` | Dados completos, imagens, atributos e edições. |
| `GET /api/collections` | Coleções disponíveis nas fixtures. |
| `GET /api/favorites` | Lista de favoritos do usuário. |
| `POST /api/favorites` | Inclusão de favorito. |
| `DELETE /api/favorites/:nftId` | Remoção de favorito. |
| `GET /api/cart` | Carrinho do visitante ou do usuário atual. |
| `POST /api/cart/items` | Inclusão/mesclagem de itens. |
| `PATCH /api/cart/items/:itemId` | Alteração de quantidade. |
| `DELETE /api/cart/items/:itemId` | Remoção. |
| `POST /api/cart/merge` | Fusão de carrinho visitante e autenticado. |
| `POST /api/quotes` | Criação de cotação usando carrinho, rede e cupom. |
| `GET /api/quotes/:quoteId` | Leitura/revisão da cotação. |
| `POST /api/quotes/:quoteId/validate` | Revalidação de preço, estoque e prazo. |
| `POST /api/orders` | Criação idempotente do pedido. |
| `GET /api/orders` | Pedidos do usuário. |
| `GET /api/orders/:orderId` | Estado atual e snapshot do recibo. |
| `GET /api/orders/by-key/:key` | Recuperação de tentativa pela chave idempotente. |
| `GET /api/wallets` | Carteiras do usuário. |
| `POST /api/wallets` | Cadastro de carteira. |
| `PATCH /api/wallets/:walletId` | Edição de carteira. |
| `GET /api/wallet-connection` | Conexão simulada atual. |
| `POST /api/wallet-connection/connect` | Conexão simulada. |
| `POST /api/wallet-connection/switch-network` | Troca de rede simulada. |
| `POST /api/wallet-connection/disconnect` | Desconexão simulada. |

**Contratos e schemas detalhados:** `src/contracts/auth.ts`, `nft.ts`, `cart.ts`, `favorites.ts`, `quote.ts`, `order.ts`, `wallet.ts`, `wallet-connection.ts`. Os handlers e serviços constituem a referência para payloads, respostas e status específicos de cada recurso.

### Modelos essenciais

- **NFT:** `id`, nome, imagem, categoria, raridade, criador, coleção, preço inicial, quantidade disponível, destaque, popularidade, data e `version`.
- **Edição:** `id`, nome (`1/1`, `1/10`, `1/50`, `ABERTA`), preço decimal, oferta total, disponibilidade e versão.
- **Carrinho:** usuário/visitante, NFT, edição e quantidade inteira, respeitando o estoque.
- **Cotação:** `quoteId`, rede, cupom, itens com preços por unidade, desconto, taxa, total, problemas de validação e validade temporal.
- **Pedido:** id, usuário, carteira, chave de idempotência, status, versão, snapshot dos itens/valores, referência de transação, erro e timestamps.
- **Carteira:** id, nome, endereço `0x` validado, rede e tipo (`primary` ou `secondary`).

### Catálogo

As fixtures iniciais em `src/mocks/data/nft.fixtures.ts` contêm **30 NFTs**, **4 coleções** (Kurio Apes, Digital Legends, Pixel World e Cosmic Art) e **4 criadores**. Existem edições limitadas, estoques diferentes e casos esgotados. As imagens de demonstração usam assets Kurio e placeholders locais, não integração com imagens NFT remotas.

O contrato da lista contempla `search`, `category`, `collectionId`, `rarity`, `availability`, `minPriceEth`, `maxPriceEth`, `sort`, `page` e `pageSize`. A navegação guarda o estado relevante da busca/filtros/página na URL; a alteração de filtro reinicia a paginação.

### Precisão financeira, cotação e compra

- ETH é armazenado/trafegado como **string decimal**, validada pelo schema (até 18 casas decimais), e calculada com **Decimal.js**.
- O total decorre de **subtotal − desconto + taxa de rede**, respeitando a resposta do mock.
- A cotação retorna `ready` ou `requires_review`, verifica preço, estoque, cupom e validade temporal.
- A criação do pedido envia `Idempotency-Key` no header. A mesma tentativa não pode produzir dois pedidos diferentes; payload incompatível com a mesma chave representa conflito.
- Pedidos podem estar `pending`, `confirmed` ou `declined`; a confirmação visível só aparece quando o mock realmente registra confirmação.
- Os dados financeiros do pedido são **snapshot**: mudanças posteriores do catálogo não alteram um recibo já criado.
- Falhas de envio ou timeout preservam contexto e chave para recuperar a tentativa, sem abrir uma compra duplicada.

## 8. Autenticação, sessão e persistência

- O Axios acrescenta `Authorization: Bearer ...` a partir do token local (`jungle.auth.token`).
- O TanStack Router possui guarda de autenticação em `src/routes/_authenticated.tsx`; telas também oferecem estados apropriados para visitantes.
- A sessão persiste entre reloads e é revalidada pelo endpoint mockado. Expiração e respostas `401` demandam reautenticação e limpeza do estado privado.
- Ao efetuar login, o carrinho visitante é mesclado ao carrinho do usuário.
- O mock mantém bancos distintos para autenticação, NFTs, favoritos, carrinho, cotações, pedidos, carteiras e conexão.
- O cache e os eventos privados são isolados pelo usuário. Logout/troca de conta não devem exibir dados da sessão anterior.
- Uma tentativa de checkout pendente é persistida por usuário sob uma chave própria (`jungle.checkout.pending.v1`) para recuperação após refresh.

**Observação de segurança:** `localStorage` é adequado para esta demonstração isolada, mas não oferece garantias de transações ACID, concorrência entre usuários ou confidencialidade de um backend real. Não use dados pessoais nem credenciais reais nos mocks.

## 9. TanStack Query, sincronização e atualização otimista

O `QueryClient` é inicializado em `src/main.tsx`. Configuração observável na versão entregue:

| Opção | Valor | Efeito |
|---|---|---|
| `queries.retry` | `1` | Uma nova tentativa de leitura em falha transitória. |
| `queries.staleTime` | `30_000` ms | Janela de frescor de 30 segundos. |
| `queries.refetchOnWindowFocus` | `false` | Evita refetch automático apenas por voltar à janela. |
| `mutations.retry` | `0` | Não reenvia mutations automaticamente, reduzindo risco de duplicidade. |

As query keys separam listas por parâmetros e recursos por id e/ou escopo de usuário. Mutations invalidam/refazem consultas conforme a alteração; respostas obsoletas são descartadas ou canceladas antes que possam regredir o estado. Favoritos usam **atualização otimista com rollback** em falha, testada com resposta `401`. Valores de pedido/cotação não são confirmados otimisticamente.

## 10. Socket.IO e cenários de tempo real

### Transporte

O MSW inicializa primeiro; depois a aplicação ativa o cliente `socket.io-client`, compatível com o mock de WebSocket via `@mswjs/socket.io-binding`. A aplicação **não usa setters de React como substituto do protocolo**. Os dados permanecem no armazenamento da camada mockada e a interface reconcilia as notificações com REST.

| Evento | Origem e efeito |
|---|---|
| `nft.updated` | Mudança de preço/quantidade/versão de uma edição; catálogo, detalhe, carrinho e cotação devem refletir o estado mais recente. |
| `order.updated` | Mudança de status/versão de um pedido; atualiza acompanhamento e confirmação/recusa. |

Os eventos contêm identificação estável, `eventId`, recurso e versão. O cliente ignora eventos duplicados ou defasados; uma reconexão provoca reconciliação REST. Pedidos terminais não retornam para estados anteriores.

### Cenários cobertos

1. NFT adicionado ao carrinho sofre alteração de preço ou estoque.
2. MSW persiste a mudança e publica `nft.updated` pelo transporte Socket.IO.
3. A UI invalida/reconcilia a informação, e uma cotação antiga exige revisão antes da compra.
4. Ao confirmar, recusar ou manter pendente um pedido, `order.updated` chega ao cliente.
5. Duplicação, evento antigo, perda de evento terminal, desconexão e reconexão são exercitados pelos testes.
6. Após o refresh, a API REST e a chave de idempotência permitem recuperar o pedido pendente.
7. Troca de conta remove o acesso e a atualização de dados privados de outro usuário.

## 11. MSW, fixtures, cenários e reset

### Como o mock funciona

`src/mocks/browser.ts` registra handlers HTTP e Socket.IO. `VITE_ENABLE_MOCKS=true` habilita os mocks também no build demonstrativo. O banco inicial é derivado das fixtures locais e persistido no `localStorage` do navegador, permitindo recarregar a página sem perder sessão, carteira, favoritos, carrinho ou pedidos daquele perfil.

O harness `window.realtimeTest` só é instalado com **`VITE_ENABLE_TEST_HARNESS=true`**, para execução automatizada. Não habilite esse modo no deploy final.

### Reset integral das fixtures

Com a aplicação aberta, usando o **Console** do DevTools:

```javascript
await fetch("/api/__test/reset", { method: "POST" });
location.reload();
```

O endpoint reseta autenticação, NFTs, carrinho, favoritos, carteiras, pedidos, cotações, conexão e tentativas pendentes, retornando `reloadRequired: true`. É um **endpoint do mock**, não uma API pública de produção.

### Alteração de preço ou estoque de edição

```javascript
await fetch("/api/__test/nfts/nft-001/editions/nft-001-edition-1", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    priceEth: "4.75",
    availableQuantity: 1
  })
});
```

A mudança aumenta a versão e publica `nft.updated`. O valor e o estoque são **exemplos de cenário**, não preços ou disponibilidade reais.

### Próximo resultado de pagamento

Após autenticação, defina o desfecho da próxima tentativa:

```javascript
const token = localStorage.getItem("jungle.auth.token");
await fetch("/api/__test/orders/scenario", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({ outcome: "decline" })
});
```

Valores possíveis: `"confirm"`, `"decline"`, `"timeout"`. A simulação `timeout` permite verificar a recuperação de uma tentativa sem duplicar pedidos.

### Exercitar o transporte em tempo real

```javascript
await fetch("/api/__test/realtime", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "disconnect", event: "nft.updated" })
});
```

As ações reconhecidas são `disconnect`, `duplicate`, `stale`, `reset`, `reject` e `resume`. É possível consultar as conexões pelo `GET /api/__test/realtime`. Para restaurar as condições normais, use `resume` e, quando necessário, o reset de fixtures.

### Condições adversas

Fixtures, estados internos de domínio e o harness possibilitam reproduzir indisponibilidade, `401`, conflitos, revalidação de preço/estoque, cupom expirado, pedidos recusados/pendentes e eventos de socket antigos ou repetidos. Os arquivos `tests/realtime.spec.ts` e `tests/coverage-missing.spec.ts` documentam a execução automatizada desses cenários. Latência variável, erro HTTP e recuperação são simulados pela camada de rede/mock, não por um backend real.

## 12. Interface, Figma, Tailwind e shadcn/ui

**Identidade visual:** paleta Kurio escura, detalhes laranja/cobre, Roboto e Roboto Mono, imagens de colecionáveis, cards, botão principal, filtros desktop/mobile, navegação inferior mobile e estados visuais de compra. Layout e CSS personalizados foram mantidos após a integração de Tailwind/shadcn/ui.

**Responsividade:** regras específicas no CSS e componentes contemplam desktop, tablet e mobile, com atenção a larguras de referência **390px, 768px e 1440px**. No detalhe mobile há barra fixa de compra; formulários e carrinho se adaptam à largura disponível.

**Assets:** o projeto contém imagens WebP e ícones SVG em `public/kurio/`. Alguns itens da listagem usam placeholders criados pelas fixtures. As fontes Roboto/Roboto Mono são carregadas do Google Fonts por stylesheet não bloqueante com fallback local; por isso, a aparência das fontes pode variar brevemente se a rede estiver indisponível.

**Estados de carregamento:** `src/kurio/Skeletons.tsx` fornece skeletons com shimmer; carregamentos, erros, listas vazias e revalidação recebem tratamento visível. A interface utiliza labels, semântica, estados de foco, textos alternativos e feedback acessível.

**Acessibilidade e movimento:** foco por teclado, navegação e submissão de formulários são verificados pelo Playwright; o CSS considera `prefers-reduced-motion`. As auditorias Lighthouse registram Accessibility de **98–100**. Isso constitui evidência de qualidade, mas não equivale a uma certificação universal de conformidade WCAG.

**Escolha deliberada:** utilizar `unstyled` em controles shadcn nas áreas herdadas permite manter a fidelidade ao Figma, reaproveitando os mesmos elementos HTML e seletores de testes. O restante dos estilos continua em CSS Kurio, integrado aos utilitários Tailwind.

## 13. Testes E2E — 48 cenários

A versão final contém **48 testes E2E definidos** em `tests/`, utilizando Playwright, Chromium, MSW e fixtures isoladas por contexto. **Resultado da execução final informado pelo desenvolvedor: 48/48 aprovados após as correções e a migração para Tailwind/shadcn/ui.** Os testes e o relatório HTML permitem auditoria e reexecução pelos avaliadores.

### 13.1. Jornada funcional — `tests/ui-flow.spec.ts` (9 testes)

1. **Desktop:** abre Home e detalhes de NFT com dados do mock.
2. **Desktop:** busca e filtros persistem na URL, refresh e histórico.
3. **Desktop:** rota de NFT inexistente apresenta feedback.
4. **Mobile:** abre Home e detalhes de NFT com dados do mock.
5. **Mobile:** busca e filtros persistem na URL, refresh e histórico (inclui reabertura do painel após reload).
6. **Mobile:** rota de NFT inexistente apresenta feedback.
7. **Desktop:** login e logout utilizam a sessão real do mock.
8. **Desktop:** carrinho visitante persiste após refresh.
9. **Desktop:** compra confirmada aparece no recibo a partir da resposta do mock.

### 13.2. Transporte e consistência — `tests/realtime.spec.ts` (9 testes)

10. Evento `nft.updated`: preço, estoque, cache, duplicatas, eventos antigos e revisão de cotação.
11. Resposta REST antiga não sobrescreve um NFT mais recente.
12. Pedido **confirmado**: evento, idempotência e consistência financeira.
13. Pedido **recusado**: evento, idempotência e consistência financeira.
14. Pedido em **timeout**: evento, idempotência e consistência financeira.
15. Desconexão e perda de evento terminal: reconexão e refresh recuperam o mesmo pedido.
16. Reconexão automática e React StrictMode mantêm apenas uma conexão lógica.
17. Erros de conexão são observáveis; nova tentativa recupera o estado REST.
18. Logout/troca de usuário isolam eventos privados.

### 13.3. Cobertura complementar — `tests/coverage-missing.spec.ts` (30 testes)

**Cadastro, validações e sessão**

19. Cadastro válido cria usuário e recupera sessão após refresh.
20. Cadastro rejeita confirmação de senha divergente.
21. Cadastro mostra conflito de e-mail existente retornado pelo MSW.
22. Login com senha incorreta apresenta erro sem autenticar.
23. Sessão expirada no banco mock impede acesso a dados privados.
24. Rota protegida orienta o visitante a entrar.

**Filtros, catálogo e estoque**

25. Categoria, ordenação e paginação coexistem na URL.
26. NFT esgotado bloqueia compra e apresenta indisponibilidade.
27. Alteração de preço via MSW impede avançar com carrinho/cotação desatualizados.

**Perfil do colecionador**

28. Edição de nome, usuário e bio persiste após refresh.
29. Alteração para e-mail de outro usuário retorna conflito.
30. Avatar aceita imagem pequena e rejeita arquivo inválido.
31. Alteração de senha valida confirmação e senha atual; nova senha autentica.

**Carteiras e favoritos**

32. Carteira principal pode ser criada, editada e persistida.
33. Carteira secundária pode tornar-se principal.
34. Endereço de carteira inválido exibe erro de validação.
35. Favoritar, recarregar e desfavoritar mantêm estado no mock.
36. Falha `401` em favoritos desfaz atualização otimista.
37. Troca de conta não mostra favoritos de outro usuário.

**Carrinho e cupons**

38. Quantidade aumenta, diminui e remoção esvazia o carrinho.
39. Cupom válido aplica desconto; códigos inválidos e expirados são rejeitados.
40. Itens de visitante são mesclados ao carrinho autenticado.

**Pagamento e idempotência**

41. Pagamento recusado apresenta recusa e preserva o carrinho.
42. Timeout mantém pedido recuperável após refresh.
43. Duplo clique não cria dois pedidos no mock.
44. Recusa de conexão de carteira apresenta erro sem criar pedido.

**Acessibilidade do fluxo**

45. Desktop: formulário de login funciona por teclado.
46. Desktop: páginas de catálogo não apresentam overflow horizontal.
47. Mobile: formulário de login funciona por teclado.
48. Mobile: páginas de catálogo não apresentam overflow horizontal.

### Evidências e execução

```powershell
# Todos os E2E
npm run test:all

# Suítes separadas
npm run test:ui
npm run test:realtime

# Relatório HTML existente
npx playwright show-report
```

**Arquivos da execução:** `tests/`, `playwright.config.ts`, `playwright-report/` e, quando gerado, `test-results/` (screenshots de falha e traces). Uma execução verde confirma esses cenários, mas não deve ser confundida com prova de inexistência de quaisquer outros bugs.

## 14. Regressão visual — 10 cenários

O Playwright compara páginas reais com **10 baselines PNG** versionadas em `visual/__screenshots__/`. A execução final dos testes visuais também foi confirmada pelo desenvolvedor como aprovada **após a integração Tailwind/shadcn/ui**.

| Página | Mobile (390×844) | Desktop (1440×900) | Arquivo de teste |
|---|---|---|---|
| Home | `home-mobile.png` | `home-desktop.png` | `visual/kurio.visual.spec.ts` |
| Detalhes do NFT | `nft-detail-mobile.png` | `nft-detail-desktop.png` | `visual/kurio.visual.spec.ts` |
| Carrinho | `cart-mobile.png` | `cart-desktop.png` | `visual/kurio.visual.spec.ts` |
| Login | `login-mobile.png` | `login-desktop.png` | `visual/kurio.visual.spec.ts` |
| Pagamento | `payment-mobile.png` | `payment-desktop.png` | `visual/payment.visual.spec.ts` |

**Total:** 8 testes visuais básicos + 2 do checkout = **10**. O teste aguarda a fonte antes da captura, desabilita animações/caret e usa `maxDiffPixelRatio: 0.015`. Há distinção entre comparar com uma baseline e comprovar equivalência pixel a pixel ao Figma: a revisão visual humana é complementar à regressão automatizada.

```powershell
# Comparar com as baselines já existentes
npm run test:visual

# Apenas se houver alteração visual intencional e revisão das novas capturas
npm run test:visual:update
```

**Não regenere baselines automaticamente durante uma avaliação normal:** isso substituiria a referência contra a qual deveriam ser detectadas regressões. As dez baselines finais já estão incluídas no projeto.

## 15. Lighthouse — 12 medições e análise

### Metodologia

O arquivo `scripts/audit-lighthouse.mjs` audita **Home (`/`) e detalhe (`/nft/nft-001`)**, em **mobile e desktop**, com **três execuções por combinação**, totalizando **12 execuções**. A mediana de cada métrica é armazenada em `lighthouse-reports/summary.json`. Os arquivos `.report.html` e `.report.json` preservam as análises individuais.

**Origem:** `http://127.0.0.1:4173` (preview do build de demonstração).  
**Data registrada:** `2026-10-17T01:34:52.242Z` (timestamp UTC do `summary.json`).  
**Ambiente:** Windows, Node.js `v24.14.1`, Lighthouse CLI instalado como `lighthouse@12` (relatórios indicam Lighthouse `12.8.2`), Headless Chrome.  
**Configuração:** build Vite otimizado, mocks ativos e teste em Chromium com perfis mobile/desktop do Lighthouse.  
**Fonte dos números:** `lighthouse-reports/summary.json` e os 12 relatórios JSON individuais, **medidos após a migração shadcn/ui + Tailwind**.

### 15.1. Metas do enunciado e resultado final (medianas)

| Tela | Perfil | Performance (meta ≥90) | Accessibility (≥95) | Best Practices (≥95) | SEO (≥90) |
|---|---|---:|---:|---:|---:|
| Home | **Mobile** | **76 — abaixo** | **100 — atende** | **96 — atende** | **92 — atende** |
| Home | **Desktop** | **97 — atende** | **98 — atende** | **100 — atende** | **92 — atende** |
| Detalhe | **Mobile** | **77 — abaixo** | **100 — atende** | **100 — atende** | **92 — atende** |
| Detalhe | **Desktop** | **97 — atende** | **100 — atende** | **100 — atende** | **92 — atende** |

**Resultado objetivo:** 2 de 4 combinações atingiram a meta de Performance; **todas** as combinações atingiram as metas de acessibilidade, boas práticas e SEO. As pontuações baixas do mobile são **documentadas, não ocultadas**.

### 15.2. Indicadores de carregamento — medianas

| Tela e perfil | LCP | CLS | TBT |
|---|---:|---:|---:|
| Home mobile | **4.689 ms** | **0,00505** | **55,5 ms** |
| Home desktop | **1.122 ms** | **0,00100** | **0 ms** |
| Detalhe mobile | **4.548 ms** | **0,00095** | **46,5 ms** |
| Detalhe desktop | **1.078 ms** | **0,00048** | **0 ms** |

- **LCP (Largest Contentful Paint):** tempo para o maior conteúdo visível renderizar.
- **CLS (Cumulative Layout Shift):** deslocamentos inesperados do layout.
- **TBT (Total Blocking Time):** tempo de bloqueio da thread principal durante a carga.

### 15.3. Todas as 12 execuções registradas

| Execução | Página | Perfil | Performance | A11y | Boas práticas | SEO | LCP (ms) | CLS | TBT (ms) |
|---:|---|---|---:|---:|---:|---:|---:|---:|---:|
| 1 | Home | Mobile | 75 | 100 | 96 | 92 | 4.700 | 0,00505 | 66,5 |
| 2 | Home | Mobile | 76 | 100 | 96 | 92 | 4.620 | 0,00505 | 51,5 |
| 3 | Home | Mobile | 76 | 100 | 96 | 92 | 4.689 | 0,00505 | 55,5 |
| 1 | Home | Desktop | 96 | 98 | 100 | 92 | 1.199 | 0,00100 | 1 |
| 2 | Home | Desktop | 97 | 98 | 100 | 92 | 1.061 | 0,00100 | 0 |
| 3 | Home | Desktop | 97 | 98 | 100 | 92 | 1.122 | 0,00100 | 0 |
| 1 | Detalhe | Mobile | 77 | 100 | 100 | 92 | 4.550 | 0,00095 | 46,5 |
| 2 | Detalhe | Mobile | 77 | 100 | 100 | 92 | 4.548 | 0,00095 | 52 |
| 3 | Detalhe | Mobile | 77 | 100 | 100 | 92 | 4.529 | 0,00095 | 44,5 |
| 1 | Detalhe | Desktop | 97 | 100 | 100 | 92 | 1.055 | 0,00034 | 0 |
| 2 | Detalhe | Desktop | 97 | 100 | 100 | 92 | 1.078 | 0,00048 | 0 |
| 3 | Detalhe | Desktop | 97 | 100 | 100 | 92 | 1.081 | 0,00048 | 0 |

Os valores LCP/CLS foram arredondados **apenas para exibição** nesta tabela; o JSON preserva a precisão original.

### 15.4. Por que a Performance mobile ficou abaixo de 90?

Os relatórios individuais apontam como principal limitação o **tempo até renderizar o conteúdo principal (LCP)** em execução mobile simulada, e não um problema grave de deslocamento de layout ou bloqueio JavaScript.

- **Home mobile:** LCP mediano de aproximadamente **4,69 s**. O elemento LCP registrado no relatório analisado é uma **imagem de card do catálogo** (`article.nft-card ... img`, por exemplo, *Solar Storm*).
- **Detalhe mobile:** LCP mediano de aproximadamente **4,55 s**. O elemento LCP é a **imagem principal do NFT** (`div.detail-main-img > img`, *Emerald Ape #042*).
- O **TBT é baixo** (≈46–56 ms) e o **CLS é próximo de zero** em ambos os casos. Assim, o indicador dominante para a perda de pontuação é o tempo de exibição do elemento visual principal.
- As imagens LCP identificadas já utilizam `fetchpriority="high"` e `loading="eager"`; não se tratou simplesmente de uma ausência de prioridade de rede.
- O relatório aponta **JavaScript não utilizado na página inicial** (estimativa de cerca de **76 KiB** no audit analisado) e oportunidades menores de entrega de imagens; isso pode contribuir para o custo de inicialização, mas a relação causal exata depende de profiling aprofundado.
- A execução mobile aplica condições de dispositivo e rede mais restritivas que o desktop, contribuindo para a diferença. O projeto foi mantido visualmente fiel ao Figma em vez de eliminar conteúdo ou funcionalidades para otimizar exclusivamente a nota.

**Medidas implementadas antes da medição final:** carregamento não bloqueante da mesma família de fontes, preloads seletivos, prioridade para imagem acima da dobra, lazy loading do restante das imagens, code splitting de rotas e inicialização do tempo real após a primeira renderização. Os resultados de desktop (97/97) indicam bom comportamento nos perfis auditados, mas essas medidas não foram suficientes para atingir a meta mobile.

**Transparência:** Performance mobile **não atingiu o alvo de 90**. O requisito do desafio solicita resultados e justificativas, e é assim que esta limitação é reportada. Não há afirmação de aprovação integral do Lighthouse.

### 15.5. Arquivos de evidência incluídos

```text
lighthouse-reports/
├── summary.json
├── home-mobile-1.report.json   + .report.html
├── home-mobile-2.report.json   + .report.html
├── home-mobile-3.report.json   + .report.html
├── home-desktop-1.report.json  + .report.html
├── home-desktop-2.report.json  + .report.html
├── home-desktop-3.report.json  + .report.html
├── detail-mobile-1.report.json + .report.html
├── detail-mobile-2.report.json + .report.html
├── detail-mobile-3.report.json + .report.html
├── detail-desktop-1.report.json + .report.html
├── detail-desktop-2.report.json + .report.html
└── detail-desktop-3.report.json + .report.html
```

**Os relatórios serão versionados diretamente em `lighthouse-reports/`**, conforme o `.gitignore` atualizado informado para esta entrega. Não é necessário usar as cópias anteriores em `docs/evidencias/lighthouse/` como fonte oficial.

## 16. Comandos e reprodução dos resultados

| Objetivo | Comando |
|---|---|
| Instalar dependências | `npm ci` |
| Iniciar desenvolvimento | `npm run dev` |
| Validar tipos | `npx tsc -p tsconfig.app.json --noEmit` |
| ESLint | `npm run lint` |
| Build otimizado | `npm run build` |
| Preview da produção | `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort` |
| Playwright — jornada UI | `npm run test:ui` |
| Playwright — Socket.IO | `npm run test:realtime` |
| **Playwright — 48 E2E** | **`npm run test:all`** |
| **Playwright — 10 visuais** | **`npm run test:visual`** |
| Atualizar baselines *após revisão* | `npm run test:visual:update` |
| Relatório HTML Playwright | `npx playwright show-report` |
| Lighthouse — 12 execuções | `npm run audit:lighthouse` |

### Como os testes são executados

- Instale o Chromium do Playwright uma vez: `npx playwright install chromium`.
- `playwright.config.ts` e `playwright.visual.config.ts` iniciam automaticamente um **build + Vite Preview** com mocks/harness ligados **somente no processo de teste**.
- A origem de teste é `http://127.0.0.1:4173`; `workers: 1` evita disputas de estado no processo de teste; cada novo contexto de Playwright isola o armazenamento do navegador.
- Traces de falha são preservados, e a configuração E2E gera relatório HTML em `playwright-report/`.
- O projeto inclui as **10 baselines** já geradas e aprovadas pelo desenvolvedor. Não é necessário usar `--update-snapshots` para uma simples verificação.

### Lighthouse passo a passo

**Terminal A:**

```powershell
$env:VITE_ENABLE_MOCKS="true"
$env:VITE_ENABLE_TEST_HARNESS="false"
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

**Terminal B:**

```powershell
npm run audit:lighthouse
```

A auditoria chama `npx lighthouse@12` 12 vezes. É necessário ter Chrome/Chromium funcionando e aceitar a instalação do pacote Lighthouse pela CLI, se ainda não estiver em cache. Para uma origem diferente: `$env:AUDIT_BASE_URL="http://127.0.0.1:4173"`.

## 17. Git, artefatos e deploy

### `.gitignore` considerado nesta entrega

**Prevalece o `.gitignore` atualizado informado pelo desenvolvedor**, que ignora arquivos locais e segredos, mas **não ignora os relatórios de testes ou do Lighthouse**. O arquivo que porventura acompanha algum ZIP anterior não deve ser usado para decidir o que incluir no commit final.

**Não versionar:**

- `node_modules/`, `dist/`, `dist-ssr/`;
- logs, arquivos `.local`, arquivos temporários de editor;
- `.env`, `.env.*.local`, `.env.production`;
- senhas pessoais, tokens reais, chaves privadas e outras credenciais sensíveis.

**Versionar:**

- Código-fonte, `package.json`, `package-lock.json`, assets, MSW e fixtures;
- `tests/` e `visual/`, incluindo `visual/__screenshots__/`;
- `playwright.config.ts` e `playwright.visual.config.ts`;
- `playwright-report/` e `test-results/` **se estiverem presentes e forem úteis como evidência**; essas pastas não estão mais excluídas por sua configuração atual;
- `lighthouse-reports/`, com os **12 relatórios HTML, 12 JSON e o `summary.json`**;
- `README.md`, `ARCHITECTURE.md`, `vercel.json`, `.env.example` e scripts.

Arquivos de execução muito grandes ou dados sensíveis devem ser revisados antes do commit. **Remover as regras do `.gitignore` permite versionar os relatórios, mas não executa `git add` automaticamente.**

### Publicação

O enunciado exige **GitHub + URL pública da aplicação**. A Vercel é uma opção aceita.

1. Suba o código completo no GitHub, preservando o lockfile e os arquivos de demonstração/teste.
2. Importe o repositório na Vercel (framework **Vite**).
3. Configure `Build Command: npm run build` e `Output Directory: dist`.
4. Configure no build da Vercel **`VITE_ENABLE_MOCKS=true`** e **`VITE_ENABLE_TEST_HARNESS=false`**.
5. Faça o deploy. O `vercel.json` existente fornece fallback para `index.html` nas rotas da SPA.
6. Confira na URL HTTPS publicada: abertura de `/`, refresh de `/nft/nft-001`, login, carrinho, checkout, pedido e reconexão do Socket.IO mockado.
7. Envie para avaliação os **dois links**: repositório GitHub e aplicação publicada.

> Este README não inventa URLs de deploy/repositório. Substitua os campos do cabeçalho pelos links definitivos antes da submissão.

### Dados e deploy

Os mocks persistem **localmente em cada navegador**, portanto um pedido realizado em um computador não aparecerá automaticamente em outro; isso é esperado nesta demonstração e não representa um backend de produção. A aplicação publicada deve ter o Service Worker do MSW disponível e funcionar sem serviços privados.

## 18. Limitações e decisões técnicas

1. **Performance mobile:** Home 76 e Detalhe 77, abaixo da meta 90, com principal indicador adverso sendo LCP ≈4,5–4,7 s. Os relatórios e a análise estão entregues.
2. **Sem backend real:** estado MSW/localStorage não é compartilhado entre navegadores e não oferece transações ou garantias de escala multiusuário.
3. **Sem transações on-chain:** checkout, wallet e confirmação são simulações; links ou referências de transação não são provas de operações reais.
4. **Segurança de demonstração:** credenciais de teste são conhecidas, e tokens/estado residem no navegador. Não utilizar informações reais nessa implementação.
5. **Tailwind + shadcn/ui + CSS próprio:** uso combinado intencional para conservar exatamente os estilos da Kurio, sem obrigatoriedade de eliminar o CSS personalizado.
6. **Tipografia online:** fontes Roboto/Roboto Mono podem ser solicitadas ao Google Fonts, com fallback para evitar bloqueio de renderização.
7. **Evidência visual:** snapshots aprovados servem de baseline de regressão; fidelidade ao Figma também depende de análise visual, não somente de screenshots idênticos entre execuções.
8. **Cenários controlados:** testes e endpoints de cenário simulam falhas e eventos conhecidos, não o comportamento imprevisível de gateways ou redes blockchain de produção.
9. **Rotas auxiliares:** conteúdo editorial, suporte, integração de redes sociais, extensão de wallet, ENS e gateway real não fazem parte da implementação principal solicitada.
10. **Deploy:** o repositório e o site público precisam ser indicados pelo responsável pela entrega; este documento não apresenta uma URL não verificada como publicada.

A estratégia geral prioriza funcionamento completo e reproduzível dos requisitos obrigatórios, preservação do layout e evidência de testes. Desvios e decisões adicionais estão descritos em [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## 19. Rastreabilidade dos requisitos

A matriz abaixo liga as seções relevantes do enunciado aos arquivos e testes existentes. **“Implementado” significa que há código correspondente; os resultados de teste são registrados separadamente.**

| Exigência do desafio | Implementação/evidência |
|---|---|
| Stack obrigatória com uso real | `src/main.tsx`, `src/components/ui/`, `src/index.css`, `vite.config.ts`, `src/features/`, `src/realtime/`, `src/mocks/` |
| Frames e navegação responsivos | `src/routes/`, `src/kurio/`, CSS Kurio, 10 baselines visuais |
| Busca, filtros, paginação e history | `src/kurio/catalog-search.ts`, `src/routes/index.tsx`, `src/routes/market.tsx`, `tests/ui-flow.spec.ts` |
| Detalhe, edições e limites de compra | `src/routes/nft/$nftId.tsx`, `src/contracts/nft.ts`, testes de estoque |
| Carrinho visitante e autenticado | `src/routes/cart.tsx`, `src/mocks/handlers/cart.handlers.ts`, testes de merge e refresh |
| Cupons, precisão em ETH e cotação | `src/contracts/quote.ts`, `src/mocks/domain/quote.domain.ts`, Decimal.js, testes de cupons |
| Checkout e pedido consistente | `src/routes/checkout.tsx`, `src/mocks/handlers/order.handlers.ts`, testes de compra e idempotência |
| Confirmação/recusa/pendência | `src/routes/order/$orderId.tsx`, `src/mocks/domain/order.settlement.ts`, testes de desfechos |
| Cadastro, login, expiração e logout | `src/kurio/Auth.tsx`, `src/mocks/handlers/auth.handlers.ts`, testes de sessão |
| Perfil, avatar, senha e carteiras | `src/routes/profile.tsx`, `src/routes/wallets.tsx`, `tests/coverage-missing.spec.ts` |
| Favoritos e rollback otimista | `src/features/favorites/`, `src/mocks/handlers/favorites.handlers.ts`, teste `401` |
| Contratos tipados e erros REST | `src/contracts/`, `src/services/`, `src/mocks/handlers/` |
| MSW e fixtures determinísticas | `src/mocks/browser.ts`, `src/mocks/data/`, `src/mocks/storage/` |
| Simulação pelo protocolo Socket.IO | `src/mocks/realtime/`, `src/realtime/`, `tests/realtime.spec.ts` |
| Eventos duplicados/antigos e reconexão | `src/realtime/socket.sync.ts`, handlers de cenário e testes realtime |
| Recuperação de pagamento/idempotência | `src/services/order-recovery.service.ts`, testes de timeout e clique repetido |
| Skeletons e estados acessíveis | `src/kurio/Skeletons.tsx`, CSS, testes de fluxo e Lighthouse |
| Testes E2E executáveis | `tests/coverage-missing.spec.ts`, `tests/realtime.spec.ts`, `tests/ui-flow.spec.ts` (**48**) |
| Regressão visual versionada | `visual/*.spec.ts`, `visual/__screenshots__/` (**10**) |
| Lighthouse com três execuções | `scripts/audit-lighthouse.mjs`, `lighthouse-reports/` (**12**) |
| Documentação de arquitetura e execução | `README.md`, `ARCHITECTURE.md`, `docs/INTEGRACAO-SHADCN-TAILWIND.md` |
| Configuração de publicação | `vercel.json`, `.env.example`, scripts do `package.json` |

### Situação consolidada da entrega

- **E2E funcionais e tempo real:** **48/48 passaram**, conforme a execução final informada pelo desenvolvedor.
- **Regressão visual:** **10/10 passaram**, conforme execução final informada pelo desenvolvedor.
- **Lighthouse:** **12 medições** anexadas; 2/4 metas de Performance atingidas, 4/4 de acessibilidade, 4/4 de boas práticas e 4/4 de SEO atingidas.
- **Documentação, mocks, baselines e relatórios:** arquivos presentes no ZIP de referência e/ou identificados para inclusão via `.gitignore` atualizado.
- **Link de produção e link de repositório:** preencher com os endereços reais da submissão.

## 20. Referências e entrega

- **Enunciado oficial:** https://github.com/junglegaming/frontend-challenge
- **Figma oficial utilizado:** https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge
- **Arquitetura interna:** [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- **Integração visual:** [`docs/INTEGRACAO-SHADCN-TAILWIND.md`](./docs/INTEGRACAO-SHADCN-TAILWIND.md)
- **Testes:** [`tests/`](./tests/), [`visual/`](./visual/)
- **Auditorias finais:** [`lighthouse-reports/summary.json`](./lighthouse-reports/summary.json) e [`lighthouse-reports/`](./lighthouse-reports/)
- **Configuração do deploy:** [`vercel.json`](./vercel.json)

**Conclusão:** a Kurio entrega um marketplace demonstrável, com integração real entre componentes frontend, contratos REST mockados, persistência local, simulação de Socket.IO e jornadas completas de compra e conta. Os **48 testes E2E e os 10 testes visuais** foram reportados como aprovados na versão final após a migração da stack visual. A análise Lighthouse está publicada com todas as medições e com as limitações mobile explicitadas. A submissão deve acompanhar o repositório e a URL pública da aplicação, conforme solicitado no desafio.
