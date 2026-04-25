
# 📁 Estrutura do Projeto — Ferragem Pro

> Catálogo de produtos para ferragem com gestão completa, notificações via WhatsApp (Twilio) e e-mail (SMTP), painel administrativo e integração com Supabase.

---

## 🗂️ Visão Geral da Estrutura

```
ferragem-pro/
├── src/
│   ├── app/                        # Rotas e páginas (Next.js App Router)
│   │   ├── admin/                  # Área administrativa
│   │   │   ├── login/page.tsx      # Página de login do admin
│   │   │   └── page.tsx            # Página principal do admin
│   │   ├── api/                    # Rotas de API (server-side)
│   │   │   ├── health/route.ts     # Health check da aplicação
│   │   │   ├── seed-twilio/route.ts# Seed das credenciais Twilio
│   │   │   ├── setup/route.ts      # Setup do usuário admin inicial
│   │   │   ├── whatsapp/route.ts   # Envio de mensagens WhatsApp via Twilio
│   │   │   └── whatsapp-logs/route.ts # Listagem dos logs de WhatsApp
│   │   ├── zoer_proxy/             # Proxy interno (não modificar)
│   │   │   └── [...path]/route.ts  # Rota catch-all do proxy
│   │   ├── error.tsx               # Página de erro global
│   │   ├── global-error.tsx        # Erro global de layout
│   │   ├── globals.css             # Estilos globais + Tailwind CSS v4
│   │   ├── layout.tsx              # Layout raiz da aplicação
│   │   └── page.tsx                # Página inicial (catálogo público)
│   ├── components/                 # Componentes React reutilizáveis
│   │   ├── admin/                  # Componentes exclusivos do painel admin
│   │   │   ├── AdminDashboard.tsx  # Dashboard principal do admin
│   │   │   ├── AdminGuard.tsx      # Proteção de rota autenticada
│   │   │   ├── AdminHeader.tsx     # Cabeçalho do painel admin
│   │   │   ├── AdminPageClient.tsx # Client component da página admin
│   │   │   ├── AdminPanel.tsx      # Painel admin legado (versão anterior)
│   │   │   ├── AdminProductCard.tsx# Card de produto no painel admin
│   │   │   ├── AdminProductList.tsx# Lista de produtos no painel admin
│   │   │   ├── AdminProductsPanel.tsx # Painel de gestão de produtos
│   │   │   ├── AdminTabs.tsx       # Abas de navegação do painel admin
│   │   │   ├── CompanySettingsPanel.tsx # Painel de configurações da empresa
│   │   │   ├── LoginForm.tsx       # Formulário de login do admin
│   │   │   └── WhatsAppLogsPanel.tsx # Painel de logs de WhatsApp
│   │   ├── ui/                     # Componentes shadcn/ui (não modificar)
│   │   ├── CartDrawer.tsx          # Gaveta lateral do carrinho de compras
│   │   ├── CatalogPage.tsx         # Página principal do catálogo público
│   │   ├── ColorFields.tsx         # Campos de cores do produto no formulário
│   │   ├── CustomerRegisterModal.tsx # Modal de cadastro do cliente
│   │   ├── DeleteConfirmDialog.tsx # Diálogo de confirmação de exclusão
│   │   ├── Error.tsx               # Componente de exibição de erro
│   │   ├── GlobalClientEffects.tsx # Efeitos globais client-side (iframe, etc.)
│   │   ├── Header.tsx              # Cabeçalho do catálogo público
│   │   ├── OrderConfirmationModal.tsx # Modal de confirmação de pedido
│   │   ├── ProductAttributeModal.tsx  # Modal de seleção de atributos do produto
│   │   ├── ProductCard.tsx         # Card de produto no catálogo
│   │   ├── ProductFormModal.tsx    # Modal de criação/edição de produto
│   │   ├── ProductViewModal.tsx    # Modal de visualização de produto
│   │   ├── SizeFields.tsx          # Campos de tamanhos do produto no formulário
│   │   ├── ThemeProvider.tsx       # Provider de tema claro/escuro
│   │   ├── ThemeToggle.tsx         # Botão de alternância de tema
│   │   └── VolumeFields.tsx        # Campos de volumes do produto no formulário
│   ├── context/                    # Contextos React (estado global)
│   │   ├── AuthContext.tsx         # Contexto de autenticação (Supabase Auth)
│   │   ├── CartContext.tsx         # Contexto do carrinho de compras
│   │   └── CustomerContext.tsx     # Contexto do cliente logado
│   ├── data/                       # Dados estáticos
│   │   └── phone-countries.ts      # Lista de países e códigos de telefone
│   ├── hooks/                      # Custom hooks React
│   │   ├── use-mobile.tsx          # Hook para detectar dispositivo mobile
│   │   ├── use-toast.ts            # Hook de notificações toast
│   │   ├── useCompanySettings.ts   # Hook para buscar/salvar configurações da empresa
│   │   └── useZoerIframe.ts        # Hook para comunicação com iframe Zoer
│   ├── integrations/               # Integrações externas
│   │   └── supabase/
│   │       ├── client.ts           # Cliente Supabase (client-side, respeita RLS)
│   │       ├── server.ts           # Cliente Supabase Admin (server-side, bypassa RLS)
│   │       └── types.ts            # Tipos TypeScript das tabelas do Supabase
│   ├── lib/                        # Utilitários e helpers
│   │   ├── order-notification.ts   # Funções de notificação de pedidos (WhatsApp, e-mail, Twilio)
│   │   └── utils.ts                # Utilitário `cn()` para merge de classes Tailwind
│   ├── store/                      # Stores de estado
│   │   └── productStore.ts         # Store de produtos (CRUD via Supabase)
│   ├── types/                      # Definições de tipos TypeScript
│   │   ├── cart.ts                 # Tipos do carrinho (CartItem, SelectedAttributes)
│   │   ├── company-settings.ts     # Tipos das configurações da empresa
│   │   ├── customer.ts             # Tipos do cliente (Customer, CustomerFormData)
│   │   └── product.ts              # Tipos do produto (Product, ProductColor, etc.)
│   └── middleware.ts               # Middleware Next.js (headers CORS e iframe)
├── run/
│   └── .env.user                   # Variáveis de ambiente do usuário (não commitar)
├── .gitignore                      # Arquivos ignorados pelo Git
├── AGENTS.md                       # Instruções para agentes de IA
├── README.md                       # Documentação geral do projeto
├── components.json                 # Configuração do shadcn/ui
├── eslint.config.mjs               # Configuração do ESLint
├── next-env.d.ts                   # Tipos globais do Next.js (gerado automaticamente)
├── next.config.ts                  # Configuração do Next.js (CORS, imagens, etc.)
├── package.json                    # Dependências e scripts do projeto
├── postcss.config.mjs              # Configuração do PostCSS + Tailwind CSS v4
└── tsconfig.json                   # Configuração do TypeScript
```

