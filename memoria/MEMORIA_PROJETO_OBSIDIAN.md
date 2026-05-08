---
aliases:
  - Memoria Projeto
  - Project Memory
tags:
  - memoria
  - obsidian
  - agentes
  - supabase
  - nextjs
status: ativo
atualizado_em: 2026-05-08
responsavel: agentes
---

# Memoria do Projeto - CatalogoJonatas

> Fonte de verdade operacional para agentes e devs.  
> Objetivo: acelerar entendimento do projeto, padronizar diagnostico e reduzir retrabalho.

## Acesso Rapido

- Hub de memoria: [[INDEX]]
- Runbooks operacionais: [[RUNBOOKS_OPERACIONAIS]]
- Documentacao geral: [[README]]
- Estrutura detalhada: [[projeto]]
- Instrucoes para agentes: [[AGENTS]]
- Ambiente local: `./.env.local` (nao versionado)
- Script de diagnostico de banco: `scripts/test-db-connection.mjs`

## Snapshot do Projeto

- Nome funcional: Ferragem Pro (catalogo + carrinho + admin + notificacoes)
- Stack principal: Next.js App Router + React + TypeScript + Supabase + Twilio + SMTP
- Tipo de persistencia: Supabase/Nubase (Auth + PostgREST)
- Areas criticas:
  - autenticacao/admin
  - finalizacao de pedido
  - envio WhatsApp/e-mail
  - configuracoes da empresa (`company_settings`)

## Comportamento do Sistema

## Fluxo principal de negocio

1. Usuario navega no catalogo e adiciona itens no carrinho.
2. Usuario finaliza pedido com dados de cliente.
3. Sistema tenta notificar empresa (WhatsApp e/ou e-mail).
4. Admin gerencia produtos, logs e configuracoes no painel.

## Regras importantes

- Operacoes sensiveis ficam no server-side (rotas `src/app/api`).
- Cliente Supabase (`client.ts`) usa chave publica e respeita RLS.
- Cliente admin (`server.ts`) usa chave de servico e bypassa RLS.
- Acesso admin exige sessao valida + role `admin` + e-mail confirmado + e-mail igual ao configurado no servidor.

## Metodologia Aplicada (trabalho com agentes)

## Principios

- Fonte de verdade unica: este arquivo + `README.md`.
- Mudancas pequenas e verificaveis (testar apos cada ajuste).
- Prioridade para diagnostico orientado a evidencias (logs, status HTTP, resposta de API).
- Seguranca primeiro: nunca expor tokens secretos em commits.

## Rotina recomendada para qualquer agente

1. Ler `README.md`, `AGENTS.md`, `memoria/INDEX.md` e esta memoria.
2. Validar ambiente (`.env.local`, scripts de teste, dependencias).
3. Reproduzir problema antes de editar.
4. Aplicar correcao minima necessaria.
5. Revalidar com script, endpoint ou fluxo manual.
6. Registrar incidente/correcao na secao "Erros e Correcoes".

## Variaveis de Ambiente Criticas

- Front/public:
  - `NEXT_PUBLIC_DATABASE_URL`
  - `NEXT_PUBLIC_DATABASE_PUBLISHABLE_KEY`
- Server/privadas:
  - `DATABASE_URL`
  - `DATABASE_SERVICE_ROLE_KEY`
- Referencias adicionais (infra/diagnostico):
  - `SUPABASE_PROJECT_URL`
  - `SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SECRET_KEY`
  - `SUPABASE_DB_HOST`
  - `SUPABASE_DB_PORT`
  - `SUPABASE_DB_NAME`
  - `SUPABASE_DB_USER`
  - `SUPABASE_DB_PASSWORD`
  - `SUPABASE_DB_SSLMODE`

## Erros e Correcoes (Historico Dinamico)

> Atualizar esta secao sempre que houver incidente relevante.

### 2026-05-08 - Credenciais Supabase desatualizadas

- Sintoma:
  - Aplicacao sem conexao valida com a instancia desejada do Supabase.
- Causa raiz:
  - `.env.local` inexistente ou com credenciais antigas.
- Correcao aplicada:
  - Criado/atualizado `./.env.local` com URL, publishable key, secret key e parametros de DB.
- Validacao:
  - `GET /auth/v1/health` retornou `200 OK`.

### 2026-05-08 - Falha ao executar `npm run test:db`

- Sintoma:
  - PowerShell: `npm` nao reconhecido.
- Causa raiz:
  - Ambiente local sem `npm` no PATH da sessao.
- Correcao aplicada:
  - Execucao alternativa via `node` para diagnostico HTTP direto.
- Acao preventiva:
  - Instalar Node.js com npm habilitado no PATH, ou usar terminal/shell com npm disponivel.

### 2026-05-08 - Script de teste sem dependencias instaladas

- Sintoma:
  - `ERR_MODULE_NOT_FOUND` para `@supabase/supabase-js`.
- Causa raiz:
  - `node_modules` ausente (dependencias nao instaladas).
- Correcao aplicada:
  - Bypass temporario: teste direto em endpoints Supabase via `fetch`.
- Acao preventiva:
  - Rodar instalacao de dependencias antes dos scripts (`npm install` ou equivalente).

### 2026-05-08 - Endpoint de tabela de produto retornando `404` (`PGRST205`)

- Sintoma:
  - `/rest/v1/products?select=id&limit=1` retorna `Could not find the table 'public.products'`.
- Causa raiz:
  - Tabela `products` nao existe no schema `public` (ou nome/schema divergente).
- Correcao aplicada:
  - Confirmada conectividade; incidente classificado como schema/estrutura, nao rede.
- Proximo passo sugerido:
  - Ajustar script para consultar tabela existente em `app.sql`.

### 2026-05-08 - `app.sql` não idempotente em ambiente existente

- Sintoma:
  - Execucao via Management API falhando com erro de `ON CONFLICT` sem constraint compativel.
- Causa raiz:
  - `ON CONFLICT ((true))` no seed singleton de `company_settings` e conflito no seed de `auth.users`.
- Correcao aplicada:
  - `app.sql` atualizado para:
    - usar `ON CONFLICT (instance_id, email)` no seed de `auth.users`;
    - substituir upsert singleton por bloco `DO $$ ... UPDATE ... IF NOT FOUND THEN INSERT ... END $$`;
    - recriar trigger `on_auth_user_created` com `DROP TRIGGER IF EXISTS` antes do `CREATE`.
- Validacao:
  - Migracao aplicada por API com sucesso (`STATUS=201`) e tabelas principais confirmadas via `information_schema`.

## Playbook de Diagnostico Rapido

## Banco/Supabase

1. Validar variaveis em `.env.local`.
2. Testar health:
   - `GET {DATABASE_URL}/auth/v1/health` com header `apikey`.
3. Testar PostgREST com service role:
   - `GET {DATABASE_URL}/rest/v1/<tabela>?select=id&limit=1`.
4. Se `404 PGRST205`, revisar schema/tabela no SQL.

## Notificacoes (Twilio/SMTP)

1. Confirmar credenciais no env e em `company_settings`.
2. Executar script de teste (`test:twilio`) quando dependencias estiverem instaladas.
3. Conferir logs de API e rastrear por `traceId`.

## Convencoes para novos registros nesta memoria

- Sempre registrar:
  - data
  - sintoma
  - causa raiz
  - correcao aplicada
  - validacao objetiva
- Manter linguagem direta e orientada a acao.
- Evitar dados sensiveis (nunca gravar segredo completo aqui).
