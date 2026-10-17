# Correção da rodada Playwright (9 testes: 3 passaram, 6 falharam)

1. Após login, o token mudava no localStorage mas a mesma aba não recebia um evento `storage`. O componente RealtimeConnection continuava ligado à identidade de convidado (guest), em vez de iniciar o socket autenticado. Implementado um store de token observável via useSyncExternalStore e notificação explícita em login/logout.
2. Na limpeza do cache de login/logout, a consulta ativa da sessão era removida do TanStack Query. Agora ela é preservada e atualizada, e apenas os caches não relacionados à autenticação são descartados. Isso mantém a assinatura ativa para a camada de tempo real.
3. Para estoque zero, a API do carrinho respondia insufficient_stock mesmo quando a edição estava completamente indisponível. Agora devolve unavailable; insuficiente_stock continua para quantidade maior que estoque positivo.

Verificado neste ambiente: TypeScript (--noEmit): aprovado; ESLint: aprovado.
Build não validado aqui porque o node_modules do Windows não contém o binário nativo Linux do Rolldown. O Playwright completo deve ser executado no Windows.

Aplicação: extrair os arquivos desta pasta na raiz de G:\chalenge\jungle-nft-marketplace, substituindo os arquivos correspondentes. Não copiar node_modules ou dist.

Comandos no Windows (PowerShell):
cd G:\chalenge\jungle-nft-marketplace
npx tsc -p tsconfig.app.json --noEmit
npm run lint
npm run test:realtime

Se persistirem erros, enviar o novo relatório completo e, preferencialmente, os arquivos test-results/*/error-context.md.