---

## 📄 Descrição Detalhada dos Arquivos

### 🌐 Rotas e Páginas (`src/app/`)

| Arquivo | Descrição |
|---|---|
| `layout.tsx` | Layout raiz da aplicação. Configura fontes Geist, providers de tema, autenticação, cliente e carrinho, além do componente `Toaster` para notificações. |
| `page.tsx` | Página inicial pública. Renderiza o `CatalogPage` dentro de um `Suspense` com fallback de carregamento. |
| `globals.css` | Estilos globais da aplicação. Importa o Tailwind CSS v4 e define variáveis de tema (cores, bordas, etc.) para os modos claro e escuro. |
| `error.tsx` | Página de erro de rota. Exibida quando ocorre um erro em uma rota específica. |
| `global-error.tsx` | Página de erro global. Captura erros no layout raiz da aplicação. |
| `admin/page.tsx` | Página do painel administrativo. Renderiza o `AdminPageClient` (protegido por autenticação). |
| `admin/login/page.tsx` | Página de login do administrador. Renderiza o formulário `LoginForm`. |
| `zoer_proxy/[...path]/route.ts` | Rota de proxy interna do Zoer. **Não deve ser modificada.** |

---

### 🔌 Rotas de API (`src/app/api/`)

| Arquivo | Método | Descrição |
|---|---|---|
| `health/route.ts` | `GET` | Verifica se a aplicação está online. Retorna `{ status: 'ok' }`. |
| `setup/route.ts` | `POST` | Cria o usuário administrador padrão (`admin@ferragem.com` / `admin123`) no Supabase Auth, caso ainda não exista. |
| `seed-twilio/route.ts` | `POST` | Insere ou atualiza as credenciais Twilio padrão na tabela `company_settings`. Usado para configuração rápida. |
| `whatsapp/route.ts` | `POST` | Envia uma mensagem WhatsApp ao cliente via API Twilio usando um template `ContentSid`. Salva o resultado na tabela `whatsapp_logs`. |
| `whatsapp-logs/route.ts` | `GET` | Lista os registros da tabela `whatsapp_logs` com suporte a filtro por `status` e paginação por `limit`. |

