import { db, schema } from "@/db";
import { getAdminUserIdFromRequest } from "@/lib/verify-admin-request";
import { logAppError } from "@/lib/app-logger";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "processing", "completed", "cancelled"]),
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

  try {
    const result = await db
      .update(schema.orders)
      .set({
        status: parsed.data.status,
        updated_at: new Date().toISOString(),
      })
      .where(eq(schema.orders.id, id))
      .returning({ id: schema.orders.id, status: schema.orders.status });

    if (!result.length) {
      return Response.json({ error: "Pedido não encontrado." }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (e) {
    logAppError("api/admin/orders.PATCH", e);
    return Response.json({ error: "Erro ao atualizar status." }, { status: 500 });
  }
}
