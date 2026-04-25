
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  image_url TEXT,
  category VARCHAR(100),
  brand VARCHAR(100),
  sku VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE product_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  color_name VARCHAR(50) NOT NULL,
  hex_code VARCHAR(7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE product_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  size_label VARCHAR(50) NOT NULL,
  size_unit VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE product_volumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  volume_value NUMERIC(10,3) NOT NULL,
  volume_unit VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Produtos de ferragem com imagens reais
INSERT INTO products (name, description, price, image_url, category, brand, sku, active) VALUES
('Parafuso Sextavado Inox M8', 'Parafuso sextavado em aço inoxidável 304, alta resistência à corrosão, ideal para ambientes externos e úmidos.', 0.85, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', 'Parafusos', 'Tramontina', 'PAR-M8-INOX', true),
('Tinta Esmalte Sintético', 'Tinta esmalte sintético brilhante de alta cobertura, resistente a intempéries, secagem rápida em 2 horas.', 42.90, 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600', 'Tintas', 'Suvinil', 'TINTA-ESM-001', true),
('Chave Combinada 13mm', 'Chave combinada em aço cromo-vanádio, acabamento polido, encaixe perfeito para porcas e parafusos padrão.', 18.50, 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600', 'Ferramentas', 'Gedore', 'CHV-COMB-13', true),
('Cano PVC Soldável 25mm', 'Cano PVC rígido soldável para instalações hidráulicas, pressão nominal 15kgf/cm², atende norma ABNT NBR 5648.', 12.30, 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600', 'Hidráulica', 'Tigre', 'CANO-PVC-25', true),
('Cadeado Aço 40mm', 'Cadeado em aço carbono com haste dupla proteção, resistente a corte e arrombamento, acompanha 3 chaves.', 35.00, 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600', 'Segurança', 'Papaiz', 'CAD-ACO-40', true),
('Fita Isolante 19mm x 20m', 'Fita isolante PVC autofusão, resistência dielétrica 600V, temperatura de operação -10°C a 80°C.', 8.90, 'https://images.unsplash.com/photo-1609205807107-2b688f6e3b4e?w=600', 'Elétrica', '3M', 'FITA-ISO-19', true),
('Martelo Carpinteiro 27mm', 'Martelo de carpinteiro com cabo em madeira de lei, cabeça em aço forjado 500g, extrator de pregos integrado.', 29.90, 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600', 'Ferramentas', 'Vonder', 'MART-CARP-27', true),
('Dobradiça Inox 3"', 'Dobradiça em aço inoxidável escovado, par com parafusos inclusos, suporta portas de até 40kg.', 14.50, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', 'Ferragens', 'Imab', 'DOB-INOX-3', true);

-- Cores dos produtos
INSERT INTO product_colors (product_id, color_name, hex_code)
SELECT id, 'Prata', '#C0C0C0' FROM products WHERE sku = 'PAR-M8-INOX';

INSERT INTO product_colors (product_id, color_name, hex_code)
SELECT id, 'Branco', '#FFFFFF' FROM products WHERE sku = 'TINTA-ESM-001'
UNION ALL
SELECT id, 'Preto', '#000000' FROM products WHERE sku = 'TINTA-ESM-001'
UNION ALL
SELECT id, 'Vermelho', '#FF0000' FROM products WHERE sku = 'TINTA-ESM-001'
UNION ALL
SELECT id, 'Azul', '#0000FF' FROM products WHERE sku = 'TINTA-ESM-001'
UNION ALL
SELECT id, 'Amarelo', '#FFD700' FROM products WHERE sku = 'TINTA-ESM-001';

INSERT INTO product_colors (product_id, color_name, hex_code)
SELECT id, 'Preto', '#1C1C1C' FROM products WHERE sku = 'FITA-ISO-19'
UNION ALL
SELECT id, 'Vermelho', '#CC0000' FROM products WHERE sku = 'FITA-ISO-19'
UNION ALL
SELECT id, 'Azul', '#003399' FROM products WHERE sku = 'FITA-ISO-19';

INSERT INTO product_colors (product_id, color_name, hex_code)
SELECT id, 'Inox Escovado', '#A8A9AD' FROM products WHERE sku = 'DOB-INOX-3';

-- Tamanhos dos produtos
INSERT INTO product_sizes (product_id, size_label, size_unit)
SELECT id, 'M6', 'mm' FROM products WHERE sku = 'PAR-M8-INOX'
UNION ALL
SELECT id, 'M8', 'mm' FROM products WHERE sku = 'PAR-M8-INOX'
UNION ALL
SELECT id, 'M10', 'mm' FROM products WHERE sku = 'PAR-M8-INOX'
UNION ALL
SELECT id, 'M12', 'mm' FROM products WHERE sku = 'PAR-M8-INOX';

INSERT INTO product_sizes (product_id, size_label, size_unit)
SELECT id, '20mm', 'mm' FROM products WHERE sku = 'CANO-PVC-25'
UNION ALL
SELECT id, '25mm', 'mm' FROM products WHERE sku = 'CANO-PVC-25'
UNION ALL
SELECT id, '32mm', 'mm' FROM products WHERE sku = 'CANO-PVC-25'
UNION ALL
SELECT id, '40mm', 'mm' FROM products WHERE sku = 'CANO-PVC-25'
UNION ALL
SELECT id, '50mm', 'mm' FROM products WHERE sku = 'CANO-PVC-25';

INSERT INTO product_sizes (product_id, size_label, size_unit)
SELECT id, '2"', 'pol' FROM products WHERE sku = 'DOB-INOX-3'
UNION ALL
SELECT id, '3"', 'pol' FROM products WHERE sku = 'DOB-INOX-3'
UNION ALL
SELECT id, '4"', 'pol' FROM products WHERE sku = 'DOB-INOX-3';

INSERT INTO product_sizes (product_id, size_label, size_unit)
SELECT id, '30mm', 'mm' FROM products WHERE sku = 'CAD-ACO-40'
UNION ALL
SELECT id, '40mm', 'mm' FROM products WHERE sku = 'CAD-ACO-40'
UNION ALL
SELECT id, '50mm', 'mm' FROM products WHERE sku = 'CAD-ACO-40';

-- Volumes dos produtos
INSERT INTO product_volumes (product_id, volume_value, volume_unit)
SELECT id, 0.9, 'L' FROM products WHERE sku = 'TINTA-ESM-001'
UNION ALL
SELECT id, 3.6, 'L' FROM products WHERE sku = 'TINTA-ESM-001'
UNION ALL
SELECT id, 18, 'L' FROM products WHERE sku = 'TINTA-ESM-001';

INSERT INTO product_volumes (product_id, volume_value, volume_unit)
SELECT id, 3, 'm' FROM products WHERE sku = 'CANO-PVC-25'
UNION ALL
SELECT id, 6, 'm' FROM products WHERE sku = 'CANO-PVC-25';

INSERT INTO product_volumes (product_id, volume_value, volume_unit)
SELECT id, 19, 'mm' FROM products WHERE sku = 'FITA-ISO-19'
UNION ALL
SELECT id, 25, 'mm' FROM products WHERE sku = 'FITA-ISO-19';

-- ============================================================
-- PHASE 1: FOUNDATION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================
-- PHASE 2: DDL (Auth Tables)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- ============================================================
-- PHASE 3: LOGIC (Role Check Function)
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_role(_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = _role
  );
$$;

-- ============================================================
-- PHASE 4: RLS POLICIES
-- ============================================================

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê próprio perfil" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuário atualiza próprio perfil" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gerencia roles" ON public.user_roles
FOR ALL USING (has_role('admin'));

CREATE POLICY "Usuário vê própria role" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

-- products: leitura pública, escrita apenas admin
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de produtos" ON public.products
FOR SELECT USING (true);

CREATE POLICY "Admin gerencia produtos" ON public.products
FOR ALL USING (has_role('admin'));

-- product_colors
ALTER TABLE public.product_colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de cores" ON public.product_colors
FOR SELECT USING (true);

CREATE POLICY "Admin gerencia cores" ON public.product_colors
FOR ALL USING (has_role('admin'));

-- product_sizes
ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de tamanhos" ON public.product_sizes
FOR SELECT USING (true);

CREATE POLICY "Admin gerencia tamanhos" ON public.product_sizes
FOR ALL USING (has_role('admin'));

-- product_volumes
ALTER TABLE public.product_volumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de volumes" ON public.product_volumes
FOR SELECT USING (true);

CREATE POLICY "Admin gerencia volumes" ON public.product_volumes
FOR ALL USING (has_role('admin'));

-- ============================================================
-- PHASE 5: TRIGGERS
-- ============================================================

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_product_colors_updated_at
    BEFORE UPDATE ON public.product_colors
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_product_sizes_updated_at
    BEFORE UPDATE ON public.product_sizes
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_product_volumes_updated_at
    BEFORE UPDATE ON public.product_volumes
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Sync novo usuário para profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Criar o usuário admin diretamente no auth.users do Supabase
-- Senha: admin123 (bcrypt hash)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@ferragem.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Administrador"}',
  false,
  'authenticated',
  'authenticated'
)
ON CONFLICT (email) DO NOTHING;

-- Sincronizar profile e role para o usuário recém-criado
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, 'Administrador'
FROM auth.users
WHERE email = 'admin@ferragem.com'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin@ferragem.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- ================================================
-- PHASE 2: TABLES
-- ================================================

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    phone_country_code VARCHAR(10) NOT NULL DEFAULT '+55',
    phone_number VARCHAR(30) NOT NULL,
    street VARCHAR(255),
    number VARCHAR(20),
    complement VARCHAR(100),
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Brasil',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT customers_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone_country_code, phone_number);

-- Tabela de itens do carrinho
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT cart_items_pkey PRIMARY KEY (id),
    CONSTRAINT cart_items_customer_product_unique UNIQUE (customer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_customer_id ON public.cart_items(customer_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);

-- ================================================
-- PHASE 4: RLS
-- ================================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Clientes: qualquer pessoa pode se cadastrar e ver seus próprios dados
CREATE POLICY "Inserção pública de clientes" ON public.customers FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Leitura pública de clientes" ON public.customers FOR SELECT
    USING (true);

CREATE POLICY "Atualização pública de clientes" ON public.customers FOR UPDATE
    USING (true);

-- Admin pode gerenciar todos os clientes
CREATE POLICY "Admin gerencia clientes" ON public.customers FOR ALL
    USING (has_role('admin'::text));

-- Carrinho: qualquer pessoa pode inserir, ver e atualizar itens
CREATE POLICY "Inserção pública no carrinho" ON public.cart_items FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Leitura pública do carrinho" ON public.cart_items FOR SELECT
    USING (true);

CREATE POLICY "Atualização pública do carrinho" ON public.cart_items FOR UPDATE
    USING (true);

CREATE POLICY "Remoção pública do carrinho" ON public.cart_items FOR DELETE
    USING (true);

-- Admin pode gerenciar todos os carrinhos
CREATE POLICY "Admin gerencia carrinho" ON public.cart_items FOR ALL
    USING (has_role('admin'::text));

-- ================================================
-- PHASE 5: TRIGGERS
-- ================================================

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
    BEFORE UPDATE ON public.cart_items
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ================================================
-- SEED DATA (clientes de exemplo)
-- ================================================

INSERT INTO public.customers (full_name, phone_country_code, phone_number, street, number, neighborhood, city, state, postal_code, country) VALUES
('João Silva', '+55', '11987654321', 'Rua das Flores', '123', 'Centro', 'São Paulo', 'SP', '01310-100', 'Brasil'),
('Maria Oliveira', '+55', '21976543210', 'Av. Atlântica', '456', 'Copacabana', 'Rio de Janeiro', 'RJ', '22070-010', 'Brasil'),
('Carlos Souza', '+55', '31965432109', 'Rua da Bahia', '789', 'Lourdes', 'Belo Horizonte', 'MG', '30160-010', 'Brasil'),
('Ana Lima', '+1', '3055551234', '123 Ocean Drive', 'Apt 5', 'Miami Beach', 'Miami', 'FL', '33139', 'Estados Unidos'),
('Pedro Santos', '+351', '912345678', 'Rua Augusta', '200', 'Chiado', 'Lisboa', 'Lisboa', '1200-051', 'Portugal');

-- =============================================
-- Phase 1: Foundation (já existente, sem alterações)
-- =============================================

-- =============================================
-- Phase 2: DDL - Tabela de Configurações da Empresa
-- =============================================

CREATE TABLE IF NOT EXISTS public.company_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    company_name VARCHAR,
    order_email VARCHAR,
    whatsapp_country_code VARCHAR NOT NULL DEFAULT '+55',
    whatsapp_number VARCHAR,
    email_notifications_enabled BOOLEAN DEFAULT true,
    whatsapp_notifications_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT company_settings_pkey PRIMARY KEY (id)
);

-- Garante que só exista um registro de configuração (singleton)
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_settings_singleton
    ON public.company_settings ((true));

-- =============================================
-- Phase 4: RLS - Segurança
-- =============================================

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gerencia configurações da empresa" ON public.company_settings
    FOR ALL
    USING (has_role('admin'::text));

CREATE POLICY "Leitura pública das configurações" ON public.company_settings
    FOR SELECT
    USING (true);

-- =============================================
-- Phase 5: Trigger de updated_at
-- =============================================

CREATE TRIGGER update_company_settings_updated_at
    BEFORE UPDATE ON public.company_settings
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================
-- Seed: Registro inicial de configurações
-- =============================================

INSERT INTO public.company_settings (
    company_name,
    order_email,
    whatsapp_country_code,
    whatsapp_number,
    email_notifications_enabled,
    whatsapp_notifications_enabled
) VALUES (
    'Ferragem',
    'pedidos@ferragem.com',
    '+55',
    '11999999999',
    true,
    true
);

-- ============================================================
-- PHASE 1: FOUNDATION
-- ============================================================

CREATE TYPE public.order_status AS ENUM (
    'pending',
    'confirmed',
    'processing',
    'completed',
    'cancelled'
);

-- ============================================================
-- PHASE 2: DDL - TABLES
-- ============================================================

-- Tabela de pedidos finalizados
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    status public.order_status NOT NULL DEFAULT 'pending',
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    notes TEXT,

    -- Flags de notificação
    email_sent BOOLEAN NOT NULL DEFAULT false,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    whatsapp_sent BOOLEAN NOT NULL DEFAULT false,
    whatsapp_sent_at TIMESTAMP WITH TIME ZONE,

    -- Snapshot dos dados do cliente no momento do pedido
    customer_name VARCHAR,
    customer_phone_country_code VARCHAR,
    customer_phone_number VARCHAR,
    customer_address TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT orders_pkey PRIMARY KEY (id),
    CONSTRAINT orders_total_amount_check CHECK (total_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders USING btree (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders USING btree (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_email_sent ON public.orders USING btree (email_sent) WHERE email_sent = false;
CREATE INDEX IF NOT EXISTS idx_orders_whatsapp_sent ON public.orders USING btree (whatsapp_sent) WHERE whatsapp_sent = false;


-- Tabela de itens do pedido finalizado
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    product_id UUID NOT NULL,

    -- Snapshot do produto no momento do pedido
    product_name VARCHAR NOT NULL,
    product_sku VARCHAR,
    product_image_url TEXT,

    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT order_items_pkey PRIMARY KEY (id),
    CONSTRAINT order_items_quantity_check CHECK (quantity > 0),
    CONSTRAINT order_items_unit_price_check CHECK (unit_price >= 0),
    CONSTRAINT order_items_total_price_check CHECK (total_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items USING btree (product_id);


-- ============================================================
-- PHASE 4: SECURITY - RLS
-- ============================================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Políticas para orders
CREATE POLICY "Admin gerencia pedidos" ON public.orders FOR ALL
    USING (has_role('admin'::text));

CREATE POLICY "Inserção pública de pedidos" ON public.orders FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Leitura pública de pedidos" ON public.orders FOR SELECT
    USING (true);

CREATE POLICY "Atualização pública de pedidos" ON public.orders FOR UPDATE
    USING (true);

-- Políticas para order_items
CREATE POLICY "Admin gerencia itens do pedido" ON public.order_items FOR ALL
    USING (has_role('admin'::text));

CREATE POLICY "Inserção pública de itens do pedido" ON public.order_items FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Leitura pública de itens do pedido" ON public.order_items FOR SELECT
    USING (true);


-- ============================================================
-- PHASE 5: TRIGGERS
-- ============================================================

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at
    BEFORE UPDATE ON public.order_items
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ================================================
-- Phase 1: Adicionar campos SMTP e Twilio na tabela company_settings
-- ================================================

-- Campos de configuração do servidor SMTP
ALTER TABLE public.company_settings
    ADD COLUMN IF NOT EXISTS smtp_host VARCHAR,
    ADD COLUMN IF NOT EXISTS smtp_port INTEGER DEFAULT 587,
    ADD COLUMN IF NOT EXISTS smtp_user VARCHAR,
    ADD COLUMN IF NOT EXISTS smtp_password VARCHAR,
    ADD COLUMN IF NOT EXISTS smtp_secure BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS smtp_from_name VARCHAR,
    ADD COLUMN IF NOT EXISTS smtp_from_email VARCHAR;

-- Campos de configuração da API Twilio WhatsApp
ALTER TABLE public.company_settings
    ADD COLUMN IF NOT EXISTS twilio_account_sid VARCHAR,
    ADD COLUMN IF NOT EXISTS twilio_auth_token VARCHAR,
    ADD COLUMN IF NOT EXISTS twilio_whatsapp_from VARCHAR;

-- ================================================
-- Comentários descritivos nos campos
-- ================================================

COMMENT ON COLUMN public.company_settings.smtp_host IS 'Endereço do servidor SMTP (ex: smtp.gmail.com)';
COMMENT ON COLUMN public.company_settings.smtp_port IS 'Porta do servidor SMTP (ex: 587 para TLS, 465 para SSL)';
COMMENT ON COLUMN public.company_settings.smtp_user IS 'Usuário de autenticação do servidor SMTP';
COMMENT ON COLUMN public.company_settings.smtp_password IS 'Senha ou App Password do servidor SMTP';
COMMENT ON COLUMN public.company_settings.smtp_secure IS 'Define se a conexão SMTP usa SSL/TLS (true = SSL, false = STARTTLS)';
COMMENT ON COLUMN public.company_settings.smtp_from_name IS 'Nome exibido como remetente nos e-mails enviados';
COMMENT ON COLUMN public.company_settings.smtp_from_email IS 'E-mail exibido como remetente nos e-mails enviados';
COMMENT ON COLUMN public.company_settings.twilio_account_sid IS 'Account SID da conta Twilio (encontrado no Twilio Console)';
COMMENT ON COLUMN public.company_settings.twilio_auth_token IS 'Auth Token da conta Twilio (encontrado no Twilio Console)';
COMMENT ON COLUMN public.company_settings.twilio_whatsapp_from IS 'Número Twilio WhatsApp no formato whatsapp:+14155238886';

-- ================================================
-- FASE 1: Atualizar cart_items
-- ================================================

-- Remover constraint única antiga
ALTER TABLE public.cart_items
    DROP CONSTRAINT IF EXISTS cart_items_customer_product_unique;

-- Adicionar colunas de atributos selecionados
ALTER TABLE public.cart_items
    ADD COLUMN IF NOT EXISTS selected_color_id UUID,
    ADD COLUMN IF NOT EXISTS selected_color_name VARCHAR,
    ADD COLUMN IF NOT EXISTS selected_size_id UUID,
    ADD COLUMN IF NOT EXISTS selected_size_label VARCHAR,
    ADD COLUMN IF NOT EXISTS selected_volume_id UUID,
    ADD COLUMN IF NOT EXISTS selected_volume_label VARCHAR;

-- Nova constraint única considerando os atributos selecionados
ALTER TABLE public.cart_items
    ADD CONSTRAINT cart_items_customer_product_attrs_unique
    UNIQUE (customer_id, product_id, selected_color_id, selected_size_id, selected_volume_id);

-- Índices para os atributos selecionados no carrinho
CREATE INDEX IF NOT EXISTS idx_cart_items_selected_color_id
    ON public.cart_items USING btree (selected_color_id)
    WHERE selected_color_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cart_items_selected_size_id
    ON public.cart_items USING btree (selected_size_id)
    WHERE selected_size_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cart_items_selected_volume_id
    ON public.cart_items USING btree (selected_volume_id)
    WHERE selected_volume_id IS NOT NULL;

-- Comentários explicativos
COMMENT ON COLUMN public.cart_items.selected_color_id IS 'ID da cor selecionada em product_colors (referência lógica)';
COMMENT ON COLUMN public.cart_items.selected_color_name IS 'Nome da cor selecionada (snapshot para exibição)';
COMMENT ON COLUMN public.cart_items.selected_size_id IS 'ID do tamanho selecionado em product_sizes (referência lógica)';
COMMENT ON COLUMN public.cart_items.selected_size_label IS 'Label do tamanho selecionado (snapshot para exibição)';
COMMENT ON COLUMN public.cart_items.selected_volume_id IS 'ID do volume selecionado em product_volumes (referência lógica)';
COMMENT ON COLUMN public.cart_items.selected_volume_label IS 'Label do volume selecionado (snapshot para exibição)';

-- ================================================
-- FASE 2: Atualizar order_items
-- ================================================

-- Adicionar colunas de atributos selecionados no histórico de pedidos
ALTER TABLE public.order_items
    ADD COLUMN IF NOT EXISTS selected_color_id UUID,
    ADD COLUMN IF NOT EXISTS selected_color_name VARCHAR,
    ADD COLUMN IF NOT EXISTS selected_size_id UUID,
    ADD COLUMN IF NOT EXISTS selected_size_label VARCHAR,
    ADD COLUMN IF NOT EXISTS selected_volume_id UUID,
    ADD COLUMN IF NOT EXISTS selected_volume_label VARCHAR;

-- Índices para os atributos em order_items
CREATE INDEX IF NOT EXISTS idx_order_items_selected_color_id
    ON public.order_items USING btree (selected_color_id)
    WHERE selected_color_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_selected_size_id
    ON public.order_items USING btree (selected_size_id)
    WHERE selected_size_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_selected_volume_id
    ON public.order_items USING btree (selected_volume_id)
    WHERE selected_volume_id IS NOT NULL;

-- Comentários explicativos
COMMENT ON COLUMN public.order_items.selected_color_id IS 'ID da cor selecionada no momento do pedido (referência lógica)';
COMMENT ON COLUMN public.order_items.selected_color_name IS 'Nome da cor no momento do pedido (snapshot imutável)';
COMMENT ON COLUMN public.order_items.selected_size_id IS 'ID do tamanho selecionado no momento do pedido (referência lógica)';
COMMENT ON COLUMN public.order_items.selected_size_label IS 'Label do tamanho no momento do pedido (snapshot imutável)';
COMMENT ON COLUMN public.order_items.selected_volume_id IS 'ID do volume selecionado no momento do pedido (referência lógica)';
COMMENT ON COLUMN public.order_items.selected_volume_label IS 'Label do volume no momento do pedido (snapshot imutável)';

-- ================================================
-- FASE 3: Índices adicionais em product_colors,
--         product_sizes e product_volumes
-- ================================================

CREATE INDEX IF NOT EXISTS idx_product_colors_product_id
    ON public.product_colors USING btree (product_id);

CREATE INDEX IF NOT EXISTS idx_product_sizes_product_id
    ON public.product_sizes USING btree (product_id);

CREATE INDEX IF NOT EXISTS idx_product_volumes_product_id
    ON public.product_volumes USING btree (product_id);

-- Adiciona o campo twilio_content_sid que estava faltando
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS twilio_content_sid VARCHAR;

COMMENT ON COLUMN public.company_settings.twilio_content_sid IS 'ContentSid do template de mensagem WhatsApp no Twilio (ex: HXb5b62575e6e4ff6129ad7c8efe1f983e)';

-- Salva as configurações do Twilio extraídas do cURL fornecido
-- Usa UPSERT para garantir que só existe um registro (singleton)
INSERT INTO public.company_settings (
    id,
    twilio_account_sid,
    twilio_auth_token,
    twilio_whatsapp_from,
    twilio_content_sid,
    whatsapp_notifications_enabled
)
VALUES (
    gen_random_uuid(),
    'AC89a6a95f92422800361bce388e5c8cc6',
    'a409a2a3047d68580ec61192aa570a84',
    'whatsapp:+14155238886',
    'HXb5b62575e6e4ff6129ad7c8efe1f983e',
    true
)
ON CONFLICT ((true))
DO UPDATE SET
    twilio_account_sid   = EXCLUDED.twilio_account_sid,
    twilio_auth_token    = EXCLUDED.twilio_auth_token,
    twilio_whatsapp_from = EXCLUDED.twilio_whatsapp_from,
    twilio_content_sid   = EXCLUDED.twilio_content_sid,
    whatsapp_notifications_enabled = true,
    updated_at           = now();

-- ================================================
-- PHASE 1: ENUM para status do log
-- ================================================
DO $$ BEGIN
    CREATE TYPE whatsapp_log_status AS ENUM ('success', 'error', 'pending');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ================================================
-- PHASE 2: TABELA DE LOG DE ENVIO WHATSAPP
-- ================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    order_id UUID,
    to_number VARCHAR NOT NULL,
    from_number VARCHAR,
    content_sid VARCHAR,
    content_variables JSONB,
    status whatsapp_log_status NOT NULL DEFAULT 'pending',
    twilio_message_sid VARCHAR,
    http_status_code INTEGER,
    error_code VARCHAR,
    error_message TEXT,
    response_body JSONB,
    request_payload JSONB,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT whatsapp_logs_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.whatsapp_logs IS 'Log de todas as tentativas de envio de mensagens WhatsApp via Twilio';
COMMENT ON COLUMN public.whatsapp_logs.order_id IS 'Referência lógica ao pedido (orders.id)';
COMMENT ON COLUMN public.whatsapp_logs.to_number IS 'Número de destino no formato whatsapp:+5511999999999';
COMMENT ON COLUMN public.whatsapp_logs.from_number IS 'Número Twilio remetente no formato whatsapp:+14155238886';
COMMENT ON COLUMN public.whatsapp_logs.content_sid IS 'ContentSid do template Twilio utilizado no envio';
COMMENT ON COLUMN public.whatsapp_logs.content_variables IS 'Variáveis do template enviadas (ex: {"1":"12/1","2":"3pm"})';
COMMENT ON COLUMN public.whatsapp_logs.status IS 'Status do envio: success, error ou pending';
COMMENT ON COLUMN public.whatsapp_logs.twilio_message_sid IS 'SID da mensagem retornado pela Twilio em caso de sucesso';
COMMENT ON COLUMN public.whatsapp_logs.http_status_code IS 'Código HTTP retornado pela API Twilio (ex: 200, 400, 401, 429)';
COMMENT ON COLUMN public.whatsapp_logs.error_code IS 'Código de erro Twilio (ex: 21211, 21608, 63016)';
COMMENT ON COLUMN public.whatsapp_logs.error_message IS 'Mensagem de erro completa retornada pela Twilio';
COMMENT ON COLUMN public.whatsapp_logs.response_body IS 'Corpo completo da resposta JSON da API Twilio';
COMMENT ON COLUMN public.whatsapp_logs.request_payload IS 'Payload completo enviado para a API Twilio';
COMMENT ON COLUMN public.whatsapp_logs.sent_at IS 'Timestamp exato do momento do envio';

-- Índices para consultas de diagnóstico
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_order_id
    ON public.whatsapp_logs USING btree (order_id)
    WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_status
    ON public.whatsapp_logs USING btree (status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created_at
    ON public.whatsapp_logs USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_http_status
    ON public.whatsapp_logs USING btree (http_status_code)
    WHERE http_status_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_error_code
    ON public.whatsapp_logs USING btree (error_code)
    WHERE error_code IS NOT NULL;

-- ================================================
-- PHASE 4: RLS
-- ================================================
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- Somente admin visualiza e gerencia os logs
CREATE POLICY "Admin gerencia logs de WhatsApp" ON public.whatsapp_logs
    FOR ALL
    USING (has_role('admin'::text));

-- Inserção pública para permitir que o backend/edge function registre os logs
CREATE POLICY "Inserção pública de logs WhatsApp" ON public.whatsapp_logs
    FOR INSERT
    WITH CHECK (true);

-- ================================================
-- PHASE 5: TRIGGER de updated_at
-- ================================================
CREATE TRIGGER update_whatsapp_logs_updated_at
    BEFORE UPDATE ON public.whatsapp_logs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
