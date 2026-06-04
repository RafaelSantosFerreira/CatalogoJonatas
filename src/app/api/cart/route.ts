import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { logAppError } from "@/lib/app-logger";
import { z } from "zod";

const addItemSchema = z.object({
  customer_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
  unit_price: z.number(),
  selected_color_id: z.string().uuid().nullable().optional(),
  selected_color_name: z.string().nullable().optional(),
  selected_size_id: z.string().uuid().nullable().optional(),
  selected_size_label: z.string().nullable().optional(),
  selected_volume_id: z.string().uuid().nullable().optional(),
  selected_volume_label: z.string().nullable().optional(),
  product_internal_code: z.string().nullable().optional(),
});

const updateItemSchema = z.object({
  id: z.string().uuid(),
  quantity: z.number().int().nonnegative(),
});

const deleteItemSchema = z.object({
  id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customer_id");
  if (!customerId) {
    return Response.json({ error: "customer_id obrigatório." }, { status: 400 });
  }
  try {
    const items = await db
      .select()
      .from(schema.cartItems)
      .where(eq(schema.cartItems.customer_id, customerId));

    const enriched = await Promise.all(
      items.map(async (item) => {
        const product = await db
          .select()
          .from(schema.products)
          .where(eq(schema.products.id, item.product_id))
          .get();
        return { ...item, product: product ?? undefined };
      })
    );
    return Response.json({ data: enriched });
  } catch (e) {
    logAppError("api/cart.GET", e);
    return Response.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = addItemSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Payload inválido." }, { status: 400 });
  }
  const data = parsed.data;

  try {
    const colorId = data.selected_color_id ?? null;
    const sizeId = data.selected_size_id ?? null;
    const volumeId = data.selected_volume_id ?? null;

    const existing = await db
      .select()
      .from(schema.cartItems)
      .where(
        and(
          eq(schema.cartItems.customer_id, data.customer_id),
          eq(schema.cartItems.product_id, data.product_id)
        )
      )
      .get();

    if (existing &&
      (existing.selected_color_id ?? null) === colorId &&
      (existing.selected_size_id ?? null) === sizeId &&
      (existing.selected_volume_id ?? null) === volumeId) {
      const updated = await db
        .update(schema.cartItems)
        .set({
          quantity: existing.quantity + 1,
          updated_at: new Date().toISOString(),
          product_internal_code: data.product_internal_code ?? null,
        })
        .where(eq(schema.cartItems.id, existing.id))
        .returning();
      return Response.json({ data: updated[0] });
    }

    const inserted = await db
      .insert(schema.cartItems)
      .values({
        customer_id: data.customer_id,
        product_id: data.product_id,
        quantity: data.quantity,
        unit_price: data.unit_price,
        selected_color_id: colorId,
        selected_color_name: data.selected_color_name ?? null,
        selected_size_id: sizeId,
        selected_size_label: data.selected_size_label ?? null,
        selected_volume_id: volumeId,
        selected_volume_label: data.selected_volume_label ?? null,
        product_internal_code: data.product_internal_code ?? null,
      })
      .returning();
    return Response.json({ data: inserted[0] });
  } catch (e) {
    logAppError("api/cart.POST", e);
    return Response.json({ error: "Erro ao adicionar item." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Payload inválido." }, { status: 400 });
  }

  try {
    if (parsed.data.quantity <= 0) {
      await db.delete(schema.cartItems).where(eq(schema.cartItems.id, parsed.data.id));
      return Response.json({ data: null });
    }
    const updated = await db
      .update(schema.cartItems)
      .set({ quantity: parsed.data.quantity, updated_at: new Date().toISOString() })
      .where(eq(schema.cartItems.id, parsed.data.id))
      .returning();
    return Response.json({ data: updated[0] });
  } catch (e) {
    logAppError("api/cart.PATCH", e);
    return Response.json({ error: "Erro ao atualizar item." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = deleteItemSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Payload inválido." }, { status: 400 });
  }

  try {
    if (parsed.data.id) {
      await db.delete(schema.cartItems).where(eq(schema.cartItems.id, parsed.data.id));
    } else if (parsed.data.customer_id) {
      await db.delete(schema.cartItems).where(eq(schema.cartItems.customer_id, parsed.data.customer_id));
    }
    return new Response(null, { status: 204 });
  } catch (e) {
    logAppError("api/cart.DELETE", e);
    return Response.json({ error: "Erro ao remover item." }, { status: 500 });
  }
}
