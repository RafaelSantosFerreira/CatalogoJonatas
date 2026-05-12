# Ferragem Pro - Catalogo com carrinho, admin e notificacoes

Aplicacao web em Next.js com:

- catalogo de produtos
- carrinho e finalizacao de pedidos
- painel administrativo
- persistencia com Supabase/Nubase
- notificacoes de WhatsApp (Twilio)
- notificacoes por e-mail (SMTP)

Este README foi escrito para ser pratico e didatico, cobrindo setup local, configuracao de ambiente, testes e troubleshooting.

---

## 1) Stack e principais pastas

### Stack

- Next.js 15 + App Router
- React 19 + TypeScript
- Tailwind CSS
- Supabase JS (`@supabase/supabase-js`)
- Twilio API (WhatsApp)
- Nodemailer (SMTP)

### Estrutura principal

- `src/app` - paginas e rotas API
- `src/components` - UI da loja e painel admin
- `src/context` - Auth, Cliente, Carrinho
- `src/lib` - notificacoes, logger, utilitarios
- `src/app/api` - endpoints (`/api/whatsapp`, `/api/test-notifications`, etc.)
- `scripts` - scripts de teste (`test-db-connection`, `test-twilio-whatsapp`)

---

## 2) Requisitos locais

- Node.js 20+ (recomendado)
- npm (ou pnpm)
- Conta Supabase/Nubase
- Conta Twilio (para WhatsApp)

---

## 3) Instalacao e execucao

No diretorio do projeto:

```bash
npm install --legacy-peer-deps
npm run dev
```

Abra a URL exibida no terminal (normalmente `http://localhost:3000`).

> Nota importante de estabilidade no desenvolvimento: o projeto usa diretório de build separado no modo dev (`.next-dev`) para evitar conflitos de cache com build de produção e reduzir erros de tela branca por `ENOENT`.

### Scripts disponiveis

```bash
npm run dev          # desenvolvimento (webpack + polling de arquivos por padrao; reduz 404 por EMFILE)
npm run dev:turbo    # mesmo dev com Turbopack (mais rapido se o sistema aguentar os watchers)
npm run dev:poll     # igual ao dev (polling ja e padrao; mantido por compatibilidade)
npm run dev:clean    # apaga `.next-dev` e sobe o dev (util se rotas ficarem 404 / cache estranho)
npm run dev:lan      # dev escutando em 0.0.0.0 (acesso na LAN)
npm run build        # build de producao
npm run start        # sobe build
npm run lint         # lint
npm run test:db      # testa conexao com banco (HTTP + PostgREST)
npm run test:db:crud # DDL/DML no Postgres (precisa POSTGRES_URL ou SUPABASE_DB_* no .env.local)
npm run test:twilio  # testa envio WhatsApp direto na Twilio
```

Se ainda aparecer **404 em `/` no dev** com muitos `EMFILE` no terminal: reinicie o `npm run dev` (agora com **polling** por padrao), aumente `ulimit -n`, ou evite `dev:turbo`. Para desativar polling nativo do webpack: `NEXT_DISABLE_WATCH_POLL=1 npm run dev` (e opcionalmente `WATCHPACK_POLLING=0`).

---

## 4) Configuracao de ambiente (`.env.local`)

Copie `.env.example` para `.env.local` e preencha.

### Obrigatorias para rodar

