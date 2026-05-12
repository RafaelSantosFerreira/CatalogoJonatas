# Ferragem Pro — Next.js (Catálogo)

Aplicação full-stack em Next.js com Supabase, Tailwind CSS 4 e Radix UI.

Crie rotas em `src/app/api` apenas quando necessário. Operações sensíveis (chaves, grants, e-mail/WhatsApp) ficam no servidor.

## Tech Stack

- **Pacotes**: npm ou pnpm (há `package-lock.yaml` e `pnpm-lock.yaml`)
- **Frontend**: React + Next.js + TypeScript + Tailwind CSS 4
- **Backend**: App Router (`src/app/api/*`)
- **UI**: Radix UI + Lucide React
- **Dados**: Supabase (`@supabase/supabase-js`) — cliente anônimo no browser; service role só em rotas servidor

## Supabase

- **Pasta**: `src/integrations/supabase/`
- **`client.ts`**: `supabase` no cliente (RLS)
- **`server.ts`**: `supabaseAdmin` no servidor (bypass RLS — usar só em API/actions)
- **`types.ts`**: tipos das tabelas

### Rotas API de exemplo

- `GET /api/health` — health check

## Novas features

### Rota API

1. Crie `src/app/api/<nome>/route.ts`
2. Exporte `GET` / `POST` / etc. conforme necessário

### Página

1. Crie `src/app/<rota>/page.tsx`

## Memória (Obsidian)

- Hub: `memoria/INDEX.md`
- Memória principal: `memoria/MEMORIA_PROJETO_OBSIDIAN.md`
- Runbooks: `memoria/RUNBOOKS_OPERACIONAIS.md`
- Antes de mudanças grandes ou incidentes, leia a memória e registre correções em **Erros e Correcoes**.
