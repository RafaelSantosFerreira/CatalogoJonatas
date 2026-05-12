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
atualizado_em: 2026-05-11
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
- Teste CRUD Postgres (DDL + DML + DROP): `npm run test:db:crud` (requer `POSTGRES_URL` ou `SUPABASE_DB_*` no `.env.local`)

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
  - `SUPABASE_API_URL`
  - `SUPABASE_ANON_KEY`
- Server/privadas (cliente admin `supabase-js`):
  - URL https do projeto: `DATABASE_URL` se for `http(s)://`, senao `SUPABASE_API_URL` (mesma regra que `npm run test:db`).
  - `DATABASE_SERVICE_ROLE_KEY` ou `SUPABASE_SERVICE_ROLE_KEY`
- Infra/diagnostico de conexão PostgreSQL (opcionais, sem duplicar URL/chaves):
  - `SUPABASE_DB_HOST`
  - `SUPABASE_DB_PORT`
  - `SUPABASE_DB_NAME`
  - `SUPABASE_DB_USER`
  - `SUPABASE_DB_PASSWORD`
  - `SUPABASE_DB_SSLMODE`

## Erros e Correcoes (Historico Dinamico)

> Atualizar esta secao sempre que houver incidente relevante.

### 2026-05-11 - Login admin com credencial padrao "nao funciona" (diagnostico real: rede/DNS)

- Sintoma:
  - Usuario e senha padrao parecem nao aceitos; toast generico; logs com `POST /api/admin-login 500`.
- Causa raiz (evidencia em log do servidor Next):
  - `TypeError: fetch failed` / `getaddrinfo ENOTFOUND` ao chamar `https://<ref>.supabase.co/auth/v1/token` — o **hostname do Supabase no `.env.local` nao resolve** (projeto apagado/pausado, URL errada, DNS, VPN, sandbox sem rede).
  - Nao e senha incorreta: a requisicao **nem chega** ao Auth.
- Correcao aplicada:
  - `POST /api/admin-login`: `try/catch` no `fetch` ao Supabase; resposta **503 JSON** com mensagem clara (`SUPABASE_UNREACHABLE`).
  - `AuthContext` fallback: le `res.text()` antes de `JSON.parse`; evita `Unexpected end of JSON input` em corpo vazio.
  - `LoginForm`: toast exibe a mensagem de erro retornada (ate ~120 caracteres).
- Acao para o operador:
  - Corrigir `SUPABASE_API_URL` / `DATABASE_URL` para o projeto Supabase **ativo**; testar `npm run test:db` ou `nslookup <host>`.

### 2026-05-11 - Area admin nao abre (spinner / volta ao login)

- Sintoma:
  - `/admin` demora muito ou fica em loading; logs com `Failed to fetch` no cliente ao Supabase; `GET /admin 200` mesmo assim.
- Causas:
  - Login via `POST /api/admin-login` gravava estado React manual sem `supabase.auth.setSession`, perdendo consistencia com `getUser`/campos do usuario.
  - `AdminGuard` chamava `/api/admin-access` sem timeout (rede lenta = spinner infinito); `user.email_confirmed_at` sem optional chaining.
- Correcao aplicada:
  - Apos tokens do fallback, `supabase.auth.setSession` com fallback ao estado manual se falhar.
  - `AdminGuard`: timeout 18s em `/api/admin-access`, logs de erro; `signOut` com timeout e limpeza local garantida.
- Validacao:
  - `tsc --noEmit` OK.

### 2026-05-11 - Erro ao acessar `/admin/login` (runtime)

- Sintoma: area administrativa nao carrega; erro no console do browser (ex.: `ReferenceError: searchParams is not defined`).
- Causa: `LoginForm` referenciava `searchParams` no `useEffect` sem `const searchParams = useSearchParams()`.
- Correcao: declarar `useSearchParams()` no componente (pagina ja envolve em `Suspense`).

### 2026-05-11 - Pagina em loading longo e depois 404

- Sintoma:
  - Home fica "carregando" muito tempo e termina em 404, ou conteudo nunca aparece.
- Causas combinadas:
  - Dev: EMFILE/watchpack (ja mitigado com polling em `next.config` + `run-next-dev.sh`).
  - SSR: `generateMetadata` podia esperar o Supabase sem limite; cliente: `fetchProducts` / `company_settings` sem timeout deixavam loading infinito se a rede falhasse.
- Correcao aplicada:
  - Timeout ~4s em metadados (`company_settings`); timeouts em listagem de produtos e detalhes; `company_settings` no hook com 20s.
  - `src/app/loading.tsx` para feedback durante streaming.
  - Script `npm run dev:clean` (remove `.next-dev` antes do dev).
- Validacao:
  - `tsc` e `next build` OK.

### 2026-05-11 - Dev retornando 404 em `/` com EMFILE no log

- Sintoma:
  - Navegador: "404 This page could not be found." na raiz.
  - Terminal: muitos `Watchpack Error (watcher): EMFILE`, `Compiling /_not-found`, `GET / 404`.
- Causa raiz:
  - Limite de arquivos abertos no macOS; watchers nativos falham e o Next nao registra a rota `/` no dev.