---

### 🧩 Componentes do Painel Admin (`src/components/admin/`)

| Arquivo | Descrição |
|---|---|
| `AdminGuard.tsx` | HOC de proteção de rota. Redireciona para `/admin/login` se o usuário não estiver autenticado. |
| `AdminHeader.tsx` | Cabeçalho fixo do painel admin com logo, navegação por abas (Produtos / Configurações), e-mail do usuário, toggle de tema e botão de logout. |
| `AdminPageClient.tsx` | Componente client-side da página `/admin`. Gerencia o estado da aba ativa e renderiza `AdminProductsPanel` ou `CompanySettingsPanel`. |
| `AdminDashboard.tsx` | Versão alternativa do dashboard admin com busca e grid de produtos usando `AdminProductCard`. |
| `AdminPanel.tsx` | Versão legada do painel admin (mantida para compatibilidade). Inclui verificação de sessão própria. |
| `AdminTabs.tsx` | Componente de abas com três seções: Produtos, Configurações e Logs WhatsApp. |
| `AdminProductsPanel.tsx` | Painel de gestão de produtos. Exibe busca, contagem e grid de produtos com ações de criar, editar, visualizar e excluir. |
| `AdminProductList.tsx` | Lista de produtos reutilizável com busca e ações CRUD. Recebe `products` e `loading` como props. |
| `AdminProductCard.tsx` | Card de produto no painel admin com imagem, preço, categoria, cores e botões de ação (Ver, Editar, Excluir). |
| `LoginForm.tsx` | Formulário de login com e-mail e senha, toggle de visibilidade da senha e botão de setup do primeiro acesso. |
| `CompanySettingsPanel.tsx` | Formulário completo de configurações da empresa: dados gerais, e-mail de destino, servidor SMTP, número WhatsApp e credenciais Twilio. |
| `WhatsAppLogsPanel.tsx` | Painel de logs de envio WhatsApp. Exibe histórico de tentativas, estatísticas, diagnóstico de erros Twilio e painel de envio de teste. |

---

### 🧩 Componentes Públicos (`src/components/`)

| Arquivo | Descrição |
|---|---|
| `CatalogPage.tsx` | Página principal do catálogo público. Exibe produtos com busca, filtros e integração com carrinho. |
| `Header.tsx` | Cabeçalho do catálogo público com logo, nome da empresa, toggle de tema e ícone do carrinho. |
| `ProductCard.tsx` | Card de produto no catálogo público com imagem, preço, categoria e botão de adicionar ao carrinho. |
| `ProductFormModal.tsx` | Modal de criação e edição de produto. Inclui campos de nome, descrição, preço, imagem, categoria, marca, SKU, status e atributos (cores, tamanhos, volumes). |
| `ProductViewModal.tsx` | Modal de visualização detalhada de um produto com imagem, descrição, preço e atributos. |
| `ProductAttributeModal.tsx` | Modal para o cliente selecionar atributos do produto (cor, tamanho, volume) antes de adicionar ao carrinho. |
| `CartDrawer.tsx` | Gaveta lateral do carrinho. Exibe itens, quantidades, preços, total e botão de finalizar pedido. |
| `OrderConfirmationModal.tsx` | Modal de confirmação de pedido. Exibe resumo do pedido e dispara notificações via WhatsApp (Twilio) e e-mail. |
| `CustomerRegisterModal.tsx` | Modal de cadastro do cliente com nome completo e telefone (com seleção de código de país). |
| `DeleteConfirmDialog.tsx` | Diálogo de confirmação antes de excluir um produto. |
| `ColorFields.tsx` | Campos dinâmicos para adicionar/remover cores de um produto (nome e código hex). |
| `SizeFields.tsx` | Campos dinâmicos para adicionar/remover tamanhos de um produto (label e unidade). |
| `VolumeFields.tsx` | Campos dinâmicos para adicionar/remover volumes de um produto (valor e unidade). |
| `ThemeProvider.tsx` | Provider de tema usando `next-themes`. Suporta modo claro, escuro e sistema. |
| `ThemeToggle.tsx` | Botão de alternância entre tema claro e escuro usando ícones do `lucide-react`. |
| `GlobalClientEffects.tsx` | Componente client-side que inicializa efeitos globais, como o hook `useZoerIframe`. |
| `Error.tsx` | Componente genérico de exibição de mensagem de erro. |

