# CatalogoJonatas — Ferragem Pro

Catálogo de produtos para loja de ferragem com carrinho, painel admin e notificações WhatsApp/e-mail.

## Stack

- Next.js 15 + App Router + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui (Radix UI)
- PostgreSQL (local) + Drizzle ORM (`drizzle-orm/node-postgres`)
- Auth JWT local — `jsonwebtoken` + `bcryptjs` (sem Supabase)
- Twilio — WhatsApp via Content Templates
- Nodemailer — SMTP
- Zod — validação de payload

## Regras de arquitetura

- Operações sensíveis (chaves, WhatsApp, e-mail, CRUD admin) ficam **exclusivamente** em `src/app/api/*`
- `src/db/index.ts` — conexão Drizzle com PostgreSQL via `DATABASE_URL` (connection string TCP)
- Headers de segurança definidos **só** em `next.config.ts` — nunca em middleware
- Credenciais Twilio em runtime vêm de `company_settings` no banco, não do `.env` diretamente
- Auth admin: JWT assinado com `JWT_SECRET`; verificado em `src/lib/verify-admin-request.ts`

## Autenticação admin — condições simultâneas

1. JWT Bearer válido (assinado com `JWT_SECRET`)
2. Email no JWT igual ao `SETUP_ADMIN_EMAIL` no servidor
3. Registro em `admin_users` com `email_confirmed_at` preenchido

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
npm run test:db        # testa conexão PostgreSQL
npm run test:twilio    # testa envio WhatsApp direto na Twilio
```

## Produção — Hetzner VPS

- **IP:** 116.202.27.216 | **SSH:** `ssh root@116.202.27.216`
- **Stack:** Ubuntu 24.04, Node 20 (nvm), PM2, Nginx (proxy porta 80 → 3000)
- **Banco:** PostgreSQL local, `catalogo_db`, `catalogo_user`, host `127.0.0.1:5432`
- **Deploy/update:**
  ```bash
  export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh"
  cd /var/www/catalogo && git pull origin master && npm run build
  set -a && source .env.local && set +a
  pm2 restart catalogo-jonatas --update-env
  ```

## Memória interna do projeto

O projeto tem sua própria memória em `memoria/`:
- `memoria/INDEX.md` — hub
- `memoria/MEMORIA_PROJETO_OBSIDIAN.md` — histórico de erros e correções
- `memoria/RUNBOOKS_OPERACIONAIS.md` — runbooks

Antes de mudanças grandes, ler a memória e registrar correções em **Erros e Correcoes**.

## Armadilhas conhecidas

- **PM2 perde DATABASE_URL** — sempre `source .env.local` antes de `pm2 restart --update-env`
- **PostgreSQL peer auth** — usar `host=127.0.0.1` (TCP), não `localhost` (socket)
- **Twilio erro 63015** — número destino não entrou no WhatsApp Sandbox
- **Dev 404 em `/`** — EMFILE; usar `npm run dev` (polling) ou `npm run dev:clean`
- **Imagens de produto** — data URL, limite ~750 KB após resize
