# Documentação e análise do código-fonte — Site Ferragem Pro

Este documento descreve a arquitetura, os fluxos principais e os módulos do projeto localizado em `c:\Projetos\siteJonatas`. O site é um catálogo de produtos (“Ferragem Pro”) com carrinho, pedidos, notificações (WhatsApp/e-mail/Twilio) e painel administrativo.

---

## 1. Visão geral do produto

| Aspecto | Descrição |
|--------|------------|
| **Nome / tema** | Catálogo “Ferragem Pro” — produtos de ferragem com gestão e pedidos |
| **Idioma da UI** | Português (BR), metadados em `layout.tsx` com `lang="pt-BR"` |
| **Stack** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Supabase (`@supabase/supabase-js`), Radix UI, shadcn-style em `src/components/ui`, Framer Motion, Sonner (toasts) |
| **Gerenciador de pacotes** | PNPM (conforme `AGENTS.md` e `pnpm-lock.yaml`) |

O `package.json` ainda usa o nome genérico `nextjs-template`; o título público vem de `metadata` em `src/app/layout.tsx`.

---

## 2. Estrutura de diretórios (resumo)

```
siteJonatas/
├── src/
│   ├── app/                 # Rotas Next.js (App Router)
│   ├── components/          # Componentes da loja + admin + UI
│   ├── context/             # Auth, Carrinho, Cliente
│   ├── hooks/               # useCompanySettings, useZoerIframe, use-mobile, use-toast
│   ├── integrations/supabase/
│   ├── lib/                 # Utilitários e texto de pedido / WhatsApp
│   ├── store/               # useProductStore (produtos + CRUD)
│   ├── types/               # Tipos TS (produto, carrinho, cliente, empresa)
│   └── middleware.ts        # Headers para iframe / CSP
├── auth/                    # Scripts SQL de schema (Supabase/auth)
├── run/                     # Arquivos auxiliares de ambiente (não versionar segredos)
├── app.sql                  # Schema principal da aplicação (tabelas públicas)
├── AGENTS.md                # Instruções do template (Zoer / Supabase)
├── next.config.ts
├── package.json
└── tsconfig.json
```

A pasta `src/components/ui` contém dezenas de primitivos (Button, Dialog, Sheet, etc.) no padrão comum de projetos com Radix + Tailwind.

---

## 3. Rotas e páginas (`src/app`)

| Rota | Arquivo | Função |
|------|---------|--------|
| `/` | `page.tsx` | Home: `Suspense` + `CatalogPage` (catálogo público) |
| `/admin` | `admin/page.tsx` | Painel admin (`AdminPageClient`) |
| `/admin/login` | `admin/login/page.tsx` | Login do administrador |

Arquivos de suporte: `layout.tsx` (fontes Geist, providers, Toaster), `globals.css`, `error.tsx`, `global-error.tsx`.

---

## 4. API Routes (`src/app/api`)

| Método / caminho | Arquivo | Responsabilidade |
|------------------|---------|-------------------|
| `GET` `/api/health` | `api/health/route.ts` | Health check |
| `POST` `/api/setup` | `api/setup/route.ts` | Cria usuário admin inicial no Supabase Auth + linhas em `profiles` e `user_roles` (e-mail/senha fixos no código — ver seção 10) |
| `POST` `/api/seed-twilio` | `api/seed-twilio/route.ts` | Insere/atualiza `company_settings` com valores Twilio padrão (risco de segurança em produção — ver seção 10) |
| `POST` `/api/whatsapp` | `api/whatsapp/route.ts` | Envia mensagem WhatsApp via API Twilio (Content SID + variáveis), lê credenciais de `company_settings`, grava `whatsapp_logs`, opcionalmente atualiza `orders.whatsapp_sent` |
| `GET` `/api/whatsapp-logs` | `api/whatsapp-logs/route.ts` | Lista logs (query params `limit`, `status`), usa `supabaseAdmin` |
| `*` `/zoer_proxy/[...path]` | `zoer_proxy/[...path]/route.ts` | Proxy genérico para `https://api.zoer.ai` com headers `x-zoer-auth` / `Postgrest-API-Key` a partir de `POSTGREST_API_KEY` |

