CREATE TABLE "order_status_changes" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"old_status" text NOT NULL,
	"new_status" text NOT NULL,
	"changed_by" text NOT NULL,
	"reason" text,
	"changed_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "whatsapp_logs" ADD COLUMN "trace_id" text;--> statement-breakpoint
CREATE INDEX "order_status_changes_order_id_idx" ON "order_status_changes" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_status_changes_changed_by_idx" ON "order_status_changes" USING btree ("changed_by");--> statement-breakpoint
CREATE INDEX "cart_items_customer_id_idx" ON "cart_items" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_customer_id_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");