---

### 🗃️ Contextos React (`src/context/`)

| Arquivo | Descrição |
|---|---|
| `AuthContext.tsx` | Gerencia o estado de autenticação do usuário admin via Supabase Auth. Expõe `user`, `session`, `loading`, `signIn` e `signOut`. |
| `CartContext.tsx` | Gerencia o carrinho de compras do cliente. Sincroniza com a tabela `cart_items` no Supabase. Expõe `items`, `itemCount`, `total`, `addItem`, `removeItem`, `updateQuantity` e `clearCart`. |
| `CustomerContext.tsx` | Gerencia o cliente atual. Persiste o ID do cliente no `localStorage` e sincroniza com a tabela `customers`. Expõe `customer`, `loading`, `saveCustomer` e `clearCustomer`. |

---

### 🪝 Custom Hooks (`src/hooks/`)

| Arquivo | Descrição |
|---|---|
| `useCompanySettings.ts` | Busca e salva as configurações da empresa na tabela `company_settings`. Expõe `settings`, `loading`, `saving`, `saveSettings` e `refetch`. |
| `useZoerIframe.ts` | Gerencia a comunicação bidirecional com o iframe do Zoer. Escuta mensagens de navegação (`back`, `forward`) e envia o estado de navegação atual para o pai. |
| `use-mobile.tsx` | Detecta se o dispositivo atual é mobile com base no breakpoint de 768px. |
| `use-toast.ts` | Implementação customizada do sistema de toast (notificações temporárias) baseada em reducer. |

---

### 🔗 Integrações (`src/integrations/supabase/`)

| Arquivo | Descrição |
|---|---|
| `client.ts` | Cria e exporta o cliente Supabase para uso no lado do cliente. Usa as variáveis `NEXT_PUBLIC_DATABASE_URL` e `NEXT_PUBLIC_DATABASE_PUBLISHABLE_KEY`. Respeita as políticas RLS. **Arquivo protegido — não modificar.** |
| `server.ts` | Cria e exporta o cliente Supabase Admin para uso no lado do servidor (API routes). Usa `DATABASE_URL` e `DATABASE_SERVICE_ROLE_KEY`. Bypassa as políticas RLS. **Arquivo protegido — não modificar.** |
| `types.ts` | Definições de tipos TypeScript geradas a partir do schema do Supabase. |

---

### 🛠️ Utilitários (`src/lib/`)

| Arquivo | Descrição |
|---|---|
| `utils.ts` | Exporta a função `cn()` que combina `clsx` e `tailwind-merge` para merge seguro de classes Tailwind CSS. |
| `order-notification.ts` | Funções para construir e enviar notificações de pedido. Inclui: `buildOrderText()` (texto formatado), `buildContentVariables()` (variáveis do template Twilio), `getWhatsAppUrl()` (link wa.me), `getEmailUrl()` (link mailto), `sendTwilioWhatsApp()` (envio via API `/api/whatsapp`) e `hasTwilioConfigured()` (verifica credenciais). |

---

### 🗄️ Store (`src/store/`)

| Arquivo | Descrição |
|---|---|
| `productStore.ts` | Hook customizado `useProductStore()` que gerencia o estado e as operações CRUD de produtos. Inclui busca de produtos com atributos (cores, tamanhos, volumes), criação, atualização e exclusão via Supabase. |

---

### 📐 Tipos TypeScript (`src/types/`)

| Arquivo | Descrição |
|---|---|
| `product.ts` | Define `Product`, `ProductColor`, `ProductSize`, `ProductVolume` e `ProductFormData`. |
| `cart.ts` | Define `CartItem` (item do carrinho com produto e atributos selecionados) e `SelectedAttributes`. |
| `customer.ts` | Define `Customer` (dados completos do cliente) e `CustomerFormData` (dados do formulário de cadastro). |
| `company-settings.ts` | Define `CompanySettings` (dados completos da tabela) e `CompanySettingsFormData` (dados do formulário de configurações). |

