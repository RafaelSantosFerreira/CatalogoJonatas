import { db, schema } from "@/db";
import { getAdminUserIdFromRequest } from "@/lib/verify-admin-request";
import { logAppError, logAppInfo } from "@/lib/app-logger";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { isValidTransition } from "@/lib/order-status-transitions";
import type { OrderStatus } from "@/db/schema";

export const dynamic = "force-dynamic";

const updateStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "processing", "completed", "cancelled"]),
  reason: z.string().max(500).optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const adminId = await getAdminUserIdFromRequest(request);
  if (!adminId) {
    return Response.json({ error: "Não autorizado." }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return Response.json({ error: "ID ausente." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Status inválido.", details: parsed.error.flatten() }, { status: 400 });
  }

  const newStatus = parsed.data.status as OrderStatus;
  const reason = parsed.data.reason ?? null;

  try {
    const existing = (await db
      .select({ id: schema.orders.id, status: schema.orders.status })
      .from(schema.orders)
      .where(eq(schema.orders.id, id)))[0];

    if (!existing) {
      return Response.json({ error: "Pedido não encontrado." }, { status: 404 });
    }

    const oldStatus = existing.status as OrderStatus;

    if (!isValidTransition(oldStatus, newStatus)) {
      return Response.json(
        { error: `Transição de "${oldStatus}" para "${newStatus}" não é permitida.` },
        { status: 422 }
      );
    }

    await db.transaction(async (tx) => {
      await tx
        .update(schema.orders)
        .set({ status: newStatus, updated_at: new Date().toISOString() })
        .where(eq(schema.orders.id, id));

      await tx.insert(schema.orderStatusChanges).values({
        order_id: id,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: adminId,
        reason,
        changed_at: new Date().toISOString(),
      });
    });

    logAppInfo("api/admin/orders.PATCH", "Status atualizado", { adminId, orderId: id, oldStatus, newStatus });

    return Response.json({ id, status: newStatus });
  } catch (e) {
    logAppError("api/admin/orders.PATCH", e);
    return Response.json({ error: "Erro ao atualizar status." }, { status: 500 });
  }
}
