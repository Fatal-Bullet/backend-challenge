# Arquitetura

## Direção inicial

- NestJS com Fastify e TypeScript estrito.
- Bun 1.x é o runtime e test runner; as dependências são instaladas com `bun install`.
- MikroORM sobre PostgreSQL; unicidade, imutabilidade e saldo não-negativo serão reforçados por constraints SQL.
- `Money` usa `decimal.js` e trafega como string decimal com duas casas; nenhum valor financeiro usa `number`.
- A entrada HTTP e o consumidor SQS compartilharão o mesmo caso de uso transacional.
- Inbox, mudança da wallet, ledger e outbox serão confirmados na mesma transação SQL.
- O publisher da outbox usará locking por lote (`FOR UPDATE SKIP LOCKED`) para múltiplas instâncias.

## Autenticação

A autenticação fica fora do primeiro scaffold porque não pontua no desafio. O ponto de extensão será um guard baseado em IdP externo, sem tabela própria de senhas.

## Próximas decisões de implementação

Documentar a estratégia de lock por `walletId`, a taxonomia de falhas, o backoff de referências fora de ordem e o mapeamento de status HTTP antes dos casos de uso.