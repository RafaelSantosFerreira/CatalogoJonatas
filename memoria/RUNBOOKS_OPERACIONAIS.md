---
aliases:
  - Runbooks
  - Operacao Projeto
tags:
  - memoria
  - runbook
  - operacao
status: ativo
atualizado_em: 2026-05-11
---

# Runbooks Operacionais - CatalogoJonatas

## Objetivo

Guias curtos para execucao rapida por agentes/devs, com foco em repetibilidade e baixo tempo de resposta.

## Runbook 1 - Subir ambiente do zero

## Pre-requisitos

- Node.js 20+ com `npm` disponivel no PATH.
- Acesso ao projeto Supabase.
- Arquivo `.env.local` com variaveis obrigatorias preenchidas.

## Passo a passo

1. Entrar na raiz do projeto: `g:/IA/CatalogoJonatas`.
2. Instalar dependencias:
   - `npm install --legacy-peer-deps`
3. Verificar variaveis de ambiente obrigatorias:
   - `SUPABASE_API_URL`
   - `SUPABASE_ANON_KEY`
   - `DATABASE_URL`
   - `DATABASE_SERVICE_ROLE_KEY`
4. Testar conexao com banco:
   - `npm run test:db`
5. Subir aplicacao em desenvolvimento:
   - `npm run dev`
6. Validar endpoint de health da aplicacao:
   - `GET /api/health`

## Criterio de pronto

- App inicia sem erro fatal.
- `test:db` confirma conectividade.
- Catalogo abre e carrega dados esperados.

## Falhas comuns e resposta rapida

- `npm` nao reconhecido:
  - ajustar PATH/instalacao do Node.
- `ERR_MODULE_NOT_FOUND`:
  - instalar dependencias (`npm install`).
- erro `ENOENT` em `.next-dev`:
  - parar dev server duplicado, remover `.next-dev`, subir novamente.

## Runbook 2 - Validar producao em 5 minutos

## Janela 0-2 min: disponibilidade e configuracao

1. Verificar health da app:
   - `GET /api/health` => esperado `200`.
2. Verificar conectividade Supabase:
   - `GET /api/supabase-ping` => esperado sucesso de health.
3. Conferir variaveis criticas no ambiente de deploy (sem expor valores):
   - URL do banco
   - chave publica
   - chave service role

## Janela 2-4 min: fluxo de negocio critico

1. Abrir catalogo e adicionar item ao carrinho.
2. Finalizar pedido com cliente de teste.
3. Confirmar:
   - pedido concluido sem excecao
   - tentativa de notificacao registrada

## Janela 4-5 min: rastreabilidade e erros

1. Coletar `traceId` do fluxo executado.
2. Revisar logs:
   - `cart.finalize.*`
   - `api/whatsapp.*`
   - `twilio-messaging.*`
3. Classificar incidente (rede, credencial, schema, payload, permissao).

## Criterio de aprovado

- Health OK.
- Fluxo fim-a-fim executa sem erro bloqueante.
- Logs com rastreabilidade completa por `traceId`.

## Checklist rapido para agentes

- [ ] Leu `memoria/MEMORIA_PROJETO_OBSIDIAN.md`
- [ ] Validou env critico
- [ ] Rodou teste de banco
- [ ] Validou health da app
- [ ] Executou fluxo de carrinho
- [ ] Registrou incidente/correcao se houver

## Runbook - Dev local (404 / EMFILE)

- Usar `npm run dev` na raiz do repositorio; abrir a URL **Local** impressa (porta pode nao ser 3000).
- Se `/` retornar 404 ou Watchpack EMFILE: `npm run dev:poll` ou aumentar `ulimit -n` antes do dev.
- `npm run dev:turbo` apenas se o ambiente suportar Turbopack sem estouro de watchers.