Integração Zoer adicional: dependência `@zoerai/integration` no `package.json` (uso pontual em hooks como `useZoerIframe`, se aplicável ao seu fluxo).

---

## 5. Banco de dados e `app.sql`

O arquivo `app.sql` define (entre outras) as tabelas centrais da aplicação:

- **`products`** — cadastro base de produtos  
- **`product_colors`**, **`product_sizes`**, **`product_volumes`** — atributos por produto  
- **`profiles`**, **`user_roles`** — perfil e papel (ex.: `admin`) ligados ao Auth  
- **`customers`** — clientes do catálogo (sem login obrigatório; identificação por registro + `localStorage`)  
- **`cart_items`** — itens do carrinho por `customer_id`  
- **`company_settings`** — dados da empresa, WhatsApp manual, flags de notificação, SMTP, Twilio  
- **`orders`**, **`order_items`** — pedidos finalizados e itens  
- **`whatsapp_logs`** — auditoria de envios Twilio  

A pasta `auth/` contém migrações SQL complementares (RLS, funções, conector, usuário admin em schema separado, etc.) para alinhar com Supabase.

**Tipos gerados do Supabase:** `src/integrations/supabase/types.ts` está com `Tables` vazio (`never`) — o projeto usa tipos manuais em `src/types/*` para entidades de negócio.

---

## 6. Camada Supabase

| Arquivo | Papel |
|---------|--------|
| `client.ts` | Cliente browser com `NEXT_PUBLIC_DATABASE_URL` e `NEXT_PUBLIC_DATABASE_PUBLISHABLE_KEY`; sessão em `localStorage` |
| `server.ts` | `supabaseAdmin` com `DATABASE_URL` e `DATABASE_SERVICE_ROLE_KEY` (operações server-side, sem RLS do cliente) |

Consultas de produto/carrinho/cliente/configurações usam o **client** no browser. Rotas sensíveis (`whatsapp`, `whatsapp-logs`, `setup`, `seed-twilio`) usam **admin** no servidor.

---

## 7. Contextos globais (`src/context`)

1. **`AuthContext`** — sessão Supabase (`getSession`, `onAuthStateChange`), `signIn` / `signOut`. Usado no admin e no `AdminGuard`.  
2. **`CustomerContext`** — cliente atual; persiste `ferragem_customer_id` no `localStorage`; `saveCustomer` insere em `customers`.  
3. **`CartContext`** — carrinho ligado ao `customer_id`; CRUD em `cart_items` com enriquecimento de `products`.

Ordem no `layout.tsx`: `ThemeProvider` → `AuthProvider` → `CustomerProvider` → `CartProvider` → filhos + `GlobalClientEffects`.

---

## 8. Estado e dados de produto

- **`useProductStore`** (`src/store/productStore.ts`): lista `products`, busca detalhes de cores/tamanhos/volumes, `createProduct` / `updateProduct` / `deleteProduct` com sincronização nas tabelas relacionadas.

Componentes principais da vitrine:

- **`CatalogPage`** — busca, grid, `ProductCard`, `ProductViewModal`  
- **`Header`** — navegação / tema / carrinho  
- **`CartDrawer`** — carrinho, cadastro rápido de cliente, finalização de pedido  
- **`ProductViewModal`** / **`ProductCard`** — visualização e adição ao carrinho com atributos opcionais  

Painel admin (pasta `src/components/admin/`):

- Abas/painéis: produtos, configurações da empresa, logs WhatsApp, etc.  
- **`AdminGuard`** — redireciona para `/admin/login` se não houver `user`.  
- Formulários: `LoginForm`, modais de produto (`ProductFormModal`, atributos), `CompanySettingsPanel`, `WhatsAppLogsPanel`.

---

## 9. Fluxo de pedido (resumo)