- `SUPABASE_API_URL`
- `SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `DATABASE_SERVICE_ROLE_KEY`

### Importantes para funcionalidades

- `SETUP_ADMIN_EMAIL`
- `SETUP_ADMIN_PASSWORD`
- `SETUP_API_TOKEN`
- `NEXT_PUBLIC_SETUP_API_TOKEN` (opcional; usado pelo botao de primeiro acesso no frontend)
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `TWILIO_CONTENT_SID`

> Nunca commite `.env.local`.  
> Se alguma chave foi exposta, regenere no provedor.

---

## 5) Tutorial rapido: criar conta e projeto no Supabase

### Passo 1 - Criar conta

1. Acesse [https://supabase.com](https://supabase.com)
2. Clique em **Start your project**
3. Cadastre-se (GitHub, Google ou e-mail)

### Passo 2 - Criar projeto

1. Clique em **New project**
2. Informe:
   - Organization
   - Project name
   - Database password
   - Region
3. Aguarde o status ficar pronto

### Passo 3 - Pegar URL e chaves

1. Abra o projeto
2. Va em **Project Settings -> API**
3. Copie:
   - **Project URL**
   - **anon / publishable key**
   - **service role / secret key**

### Passo 4 - Preencher `.env.local`

```env
SUPABASE_API_URL=https://seu-projeto.supabase.co/rest/v1/
SUPABASE_ANON_KEY=...
DATABASE_URL=https://seu-projeto.supabase.co
DATABASE_SERVICE_ROLE_KEY=...
```

### Passo 5 - Validar conexao

```bash
npm run test:db
```

Se retornar conexao OK, banco configurado.

---

## 6) Tutorial rapido: criar conta no Twilio e habilitar WhatsApp

### Passo 1 - Criar conta

1. Acesse [https://www.twilio.com](https://www.twilio.com)
2. Clique em **Sign up**
3. Valide e-mail e telefone

### Passo 2 - Abrir Console

No Console da Twilio, obtenha:

- `Account SID`
- `Auth Token`

### Passo 3 - Configurar WhatsApp Sandbox (ambiente de teste)

1. Va em **Messaging -> Try it out -> Send a WhatsApp message** (Sandbox)
2. Pegue o numero sandbox (`whatsapp:+14155238886`) e a frase `join ...`
3. Do telefone de destino, envie a frase `join` para o numero sandbox

> Sem esse passo, a Twilio pode aceitar a requisicao mas falhar na entrega com erro `63015`.

### Passo 4 - Configurar template (Content SID)

1. Va em **Content Template Builder**
2. Crie/aprove template com variaveis esperadas pelo projeto:
   - `{{1}}` nome
   - `{{2}}` resumo
3. Copie o `Content SID` (ex.: `HX...`)

### Passo 5 - Preencher `.env.local`

```env
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_CONTENT_SID=HX...
```

### Passo 6 - Importar para o sistema

No painel admin:

1. Abra **Configuracoes da Empresa**
2. Clique em **Importar do .env (servidor)**
3. Salve configuracoes

### Passo 7 - Testar Twilio

```bash
npm run test:twilio
```

Ou no painel admin, clique em **Testar WhatsApp (Twilio)**.

---

## 7) Fluxo de envio de WhatsApp no carrinho

Regra atual:

- Ao finalizar pedido, o sistema envia automaticamente para o **WhatsApp da empresa** configurado no admin.
- A mensagem inclui:
  - nome do comprador
  - telefone informado no carrinho
  - resumo de itens e total

Se falhar no envio automatico, o usuario ainda pode usar envio manual (fallback) conforme configuracao.

---

## 8) Endpoints principais

- `GET /api/health`
- `POST /api/setup` - cria admin inicial (usa env)
- `POST /api/seed-twilio` - importa credenciais Twilio do env para `company_settings`
- `POST /api/whatsapp` - envio WhatsApp transacional
- `GET /api/whatsapp-logs` - historico de logs WhatsApp
- `POST /api/test-notifications` - teste de WhatsApp/e-mail via painel admin
- `GET /api/supabase-ping` - diagnostico de conexao
- `GET /api/admin-access` - validacao de sessao admin (email + confirmacao + role)

---

## 9) Logs e diagnostico

O projeto possui logs estruturados com `traceId`.

Para depurar envio:

1. Finalize pedido ou rode teste admin
2. Localize `traceId` no terminal
3. Confira eventos:
   - `cart.finalize.*` (cliente)
   - `api/whatsapp.*` (servidor)
   - `twilio-messaging.*` (chamada Twilio)

Erros comuns:

- `63015` - numero nao entrou no WhatsApp Sandbox
- `Credenciais Twilio nao configuradas` - faltando importacao/env
- `Campos obrigatorios` - payload incompleto

---

## 10) Troubleshooting rapido

### Internal Server Error / tela branca no dev (Next/Turbopack)

Se aparecer `ENOENT` em `app-build-manifest` ou `_buildManifest.js.tmp`:

1. pare todos os `npm run dev`
2. inicie apenas um `npm run dev`
3. se persistir, remova `.next-dev` e suba novamente
4. confirme que a porta aberta no navegador e a mesma mostrada no terminal

### Teste admin funciona e carrinho nao

Normalmente:

- numero destino do fluxo do carrinho nao habilitado no sandbox
- dados de `company_settings` desatualizados
- variaveis Twilio nao importadas/salvas

---

## 11) Seguranca

- Nao exponha `DATABASE_SERVICE_ROLE_KEY` e `TWILIO_AUTH_TOKEN`.
- Nao commite `.env.local`.
- Regere chaves se vazarem.
- Em producao, use senha forte no setup admin (`SETUP_ADMIN_PASSWORD`).
- Proteja o setup inicial com `SETUP_API_TOKEN`.
- Endpoints sensiveis contam com rate limit e validacao de payload (`zod`).
- Headers de seguranca ativos: CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`.

### Regra de acesso da area admin (atual)

Para acessar recursos administrativos, o usuario precisa atender simultaneamente:

- sessao valida;
- role `admin` na tabela `user_roles`;
- email confirmado (`email_confirmed_at`);
- email exatamente igual ao `SETUP_ADMIN_EMAIL` configurado no servidor.

---

## 12) Performance (atualizacoes recentes)

- Troca de imagens para `next/image` nos componentes principais (catalogo, admin, carrinho e modais).
- Lazy loading de modais pesados para reduzir JS inicial.
- Eliminacao de consulta N+1 no carregamento de produtos (atributos em lote com agrupamento em memoria).
- Build de desenvolvimento isolado em `.next-dev`, reduzindo instabilidade e recarregamentos quebrados.

---

## 13) Melhorias recomendadas para producao

- Sair do WhatsApp Sandbox e usar numero aprovado WhatsApp Business
- Webhook de status de mensagem Twilio (queued/sent/delivered/failed)
- Alertas de falha de entrega
- Validacoes de telefone mais rigidas no cadastro de cliente
- Pipeline CI com lint + testes

---

Se quiser, eu tambem posso gerar uma versao resumida deste README para usuario final (operacao da loja) e outra tecnica para devops.
