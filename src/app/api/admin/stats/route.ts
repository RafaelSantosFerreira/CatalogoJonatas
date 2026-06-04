import { db, schema } from "@/db";
import { getAdminUserIdFromRequest } from "@/lib/verify-admin-request";
import { logAppError } from "@/lib/app-logger";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const adminId = await getAdminUserIdFromRequest(request);
  if (!adminId) {
    return Response.json({ error: "Não autorizado." }, { status: 403 });
  }

  try {
    const [orders, orderItems] = await Promise.all([
      db.select({
        id: schema.orders.id,
        status: schema.orders.status,
        total_amount: schema.orders.total_amount,
        created_at: schema.orders.created_at,
      }).from(schema.orders).orderBy(desc(schema.orders.created_at)),
      db.select({
        product_name: schema.orderItems.product_name,
        quantity: schema.orderItems.quantity,
      }).from(schema.orderItems),
    ]);

    return Response.json({ orders, orderItems });
  } catch (e) {
    logAppError("api/admin/stats.GET", e);
    return Response.json({ error: "Erro ao carregar estatísticas." }, { status: 500 });
  }
}
