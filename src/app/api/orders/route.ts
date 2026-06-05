import { db, schema } from "@/db";
import { logAppError } from "@/lib/app-logger";
import { z } from "zod";
import { inArray } from "drizzle-orm";
import { dispatchWhatsApp } from "@/lib/whatsapp-dispatch";

const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  product_name: z.string(),
  product_sku: z.string().nullable().optional(),
  product_image_url: z.string().nullable().optional(),
  product_internal_code: z.string().nullable().optional(),
  quantity: z.number().int().positive(),
  unit_price: z.number().optional(),
  total_price: z.number().optional(),
  selected_color_id: z.string().nullable().optional(),
  selected_color_name: z.string().nullable().optional(),
  selected_size_id: z.string().nullable().optional(),
  selected_size_label: z.string().nullable().optional(),
  selected_volume_id: z.string().nullable().optional(),
  selected_volume_label: z.string().nullable().optional(),
});

const createOrderSchema = z.object({
  customer_id: z.string().uuid(),
  total_amount: z.number().optional(),
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

  // Busca preços atuais do banco — valores vindos do frontend são ignorados
  const productIds = [...new Set(items.map((i) => i.product_id))];
  const dbProducts = await db
    .select({ id: schema.products.id, price: schema.products.price })
    .from(schema.products)
    .where(inArray(schema.products.id, productIds));

  const priceMap = new Map(dbProducts.map((p) => [p.id, p.price]));

  for (const item of items) {
    const price = priceMap.get(item.product_id);
    if (price == null) {
      return Response.json(
        { error: `Produto ${item.product_id} não encontrado ou sem preço cadastrado.` },
        { status: 400 }
      );
    }
  }

  const calculatedItems = items.map((item) => {
    const unit_price = priceMap.get(item.product_id)!;
    const total_price = Math.round(unit_price * item.quantity * 100) / 100;
    return { ...item, unit_price, total_price };
  });

  const total_amount =
    Math.round(calculatedItems.reduce((sum, i) => sum + i.total_price, 0) * 100) / 100;

  try {
    const orderId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(schema.orders).values({
        id: orderId,
        customer_id: orderData.customer_id,
        status: "pending",
        total_amount,
        customer_name: orderData.customer_name ?? null,
        customer_phone_country_code: orderData.customer_phone_country_code ?? null,
        customer_phone_number: orderData.customer_phone_number ?? null,
        customer_address: orderData.customer_address ?? null,
      });

      await tx.insert(schema.orderItems).values(
        calculatedItems.map((item) => ({
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
    });

    // Disparo fire-and-forget — não bloqueia a resposta ao cliente
    dispatchWhatsApp({
      orderId,
      useCompanyTarget: true,
    }).catch((e) => logAppError("api/orders.whatsapp", e, { orderId }));

    return Response.json({ id: orderId });
  } catch (e) {
    logAppError("api/orders.POST", e);
    return Response.json({ error: "Erro ao criar pedido." }, { status: 500 });
  }
}