- Correcao aplicada:
  - `WATCHPACK_POLLING=1` por padrao em `scripts/run-next-dev.sh`.
  - `next.config.ts`: `webpack.watchOptions` em dev com `poll` + `ignored` (desligar com `NEXT_DISABLE_WATCH_POLL=1`).
- Validacao:
  - Reexecutar `npm run dev` e conferir `GET / 200` apos `Compiled /`.

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

### 2026-05-08 - Regra de credenciais centralizada no `.env.local`

- Sintoma:
  - Credenciais Twilio estavam hardcoded no `app.sql` e no script de migração.
- Causa raiz:
  - Seed SQL estava populando segredos diretamente no banco durante migração.
- Correcao aplicada:
  - Removidos segredos do `app.sql` e do `scripts/run-supabase-migration.mjs`;
  - `app.sql` agora apenas garante singleton em `company_settings` sem credenciais;
  - fluxo oficial de credenciais Twilio mantido via `.env.local` + `POST /api/seed-twilio`.
- Validacao:
  - Nenhuma credencial Twilio fixa permanece nos arquivos versionados alterados.

### 2026-05-11 - Login admin falhando por ausência de usuário

- Sintoma:
  - Não foi possível acessar `/admin` mesmo com credenciais esperadas.
- Causa raiz:
  - Projeto Supabase sem usuários cadastrados em `auth.users` (`listUsers` retornando vazio).
- Correcao aplicada:
  - Criado usuário `admin@ferragem.com` com e-mail confirmado.
  - Garantidos registros em `profiles` e papel `admin` em `user_roles`.
- Validacao:
  - Autenticação por senha no Supabase retornando `200` (`grant_type=password`).

### 2026-05-11 - Login retornando erro 500 no Auth após migration

- Sintoma:
  - Login em `/admin/login` não concluía e usuário não era direcionado para área administrativa.
  - Endpoint `/auth/v1/token` retornava `500` com `Database error querying schema`.
- Causa raiz:
  - Seed manual em `auth.users` via SQL gerou estado inconsistente para o Auth.
- Correcao aplicada:
  - Removido usuário seedado manualmente em `auth.users`.
  - Recriado admin via API oficial (`supabase.auth.admin.createUser`) e sincronizado em `profiles` + `user_roles`.
  - Ajustado execução do app em instância com acesso de rede ao Supabase para validação de `admin-access`.
- Validacao:
  - `POST /auth/v1/token?grant_type=password` retornando `200`.
  - `/api/admin-access` retornando `200` com token de admin.

### 2026-05-11 - Login sem redirecionar por falha client-side de fetch

- Sintoma:
  - Usuário fazia login, mas não era direcionado para área administrativa.
  - Logs client-side exibiam `AuthContext.signIn -> Failed to fetch`.
- Causa raiz:
  - Fluxo de login dependia apenas de `supabase.auth.signInWithPassword` no browser; em cenários de falha de rede client-side, a sessão não era criada.
- Correcao aplicada:
  - Criada rota server-side `POST /api/admin-login` para autenticar via servidor.
  - `AuthContext.signIn` passou a usar fallback automático para `/api/admin-login` quando ocorre erro de fetch no cliente.
- Validacao:
  - `/api/admin-login` retornando `200` com token válido.
  - `/api/admin-access` retornando `200` usando token do fallback.

### 2026-05-11 - Auditoria tecnica (seguranca, dev e documentacao)

- Escopo:
  - Revisao de rotas API, headers globais, login admin e scripts de desenvolvimento.
- Achados principais:
  - **`src/middleware.ts`**: duplicava CSP e headers ja definidos em `next.config.ts` (risco de divergencia e custo por request).
  - **`POST /api/admin-login`**: faltava rate limit por IP (forca bruta / abuso).
  - **Dev**: Turbopack + EMFILE; scripts `dev` via `run-next-dev.sh` com `ulimit` e mensagens orientativas.
- Correcoes aplicadas:
  - Removido `src/middleware.ts`; fonte unica de headers de seguranca em `next.config.ts`.
  - `admin-login`: rate limit **30 req / 15 min / IP**.
  - `.env.example`, `projeto.md`, `DOCUMENTACAO-CODIGO-FONTE.md` alinhados ao comportamento atual.
- Validacao:
  - `npx next build` concluido com sucesso apos as mudancas.

### 2026-05-11 - Remocao de integracao legada (proxy terceiro + pacote npm)

- Contexto: descontinuado proxy catch-all, iframe bridge e pacote de upload de terceiros.
- Alteracoes:
  - Removidos rota catch-all de proxy em `src/app/`, modulos auxiliares do proxy, hook de iframe em `src/hooks/` e dependencia npm usada apenas para upload legado.
  - Upload de foto de produto: **data URL** no form (limite ~750 KB apos resize), sem servico externo de upload.
  - `GlobalClientEffects` apenas com captura global de erros.
  - Documentacao (`AGENTS.md`, `projeto.md`, `DOCUMENTACAO-CODIGO-FONTE.md`, `.env.example`) e SQL em `auth/202508181030schema_chatbox_rls.sql` (funcao/GUC com prefixo neutro `catalogo_*`).
- Nota DB: ambientes que ja aplicaram versao anterior do SQL com nome antigo de funcao precisam de migracao manual se reexecutarem o arquivo (politicas referenciam o nome da funcao).

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
