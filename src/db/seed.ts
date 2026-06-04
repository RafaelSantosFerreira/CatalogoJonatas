import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import bcrypt from "bcryptjs";
import path from "path";
import * as schema from "./schema";

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), "data", "catalog.db");

async function seed() {
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });

  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

  // Limpar tabelas dependentes antes
  db.delete(schema.productColors).run();
  db.delete(schema.productSizes).run();
  db.delete(schema.productVolumes).run();
  db.delete(schema.products).run();
  db.delete(schema.companySettings).run();
  db.delete(schema.adminUsers).run();

  console.log("Inserindo produtos...");

  const productsList = [
    // Fixação
    {
      id: crypto.randomUUID(),
      name: "Parafuso M6 Inox",
      description: "Parafuso sextavado inoxidável M6, resistente à corrosão.",
      price: 0.85,
      image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop",
      category: "Fixação",
      brand: "Fixabolt",
      sku: "PAR-M6-INOX",
      internal_code: "FIX-001",
      active: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Parafuso M8 Inox",
      description: "Parafuso sextavado inoxidável M8, alta resistência.",
      price: 1.20,
      image_url: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&q=80&fit=crop",
      category: "Fixação",
      brand: "Fixabolt",
      sku: "PAR-M8-INOX",
      internal_code: "FIX-002",
      active: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Prego 20x42",
      description: "Prego de aço polido 20x42 mm, ideal para madeira.",
      price: 12.90,
      image_url: "https://images.unsplash.com/photo-1616400619175-5beda3a17896?w=600&q=80&fit=crop",
      category: "Fixação",
      brand: "Gerdau",
      sku: "PRG-20X42",
      internal_code: "FIX-003",
      active: true,
    },
    // Pintura
    {
      id: crypto.randomUUID(),
      name: "Tinta Esmalte Sintético",
      description: "Tinta esmalte sintético acetinado de alta durabilidade para madeira e metal.",
      price: 59.90,
      image_url: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&q=80&fit=crop",
      category: "Pintura",
      brand: "Coral",
      sku: "TINTA-ESM-001",
      internal_code: "PIN-001",
      active: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Selador Acrílico",
      description: "Selador acrílico para preparação de superfícies antes da pintura.",
      price: 38.50,
      image_url: "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600&q=80&fit=crop",
      category: "Pintura",
      brand: "Suvinil",
      sku: "SEL-ACRIL-001",
      internal_code: "PIN-002",
      active: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Massa Corrida PVA",
      description: "Massa corrida PVA para acabamento interno em paredes.",
      price: 45.00,
      image_url: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&q=80&fit=crop",
      category: "Pintura",
      brand: "Hydronorth",
      sku: "MASSA-PVA-001",
      internal_code: "PIN-003",
      active: true,
    },
    // Ferramentas
    {
      id: crypto.randomUUID(),
      name: "Martelo Carpinteiro",
      description: "Martelo de carpinteiro com cabo de madeira, 27 mm.",
      price: 34.90,
      image_url: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80&fit=crop",
      category: "Ferramentas",
      brand: "Tramontina",
      sku: "MART-CARP-27",
      internal_code: "FER-001",
      active: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Chave Combinada 13mm",
      description: "Chave combinada (fixa + estrela) 13 mm em aço cromo-vanádio.",
      price: 18.90,
      image_url: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&q=80&fit=crop",
      category: "Ferramentas",
      brand: "Gedore",
      sku: "CHV-COMB-13",
      internal_code: "FER-002",
      active: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Alicate Universal 6\"",
      description: "Alicate universal 6 polegadas com cabo isolado até 1000V.",
      price: 29.90,
      image_url: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&q=80&fit=crop",
      category: "Ferramentas",
      brand: "Vonder",
      sku: "ALIC-UNIV-6",
      internal_code: "FER-003",
      active: true,
    },
    // Hidráulica
    {
      id: crypto.randomUUID(),
      name: "Cano PVC Soldável 25mm",
      description: "Cano PVC rígido soldável para instalações hidráulicas, DN 25 mm.",
      price: 8.90,
      image_url: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&q=80&fit=crop",
      category: "Hidráulica",
      brand: "Amanco",
      sku: "CANO-PVC-25",
      internal_code: "HID-001",
      active: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Joelho PVC 25mm 90°",
      description: "Joelho PVC soldável 90°, conexão para cano 25 mm.",
      price: 2.50,
      image_url: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80&fit=crop",
      category: "Hidráulica",
      brand: "Amanco",
      sku: "JOE-PVC-25-90",
      internal_code: "HID-002",
      active: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Cola PVC 175g",
      description: "Cola para PVC soldável, frasco 175g.",
      price: 14.50,
      image_url: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&q=80&fit=crop",
      category: "Hidráulica",
      brand: "Tigre",
      sku: "COLA-PVC-175",
      internal_code: "HID-003",
      active: true,
    },
    // Organização e acabamento
    {
      id: crypto.randomUUID(),
      name: "Dobradiça Inox 3\"",
      description: "Dobradiça em inox escovado 3 polegadas para portas e portões.",
      price: 12.90,
      image_url: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&q=80&fit=crop",
      category: "Acabamento",
      brand: "Imab",
      sku: "DOB-INOX-3",
      internal_code: "ACB-001",
      active: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Fita Isolante 19mm",
      description: "Fita isolante antichama PVC 19mm x 20m, resistência a 70°C.",
      price: 6.90,
      image_url: "https://images.unsplash.com/photo-1548438294-1ad5d5f4f063?w=600&q=80&fit=crop",
      category: "Elétrica",
      brand: "3M",
      sku: "FITA-ISO-19",
      internal_code: "ELE-001",
      active: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Abraçadeira Nylon 4,8x200mm",
      description: "Abraçadeira de nylon branca 4,8x200mm, pacote com 100 unidades.",
      price: 22.00,
      image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop",
      category: "Organização",
      brand: "Hellermann",
      sku: "ABR-NY-200",
      internal_code: "ORG-001",
      active: true,
    },
  ];

  db.insert(schema.products).values(productsList).run();

  // Variações para parafuso M6
  const par6 = productsList[0];
  db.insert(schema.productSizes).values([
    { product_id: par6.id, size_label: "M6 x 20mm", size_unit: "mm" },
    { product_id: par6.id, size_label: "M6 x 30mm", size_unit: "mm" },
    { product_id: par6.id, size_label: "M6 x 40mm", size_unit: "mm" },
  ]).run();

  // Variações para parafuso M8
  const par8 = productsList[1];
  db.insert(schema.productSizes).values([
    { product_id: par8.id, size_label: "M8 x 25mm", size_unit: "mm" },
    { product_id: par8.id, size_label: "M8 x 40mm", size_unit: "mm" },
    { product_id: par8.id, size_label: "M8 x 60mm", size_unit: "mm" },
  ]).run();

  // Variações de cor para tinta esmalte
  const tinta = productsList[3];
  db.insert(schema.productColors).values([
    { product_id: tinta.id, color_name: "Branco", hex_code: "#FFFFFF" },
    { product_id: tinta.id, color_name: "Preto", hex_code: "#000000" },
    { product_id: tinta.id, color_name: "Cinza", hex_code: "#808080" },
    { product_id: tinta.id, color_name: "Vermelho", hex_code: "#CC0000" },
    { product_id: tinta.id, color_name: "Azul", hex_code: "#003399" },
  ]).run();
  db.insert(schema.productVolumes).values([
    { product_id: tinta.id, volume_value: 0.9, volume_unit: "L" },
    { product_id: tinta.id, volume_value: 3.6, volume_unit: "L" },
    { product_id: tinta.id, volume_value: 18, volume_unit: "L" },
  ]).run();

  // Variações de volume para selador
  const selador = productsList[4];
  db.insert(schema.productVolumes).values([
    { product_id: selador.id, volume_value: 3.6, volume_unit: "L" },
    { product_id: selador.id, volume_value: 18, volume_unit: "L" },
  ]).run();

  // Variações de volume para massa corrida
  const massa = productsList[5];
  db.insert(schema.productVolumes).values([
    { product_id: massa.id, volume_value: 18, volume_unit: "kg" },
    { product_id: massa.id, volume_value: 25, volume_unit: "kg" },
  ]).run();

  // Variações de tamanho para chave combinada
  const chave = productsList[7];
  db.insert(schema.productSizes).values([
    { product_id: chave.id, size_label: "10mm", size_unit: "mm" },
    { product_id: chave.id, size_label: "13mm", size_unit: "mm" },
    { product_id: chave.id, size_label: "17mm", size_unit: "mm" },
    { product_id: chave.id, size_label: "19mm", size_unit: "mm" },
  ]).run();

  // Cano PVC em diferentes comprimentos
  const cano = productsList[9];
  db.insert(schema.productSizes).values([
    { product_id: cano.id, size_label: "3m", size_unit: "m" },
    { product_id: cano.id, size_label: "6m", size_unit: "m" },
  ]).run();

  // Dobradiça em variações de cor
  const dobradica = productsList[12];
  db.insert(schema.productColors).values([
    { product_id: dobradica.id, color_name: "Inox Escovado", hex_code: "#C0C0C0" },
    { product_id: dobradica.id, color_name: "Preto Fosco", hex_code: "#1a1a1a" },
    { product_id: dobradica.id, color_name: "Dourado", hex_code: "#CFB53B" },
  ]).run();
  db.insert(schema.productSizes).values([
    { product_id: dobradica.id, size_label: "2,5\"", size_unit: "pol" },
    { product_id: dobradica.id, size_label: "3\"", size_unit: "pol" },
    { product_id: dobradica.id, size_label: "4\"", size_unit: "pol" },
  ]).run();

  // Admin user
  const adminEmail = process.env.SETUP_ADMIN_EMAIL ?? "admin@ferragem.com";
  const adminPassword = process.env.SETUP_ADMIN_PASSWORD ?? "admin123";
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  db.insert(schema.adminUsers).values({
    email: adminEmail,
    password_hash: passwordHash,
    full_name: "Administrador",
    email_confirmed_at: new Date().toISOString(),
  }).run();

  // Company settings
  db.insert(schema.companySettings).values({
    company_name: "Ferragem Pro",
    order_email: process.env.ORDER_EMAIL ?? "pedidos@ferragem.com",
    whatsapp_country_code: process.env.WHATSAPP_COUNTRY_CODE ?? "+55",
    whatsapp_number: process.env.WHATSAPP_NUMBER ?? "",
    email_notifications_enabled: true,
    whatsapp_notifications_enabled: true,
    show_prices: true,
    twilio_account_sid: process.env.TWILIO_ACCOUNT_SID ?? null,
    twilio_auth_token: process.env.TWILIO_AUTH_TOKEN ?? null,
    twilio_whatsapp_from: process.env.TWILIO_WHATSAPP_FROM ?? null,
    twilio_content_sid: process.env.TWILIO_CONTENT_SID ?? null,
  }).run();

  console.log(`✓ ${productsList.length} produtos inseridos`);
  console.log(`✓ Admin criado: ${adminEmail}`);
  console.log("✓ Company settings inseridos");
  sqlite.close();
}

seed().catch((err) => {
  console.error("Seed falhou:", err);
  process.exit(1);
});
