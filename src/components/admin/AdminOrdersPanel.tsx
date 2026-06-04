"use client";

import { Fragment, useEffect, useState } from "react";
import { readStoredAdminTokens } from "@/lib/admin-bearer-storage";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";
import type { OrderStatus } from "@/db/schema";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  processing: "Em preparo",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const ALL_STATUSES: OrderStatus[] = ["pending", "confirmed", "processing", "completed", "cancelled"];

type OrderItem = {
  order_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

type OrderRow = {
  id: string;
  customer_name: string | null;
  customer_phone_country_code: string | null;
  customer_phone_number: string | null;
  status: string;
  total_amount: number;
  created_at: string;
  items: OrderItem[];
};

export function AdminOrdersPanel() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchOrders() {
      setLoading(true);
      setError(null);
      const token = readStoredAdminTokens()?.access;
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch("/api/admin/orders", { headers });
      if (!res.ok) {
        if (!cancelled) {
          setError("Erro ao carregar pedidos.");
          setLoading(false);
        }
        return;
      }
      const json = await res.json();
      if (!cancelled) {
        setOrders(json.orders ?? []);
        setLoading(false);
      }
    }

    void fetchOrders();
    return () => { cancelled = true; };
  }, []);

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    setUpdatingId(orderId);
    try {
      const token = readStoredAdminTokens()?.access;
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        toast.error("Erro ao atualizar status.");
        return;
      }
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      toast.success("Status atualizado.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Pedidos
        </h2>
        <p className="text-sm text-muted-foreground">
          Lista completa de pedidos com gestão de status.
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card h-14 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum pedido registrado ainda.</p>
      ) : (
        <div className="rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">#</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Cliente</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden sm:table-cell">Telefone</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Total</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden md:table-cell">Data</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Alterar</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <Fragment key={order.id}>
                  <tr
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      {order.customer_name ?? <span className="text-muted-foreground italic">Sem nome</span>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                      {order.customer_phone_country_code && order.customer_phone_number
                        ? `${order.customer_phone_country_code} ${order.customer_phone_number}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {order.total_amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {new Date(order.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status as OrderStatus] ?? "bg-gray-100 text-gray-800"}`}>
                        {STATUS_LABELS[order.status as OrderStatus] ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        className="text-xs rounded border bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                      >
                        {ALL_STATUSES.map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  {expandedId === order.id && order.items.length > 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-3 bg-muted/20">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Itens do pedido:</p>
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-muted-foreground">
                              <span>{item.product_name} × {item.quantity}</span>
                              <span>
                                {item.unit_price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} un.
                                {" — "}
                                {item.total_price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
