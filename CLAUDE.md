# CatalogoJonatas — Ferragem Pro

Catálogo de produtos para loja de ferragem com carrinho, painel admin e notificações WhatsApp/e-mail.

## Stack

- Next.js 15 + App Router + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui (Radix UI)
- Supabase (Auth + PostgREST) — `@supabase/supabase-js`
- Twilio — WhatsApp via Content Templates
- Nodemailer — SMTP
- Zod — validação de payload

## Regras de arquitetura

- Operações sensíveis (chaves, WhatsApp, e-mail, CRUD admin) ficam **exclusivamente** em `src/app/api/*`
- `src/integrations/supabase/client.ts` — usa anon key + respeita RLS (browser)
- `src/integrations/supabase/server.ts` — usa service role + **bypassa RLS** (apenas em API routes)
- Headers de segurança definidos **só** em `next.config.ts` — nunca em middleware
- Credenciais Twilio em runtime vêm de `company_settings` no banco, não do `.env` diretamente

## Autenticação admin — 4 condições simultâneas

1. Sessão válida no Supabase Auth
2. Role `admin` em `user_roles`
3. `email_confirmed_at` preenchido
4. Email igual ao `SETUP_ADMIN_EMAIL` no servidor

## Dev

```bash
npm run dev          # recomendado (polling habilitado, evita EMFILE)
npm run dev:clean    # limpa .next-dev antes de subir (útil para 404 estranhos)
npm run dev:turbo    # Turbopack (mais rápido, mas pode ter problemas com muitos watchers)
```

- Build dev em `.next-dev` (separado do `.next` de produção)
- Webpack polling `1000ms` ativo por padrão — desativar com `NEXT_DISABLE_WATCH_POLL=1`

## Scripts de diagnóstico

```bash
npm run test:db        # testa conexão HTTP + PostgREST
npm run test:db:crud   # DDL/DML Postgres (requer POSTGRES_URL ou SUPABASE_DB_* no .env.local)
npm run test:twilio    # testa envio WhatsApp direto na Twilio
```

## Memória interna do projeto

O projeto tem sua própria memória em `memoria/`:
- `memoria/INDEX.md` — hub
- `memoria/MEMORIA_PROJETO_OBSIDIAN.md` — histórico de erros e correções
- `memoria/RUNBOOKS_OPERACIONAIS.md` — runbooks

Antes de mudanças grandes, ler a memória e registrar correções em **Erros e Correcoes**.

## Armadilhas conhecidas

- **Twilio erro 63015** — número destino não entrou no WhatsApp Sandbox
- **Login admin com spinner infinito** — checar se `SUPABASE_API_URL` resolve DNS; testar `npm run test:db`
- **Dev 404 em `/`** — EMFILE; usar `npm run dev` (polling) ou `npm run dev:clean`
- **Imagens de produto** — data URL, limite ~750 KB após resize
