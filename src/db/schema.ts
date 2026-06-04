import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  price: doublePrecision("price"),
  image_url: text("image_url"),
  category: text("category"),
  brand: text("brand"),
  sku: text("sku"),
  internal_code: text("internal_code"),
  active: boolean("active").default(true),
  created_at: text("created_at").$defaultFn(() => new Date().toISOString()),
  updated_at: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const productColors = pgTable("product_colors", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  product_id: text("product_id").notNull(),
  color_name: text("color_name").notNull(),
  hex_code: text("hex_code"),
  created_at: text("created_at").$defaultFn(() => new Date().toISOString()),
  updated_at: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const productSizes = pgTable("product_sizes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  product_id: text("product_id").notNull(),
  size_label: text("size_label").notNull(),
  size_unit: text("size_unit"),
  created_at: text("created_at").$defaultFn(() => new Date().toISOString()),
  updated_at: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const productVolumes = pgTable("product_volumes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  product_id: text("product_id").notNull(),
  volume_value: doublePrecision("volume_value").notNull(),
  volume_unit: text("volume_unit").notNull(),
  created_at: text("created_at").$defaultFn(() => new Date().toISOString()),
  updated_at: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const customers = pgTable("customers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  full_name: text("full_name").notNull(),
  phone_country_code: text("phone_country_code").notNull().default("+55"),
  phone_number: text("phone_number").notNull(),
  street: text("street"),
  number: text("number"),
  complement: text("complement"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  state: text("state"),
  postal_code: text("postal_code"),
  country: text("country").default("Brasil"),
  created_at: text("created_at").$defaultFn(() => new Date().toISOString()),
  updated_at: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const cartItems = pgTable("cart_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  customer_id: text("customer_id").notNull(),
  product_id: text("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unit_price: doublePrecision("unit_price").notNull(),
  selected_color_id: text("selected_color_id"),
  selected_color_name: text("selected_color_name"),
  selected_size_id: text("selected_size_id"),
  selected_size_label: text("selected_size_label"),
  selected_volume_id: text("selected_volume_id"),
  selected_volume_label: text("selected_volume_label"),
  product_internal_code: text("product_internal_code"),
  created_at: text("created_at").$defaultFn(() => new Date().toISOString()),
  updated_at: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export type OrderStatus = "pending" | "confirmed" | "processing" | "completed" | "cancelled";

export const orders = pgTable("orders", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  customer_id: text("customer_id").notNull(),
  status: text("status").$type<OrderStatus>().notNull().default("pending"),
  total_amount: doublePrecision("total_amount").notNull().default(0),
  notes: text("notes"),
  email_sent: boolean("email_sent").notNull().default(false),
  email_sent_at: text("email_sent_at"),
  whatsapp_sent: boolean("whatsapp_sent").notNull().default(false),
  whatsapp_sent_at: text("whatsapp_sent_at"),
  customer_name: text("customer_name"),
  customer_phone_country_code: text("customer_phone_country_code"),
  customer_phone_number: text("customer_phone_number"),
  customer_address: text("customer_address"),
  created_at: text("created_at").$defaultFn(() => new Date().toISOString()),
  updated_at: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const orderItems = pgTable("order_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  order_id: text("order_id").notNull(),
  product_id: text("product_id").notNull(),
  product_name: text("product_name").notNull(),
  product_sku: text("product_sku"),
  product_image_url: text("product_image_url"),
  selected_color_id: text("selected_color_id"),
  selected_color_name: text("selected_color_name"),
  selected_size_id: text("selected_size_id"),
  selected_size_label: text("selected_size_label"),
  selected_volume_id: text("selected_volume_id"),
  selected_volume_label: text("selected_volume_label"),
  product_internal_code: text("product_internal_code"),
  quantity: integer("quantity").notNull().default(1),
  unit_price: doublePrecision("unit_price").notNull(),
  total_price: doublePrecision("total_price").notNull(),
  created_at: text("created_at").$defaultFn(() => new Date().toISOString()),
  updated_at: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const companySettings = pgTable("company_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  company_name: text("company_name"),
  order_email: text("order_email"),
  whatsapp_country_code: text("whatsapp_country_code").notNull().default("+55"),
  whatsapp_number: text("whatsapp_number"),
  email_notifications_enabled: boolean("email_notifications_enabled").default(true),
  whatsapp_notifications_enabled: boolean("whatsapp_notifications_enabled").default(true),
  show_prices: boolean("show_prices").notNull().default(true),
  smtp_host: text("smtp_host"),
  smtp_port: integer("smtp_port").default(587),
  smtp_user: text("smtp_user"),
  smtp_password: text("smtp_password"),
  smtp_secure: boolean("smtp_secure").default(false),
  smtp_from_name: text("smtp_from_name"),
  smtp_from_email: text("smtp_from_email"),
  twilio_account_sid: text("twilio_account_sid"),
  twilio_auth_token: text("twilio_auth_token"),
  twilio_whatsapp_from: text("twilio_whatsapp_from"),
  twilio_content_sid: text("twilio_content_sid"),
  created_at: text("created_at").$defaultFn(() => new Date().toISOString()),
  updated_at: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export type WhatsAppLogStatus = "success" | "error" | "pending";

export const whatsappLogs = pgTable("whatsapp_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  order_id: text("order_id"),
  to_number: text("to_number").notNull(),
  from_number: text("from_number"),
  content_sid: text("content_sid"),
  content_variables: jsonb("content_variables"),
  status: text("status").$type<WhatsAppLogStatus>().notNull().default("pending"),
  twilio_message_sid: text("twilio_message_sid"),
  http_status_code: integer("http_status_code"),
  error_code: text("error_code"),
  error_message: text("error_message"),
  response_body: jsonb("response_body"),
  request_payload: jsonb("request_payload"),
  sent_at: text("sent_at"),
  created_at: text("created_at").$defaultFn(() => new Date().toISOString()),
  updated_at: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const adminUsers = pgTable("admin_users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull(),
  password_hash: text("password_hash").notNull(),
  full_name: text("full_name"),
  email_confirmed_at: text("email_confirmed_at").$defaultFn(() => new Date().toISOString()),
  created_at: text("created_at").$defaultFn(() => new Date().toISOString()),
  updated_at: text("updated_at").$defaultFn(() => new Date().toISOString()),
}, (t) => [
  uniqueIndex("admin_users_email_idx").on(t.email),
]);
