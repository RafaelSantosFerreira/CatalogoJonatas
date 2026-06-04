import { db, schema } from "@/db";
import { getAdminUserIdFromRequest } from "@/lib/verify-admin-request";
import { logAppError } from "@/lib/app-logger";

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
        total_amount: schema.orders.total_amount,
      }).from(schema.orders),
      db.select({
        id: schema.orderItems.id,
        order_id: schema.orderItems.order_id,
        unit_price: schema.orderItems.unit_price,
        quantity: schema.orderItems.quantity,
        total_price: schema.orderItems.total_price,
      }).from(schema.orderItems),
    ]);

    // Verifica divergências em order_items: total_price != unit_price × quantity
    const itemPriceDivergences = orderItems
      .filter((item) => {
        const expected = Math.round(item.unit_price * item.quantity * 100) / 100;
        return Math.abs(item.total_price - expected) > 0.01;
      })
      .map((item) => ({
        order_item_id: item.id,
        order_id: item.order_id,
        unit_price: item.unit_price,
        quantity: item.quantity,
        stored_total_price: item.total_price,
        expected_total_price: Math.round(item.unit_price * item.quantity * 100) / 100,
      }));

    // Agrupa itens por pedido para verificar total_amount
    const itemsByOrder = orderItems.reduce<Record<string, number>>((acc, item) => {
      acc[item.order_id] = (acc[item.order_id] ?? 0) + item.total_price;
      return acc;
    }, {});

    // Verifica divergências em orders: total_amount != soma dos itens
    const orderTotalDivergences = orders
      .filter((order) => {
        const expectedTotal = Math.round((itemsByOrder[order.id] ?? 0) * 100) / 100;
        return Math.abs(order.total_amount - expectedTotal) > 0.01;
      })
      .map((order) => ({
        order_id: order.id,
        stored_total_amount: order.total_amount,
        expected_total_amount: Math.round((itemsByOrder[order.id] ?? 0) * 100) / 100,
      }));

    return Response.json({
      checked_at: new Date().toISOString(),
      item_price_divergences: itemPriceDivergences,
      order_total_divergences: orderTotalDivergences,
      is_clean: itemPriceDivergences.length === 0 && orderTotalDivergences.length === 0,
    });
  } catch (e) {
    logAppError("api/admin/validate-integrity.GET", e);
    return Response.json({ error: "Erro ao validar integridade." }, { status: 500 });
  }
}
