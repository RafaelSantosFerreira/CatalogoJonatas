"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, ShoppingCart, CalendarDays, BadgeDollarSign, Package } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type OrderRow = {
  id: string;
  status: string | null;
  total_amount: number | null;
  created_at: string | null;
};

type OrderItemRow = {
  product_name: string | null;
  quantity: number | null;
};

type StatsState = {
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  avgTicket: number;
  topProducts: Array<{ name: string; quantity: number }>;
  dailyOrders: Array<{ day: string; orders: number; revenue: number }>;
};

const INITIAL_STATS: StatsState = {
  totalOrders: 0,
  todayOrders: 0,
  totalRevenue: 0,
  avgTicket: 0,
  topProducts: [],
  dailyOrders: [],
};

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function toDayKey(dateIso: string | null): string {
  if (!dateIso) return "sem_data";
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return "sem_data";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDayLabel(dayKey: string): string {
  if (dayKey === "sem_data") return "Sem data";
  const [y, m, d] = dayKey.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

const chartConfig = {
  orders: { label: "Pedidos", color: "#2563eb" },
  revenue: { label: "Faturamento", color: "#16a34a" },
  quantity: { label: "Quantidade", color: "#f59e0b" },
} satisfies ChartConfig;

const TOP_BAR_COLORS = ["#2563eb", "#7c3aed", "#16a34a", "#f59e0b", "#ef4444"];

export function AdminStatsPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsState>(INITIAL_STATS);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      setLoading(true);
      setError(null);

      const todayIso = startOfTodayIso();
      const [ordersRes, itemsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, status, total_amount, created_at")
          .order("created_at", { ascending: false })
          .returns<OrderRow[]>(),
        supabase
          .from("order_items")
          .select("product_name, quantity")
          .returns<OrderItemRow[]>(),
      ]);

      if (ordersRes.error || itemsRes.error) {
        if (!cancelled) {
          setError(ordersRes.error?.message || itemsRes.error?.message || "Erro ao carregar estatísticas.");
          setLoading(false);
        }
        return;
      }

      const orders = ordersRes.data ?? [];
      const orderItems = itemsRes.data ?? [];

      const totalOrders = orders.length;
      const todayOrders = orders.filter((o) => (o.created_at || "") >= todayIso).length;
      const totalRevenue = orders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
      const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const productMap = orderItems.reduce<Record<string, number>>((acc, item) => {
        const name = (item.product_name || "Produto sem nome").trim();
        const qty = Number(item.quantity) || 0;
        acc[name] = (acc[name] ?? 0) + qty;
        return acc;
      }, {});

      const topProducts = Object.entries(productMap)
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      const dailyMap = orders.reduce<Record<string, { orders: number; revenue: number }>>((acc, o) => {
        const day = toDayKey(o.created_at);
        if (!acc[day]) acc[day] = { orders: 0, revenue: 0 };
        acc[day].orders += 1;
        acc[day].revenue += Number(o.total_amount) || 0;
        return acc;
      }, {});

      const dailyOrders = Object.entries(dailyMap)
        .map(([day, value]) => ({ day: formatDayLabel(day), orders: value.orders, revenue: value.revenue }))
        .sort((a, b) => a.day.localeCompare(b.day))
        .slice(-14);

      if (!cancelled) {
        setStats({
          totalOrders,
          todayOrders,
          totalRevenue,
          avgTicket,
          topProducts,
          dailyOrders,
        });
        setLoading(false);
      }
    }

    void fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const topProductsChartData = useMemo(
    () =>
      stats.topProducts.map((p) => ({
        product: p.name.length > 24 ? `${p.name.slice(0, 24)}...` : p.name,
        quantity: p.quantity,
      })),
    [stats.topProducts]
  );

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Estatísticas de Pedidos Concluídos
        </h2>
        <p className="text-sm text-muted-foreground">
          Todos os pedidos finalizados são tratados como concluídos neste painel.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card h-28 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<ShoppingCart className="h-4 w-4" />}
              label="Total de pedidos"
              value={String(stats.totalOrders)}
            />
            <StatCard
              icon={<CalendarDays className="h-4 w-4" />}
              label="Pedidos hoje"
              value={String(stats.todayOrders)}
            />
            <StatCard
              icon={<BadgeDollarSign className="h-4 w-4" />}
              label="Faturamento total"
              value={stats.totalRevenue.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            />
            <StatCard
              icon={<BarChart3 className="h-4 w-4" />}
              label="Ticket médio"
              value={stats.avgTicket.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section className="rounded-xl border bg-card p-4">
              <h3 className="font-medium mb-3">Evolução diária (14 dias)</h3>
              {stats.dailyOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados para exibir.</p>
              ) : (
                <ChartContainer config={chartConfig} className="h-[260px] w-full">
                  <LineChart data={stats.dailyOrders}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={24} />
                    <YAxis
                      yAxisId="left"
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      width={28}
                    />
                    <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} width={64} />
                    <Line
                      yAxisId="left"
                      dataKey="orders"
                      type="monotone"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      dataKey="revenue"
                      type="monotone"
                      stroke="#16a34a"
                      strokeWidth={2}
                      dot={false}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) =>
                            name === "revenue"
                              ? (Number(value) || 0).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })
                              : String(value)
                          }
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </LineChart>
                </ChartContainer>
              )}
            </section>

            <section className="rounded-xl border bg-card p-4">
              <h3 className="font-medium mb-3">Faturamento diário (14 dias)</h3>
              {stats.dailyOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem pedidos para exibir.</p>
              ) : (
                <ChartContainer config={chartConfig} className="h-[260px] w-full">
                  <BarChart data={stats.dailyOrders}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={24} />
                    <YAxis tickLine={false} axisLine={false} width={72} />
                    <Bar dataKey="revenue" fill="#16a34a" radius={4} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) =>
                            (Number(value) || 0).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })
                          }
                        />
                      }
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </section>
          </div>

          <section className="rounded-xl border bg-card p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Top 5 produtos (quantidade)
            </h3>
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem itens vendidos ainda.</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <BarChart data={topProductsChartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="product"
                    width={160}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                  />
                  <Bar dataKey="quantity" radius={4}>
                    {topProductsChartData.map((item, index) => (
                      <Cell key={`${item.product}-${index}`} fill={TOP_BAR_COLORS[index % TOP_BAR_COLORS.length]} />
                    ))}
                  </Bar>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ChartContainer>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