---

### 📊 Dados Estáticos (`src/data/`)

| Arquivo | Descrição |
|---|---|
| `phone-countries.ts` | Lista de 25 países com código de discagem internacional, nome e emoji de bandeira. Usado nos selects de código de país. |

---

### ⚙️ Configurações Raiz

| Arquivo | Descrição |
|---|---|
| `next.config.ts` | Configuração do Next.js. Define headers CORS, permissão de iframe (`X-Frame-Options: ALLOWALL`), domínios de imagens permitidos (Pexels, Unsplash, etc.) e ignora erros de ESLint/TypeScript no build. |
| `middleware.ts` | Middleware do Next.js. Adiciona headers `X-Frame-Options: ALLOWALL` e `Content-Security-Policy: frame-ancestors *` em todas as rotas não-API para permitir embedding via iframe. |
| `postcss.config.mjs` | Configuração do PostCSS com o plugin `@tailwindcss/postcss` para Tailwind CSS v4. **Não modificar.** |
| `components.json` | Configuração do shadcn/ui. Define o estilo, caminhos de componentes, aliases de importação e configurações do Tailwind. |
| `tsconfig.json` | Configuração do TypeScript com paths aliases (`@/*` → `./src/*`), target ES2017 e suporte a JSX. |
| `eslint.config.mjs` | Configuração do ESLint com regras do Next.js. |
| `next-env.d.ts` | Arquivo de tipos globais do Next.js. Gerado automaticamente — não modificar. |
| `package.json` | Lista de dependências, devDependencies e scripts do projeto (`dev`, `build`, `start`, `lint`). |
| `.gitignore` | Lista de arquivos e pastas ignorados pelo Git (node_modules, .next, .env, etc.). |
| `AGENTS.md` | Instruções e contexto para agentes de IA que trabalham neste projeto. |
| `README.md` | Documentação geral do projeto. |
| `run/.env.user` | Variáveis de ambiente do usuário para execução local. **Não commitar.** |

---

## 🗃️ Banco de Dados (Supabase)

| Tabela | Descrição |
|---|---|
| `products` | Produtos do catálogo (nome, descrição, preço, imagem, categoria, marca, SKU, status ativo). |
| `product_colors` | Cores disponíveis por produto (nome e código hex). |
| `product_sizes` | Tamanhos disponíveis por produto (label e unidade). |
| `product_volumes` | Volumes disponíveis por produto (valor numérico e unidade). |
| `customers` | Clientes cadastrados (nome, telefone com código de país, endereço completo). |
| `cart_items` | Itens do carrinho de cada cliente com atributos selecionados (cor, tamanho, volume). |
| `orders` | Pedidos finalizados com snapshot dos dados do cliente e status de notificação. |
| `order_items` | Itens de cada pedido com snapshot imutável do produto e atributos no momento da compra. |
| `company_settings` | Configurações da empresa: dados gerais, SMTP, WhatsApp e credenciais Twilio. Tabela singleton (apenas 1 registro). |
| `whatsapp_logs` | Log completo de todas as tentativas de envio de mensagens WhatsApp via Twilio (status, erros, payload, resposta). |
| `profiles` | Perfis dos usuários autenticados (sincronizado com Supabase Auth). |
| `user_roles` | Papéis dos usuários (atualmente apenas `admin`). |

---

## 🔑 Variáveis de Ambiente

| Variável | Uso | Lado |
|---|---|---|
| `NEXT_PUBLIC_DATABASE_URL` | URL do projeto Supabase | Client |
| `NEXT_PUBLIC_DATABASE_PUBLISHABLE_KEY` | Chave anon/public do Supabase | Client |
| `DATABASE_URL` | URL do projeto Supabase | Server |
| `DATABASE_SERVICE_ROLE_KEY` | Chave service_role do Supabase (admin) | Server |

---

## 🚀 Scripts Disponíveis

```bash
pnpm dev          # Inicia o servidor de desenvolvimento com Turbopack
pnpm build        # Gera o build de produção
pnpm start        # Inicia o servidor de produção na porta 3000
pnpm lint         # Executa o ESLint
```
