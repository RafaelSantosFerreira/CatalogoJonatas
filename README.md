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

Abra a URL exibida no terminal (normalmente `http://localhost:3000`, ou outra porta livre como `3006`/`3007`).

### Scripts disponiveis

```bash
npm run dev          # desenvolvimento
npm run build        # build de producao
npm run start        # sobe build
npm run lint         # lint
npm run test:db      # testa conexao com banco
npm run test:twilio  # testa envio WhatsApp direto na Twilio
```

---

## 4) Configuracao de ambiente (`.env.local`)

Copie `.env.example` para `.env.local` e preencha.

### Obrigatorias para rodar

- `NEXT_PUBLIC_DATABASE_URL`
- `NEXT_PUBLIC_DATABASE_PUBLISHABLE_KEY`
- `DATABASE_URL`
- `DATABASE_SERVICE_ROLE_KEY`

### Importantes para funcionalidades

- `SETUP_ADMIN_EMAIL`
- `SETUP_ADMIN_PASSWORD`
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
NEXT_PUBLIC_DATABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_DATABASE_PUBLISHABLE_KEY=...
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

### Internal Server Error no dev (Next/Turbopack)

Se aparecer `ENOENT` em `.next/...manifest...`:

1. pare todos os `npm run dev`
2. inicie apenas um `npm run dev`
3. se persistir, remova `.next` e suba novamente

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

---

## 12) Melhorias recomendadas para producao

- Sair do WhatsApp Sandbox e usar numero aprovado WhatsApp Business
- Webhook de status de mensagem Twilio (queued/sent/delivered/failed)
- Alertas de falha de entrega
- Validacoes de telefone mais rigidas no cadastro de cliente
- Pipeline CI com lint + testes

---

Se quiser, eu tambem posso gerar uma versao resumida deste README para usuario final (operacao da loja) e outra tecnica para devops.
