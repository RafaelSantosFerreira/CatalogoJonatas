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
        customer_name: schema.orders.customer_name,
        customer_phone_country_code: schema.orders.customer_phone_country_code,
        customer_phone_number: schema.orders.customer_phone_number,
        status: schema.orders.status,
        total_amount: schema.orders.total_amount,
        created_at: schema.orders.created_at,
      }).from(schema.orders).orderBy(desc(schema.orders.created_at)),
      db.select({
        order_id: schema.orderItems.order_id,
        product_name: schema.orderItems.product_name,
        quantity: schema.orderItems.quantity,
        unit_price: schema.orderItems.unit_price,
        total_price: schema.orderItems.total_price,
      }).from(schema.orderItems),
    ]);

    const itemsByOrder = orderItems.reduce<Record<string, typeof orderItems>>((acc, item) => {
      if (!acc[item.order_id]) acc[item.order_id] = [];
      acc[item.order_id].push(item);
      return acc;
    }, {});

    const result = orders.map((order) => ({
      ...order,
      items: itemsByOrder[order.id] ?? [],
    }));

    return Response.json({ orders: result });
  } catch (e) {
    logAppError("api/admin/orders.GET", e);
    return Response.json({ error: "Erro ao carregar pedidos." }, { status: 500 });
  }
}
