CREATE TABLE `admin_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`full_name` text,
	`email_confirmed_at` text,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_email_idx` ON `admin_users` (`email`);--> statement-breakpoint
CREATE TABLE `cart_items` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_price` real NOT NULL,
	`selected_color_id` text,
	`selected_color_name` text,
	`selected_size_id` text,
	`selected_size_label` text,
	`selected_volume_id` text,
	`selected_volume_label` text,
	`product_internal_code` text,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `company_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`company_name` text,
	`order_email` text,
	`whatsapp_country_code` text DEFAULT '+55' NOT NULL,
	`whatsapp_number` text,
	`email_notifications_enabled` integer DEFAULT true,
	`whatsapp_notifications_enabled` integer DEFAULT true,
	`show_prices` integer DEFAULT true NOT NULL,
	`smtp_host` text,
	`smtp_port` integer DEFAULT 587,
	`smtp_user` text,
	`smtp_password` text,
	`smtp_secure` integer DEFAULT false,
	`smtp_from_name` text,
	`smtp_from_email` text,
	`twilio_account_sid` text,
	`twilio_auth_token` text,
	`twilio_whatsapp_from` text,
	`twilio_content_sid` text,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`phone_country_code` text DEFAULT '+55' NOT NULL,
	`phone_number` text NOT NULL,
	`street` text,
	`number` text,
	`complement` text,
	`neighborhood` text,
	`city` text,
	`state` text,
	`postal_code` text,
	`country` text DEFAULT 'Brasil',
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`product_name` text NOT NULL,
	`product_sku` text,
	`product_image_url` text,
	`selected_color_id` text,
	`selected_color_name` text,
	`selected_size_id` text,
	`selected_size_label` text,
	`selected_volume_id` text,
	`selected_volume_label` text,
	`product_internal_code` text,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_price` real NOT NULL,
	`total_price` real NOT NULL,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`total_amount` real DEFAULT 0 NOT NULL,
	`notes` text,
	`email_sent` integer DEFAULT false NOT NULL,
	`email_sent_at` text,
	`whatsapp_sent` integer DEFAULT false NOT NULL,
	`whatsapp_sent_at` text,
	`customer_name` text,
	`customer_phone_country_code` text,
	`customer_phone_number` text,
	`customer_address` text,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `product_colors` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`color_name` text NOT NULL,
	`hex_code` text,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `product_sizes` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`size_label` text NOT NULL,
	`size_unit` text,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `product_volumes` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`volume_value` real NOT NULL,
	`volume_unit` text NOT NULL,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` real,
	`image_url` text,
	`category` text,
	`brand` text,
	`sku` text,
	`internal_code` text,
	`active` integer DEFAULT true,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `whatsapp_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text,
	`to_number` text NOT NULL,
	`from_number` text,
	`content_sid` text,
	`content_variables` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`twilio_message_sid` text,
	`http_status_code` integer,
	`error_code` text,
	`error_message` text,
	`response_body` text,
	`request_payload` text,
	`sent_at` text,
	`created_at` text,
	`updated_at` text
);
