import { db, schema } from "@/db";
import { logAppError } from "@/lib/app-logger";
import { z } from "zod";

const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  product_name: z.string(),
  product_sku: z.string().nullable().optional(),
  product_image_url: z.string().nullable().optional(),
  product_internal_code: z.string().nullable().optional(),
  quantity: z.number().int().positive(),
  unit_price: z.number(),
  total_price: z.number(),
  selected_color_id: z.string().nullable().optional(),
  selected_color_name: z.string().nullable().optional(),
  selected_size_id: z.string().nullable().optional(),
  selected_size_label: z.string().nullable().optional(),
  selected_volume_id: z.string().nullable().optional(),
  selected_volume_label: z.string().nullable().optional(),
});

const createOrderSchema = z.object({
  customer_id: z.string().uuid(),
  total_amount: z.number(),
  customer_name: z.string().optional(),
  customer_phone_country_code: z.string().optional(),
  customer_phone_number: z.string().optional(),
  customer_address: z.string().nullable().optional(),
  items: z.array(orderItemSchema).min(1),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Dados inválidos.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { items, ...orderData } = parsed.data;

  try {
    const orderId = crypto.randomUUID();
    await db.insert(schema.orders).values({
      id: orderId,
      customer_id: orderData.customer_id,
      status: "pending",
      total_amount: orderData.total_amount,
      customer_name: orderData.customer_name ?? null,
      customer_phone_country_code: orderData.customer_phone_country_code ?? null,
      customer_phone_number: orderData.customer_phone_number ?? null,
      customer_address: orderData.customer_address ?? null,
    });

    await db.insert(schema.orderItems).values(
      items.map((item) => ({
        order_id: orderId,
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.product_sku ?? null,
        product_image_url: item.product_image_url ?? null,
        product_internal_code: item.product_internal_code ?? null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        selected_color_id: item.selected_color_id ?? null,
        selected_color_name: item.selected_color_name ?? null,
        selected_size_id: item.selected_size_id ?? null,
        selected_size_label: item.selected_size_label ?? null,
        selected_volume_id: item.selected_volume_id ?? null,
        selected_volume_label: item.selected_volume_label ?? null,
      }))
    );

    return Response.json({ id: orderId });
  } catch (e) {
    logAppError("api/orders.POST", e);
    return Response.json({ error: "Erro ao criar pedido." }, { status: 500 });
  }
}