1. Usuário navega no catálogo; pode abrir detalhe e adicionar ao carrinho (com cor/tamanho/volume quando existirem).  
2. Carrinho exige **cliente** (`CustomerRegisterModal` se necessário).  
3. **`CartDrawer.handleFinalize`**:  
   - Insere linha em **`orders`** e linhas em **`order_items`**.  
   - Se `hasTwilioConfigured(settings)`, chama **`sendTwilioWhatsApp`** → `POST /api/whatsapp`.  
   - Monta URLs manuais `wa.me` e `mailto:` via `getWhatsAppUrl` / `getEmailUrl` (`src/lib/order-notification.ts`).  
   - Limpa carrinho e abre **`OrderConfirmationModal`**.  

`order-notification.ts` centraliza texto do pedido (`buildOrderText`), variáveis do template Twilio (`buildContentVariables`) e helpers de URL.

---

## 10. Configuração, build e segurança

### Variáveis de ambiente (esperadas)

- **Públicas:** `NEXT_PUBLIC_DATABASE_URL`, `NEXT_PUBLIC_DATABASE_PUBLISHABLE_KEY`  
- **Servidor:** `DATABASE_URL`, `DATABASE_SERVICE_ROLE_KEY`  
- **Proxy Zoer:** `POSTGREST_API_KEY` (usado em `zoer_proxy`)

Arquivo em `run/` pode conter overrides locais; **não commitar** segredos reais.

### `next.config.ts`

- `eslint.ignoreDuringBuilds` e `typescript.ignoreBuildErrors` estão **ativos** — builds podem passar com erros de tipo/lint; recomendável desativar em CI/produção quando o código estiver estável.  
- Headers globais: CORS permissivo (`Access-Control-Allow-Origin: *`), `X-Frame-Options: ALLOWALL`, CSP `frame-ancestors` ampla — adequado se o site for embutido em iframe; revisar para ambientes restritos.

### `middleware.ts`

Reforça headers de iframe/CSP para rotas que não são `api`, `_next`, etc.

### Alertas de segurança no código

1. **`/api/setup`** — e-mail e senha de admin **fixos** no fonte. Em produção, use provisionamento seguro (env + senha forte única) e desative ou proteja essa rota.  
2. **`/api/seed-twilio`** — contém **credenciais Twilio de exemplo** no repositório. Trate como **vazamento**: rotacione chaves na Twilio, remova valores reais do código e use apenas variáveis de ambiente ou painel admin preenchido manualmente.  
3. **`supabaseAdmin`** em rotas públicas — qualquer cliente que descubra a URL pode chamar `setup`/`seed-twilio` se não houver bloqueio na borda (WAF, autenticação ou remoção em produção).

---

## 11. UX e tema

- **`ThemeProvider`** (`next-themes`) com alternância claro/escuro (`ThemeToggle`).  
- **`Toaster`** (Sonner) no layout.  
- Animações com **Framer Motion** no catálogo.  
- Imagens remotas permitidas em `next.config.ts` (Pexels, Unsplash, CDNs Chat2DB, etc.).

---

## 12. Scripts NPM (`package.json`)

| Script | Comando |
|--------|---------|
| `dev` | `next dev --turbopack` |
| `dev:debug` | Node com `--inspect` + `next dev` |
| `build` | `next build` |
| `start` | `next start --port 3000` |
| `lint` | `next lint` |

---

## 13. Referência rápida de tipos (`src/types`)

- **`product.ts`** — `Product`, `ProductFormData`, cores/tamanhos/volumes  
- **`cart.ts`** — `CartItem`, atributos selecionados  
- **`customer.ts`** — cliente do fluxo de pedido  
- **`company-settings.ts`** — configuração da empresa + Twilio + SMTP  

---

## 14. Conclusão

O repositório é um **Next.js full-stack** focado em **catálogo B2C simples** com persistência em **Supabase**, **carrinho por cliente** (sem login de comprador), **pedidos** com opção de **notificação** por link WhatsApp/e-mail ou **Twilio** automatizado, e **área administrativa** autenticada por Supabase Auth.

Para evolução: endurecer rotas de setup/seed, alinhar `types.ts` do Supabase com o schema real, reativar checagens de TypeScript/ESLint no build e revisar CORS/CSP conforme o domínio de hospedagem e necessidade de iframe.

---

*Documento gerado a partir da análise do código-fonte do repositório. Atualize este arquivo quando a arquitetura ou as rotas mudarem.*
