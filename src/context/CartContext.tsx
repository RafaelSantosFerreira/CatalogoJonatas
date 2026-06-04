"use client";

import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useCustomer } from "./CustomerContext";
import type { CartItem, SelectedAttributes } from "@/types/cart";
import type { Product } from "@/types/product";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  total: number;
  loading: boolean;
  addItem: (product: Product, attrs?: SelectedAttributes) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { customer } = useCustomer();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const itemsRef = useRef<CartItem[]>(items);
  itemsRef.current = items;

  const fetchCart = useCallback(async (customerId: string) => {
    try {
      const res = await fetch(`/api/cart?customer_id=${customerId}`);
      const json = await res.json();
      if (json.data) setItems(json.data as CartItem[]);
    } catch {}
  }, []);

  useEffect(() => {
    if (customer?.id) fetchCart(customer.id);
    else setItems([]);
  }, [customer?.id, fetchCart]);

  const addItem = useCallback(
    async (product: Product, attrs?: SelectedAttributes) => {
      if (!customer?.id) return;
      setLoading(true);
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_id: customer.id,
            product_id: product.id,
            quantity: 1,
            unit_price: typeof product.price === "string" ? parseFloat(product.price) : (product.price ?? 0),
            selected_color_id: attrs?.color_id ?? null,
            selected_color_name: attrs?.color_name ?? null,
            selected_size_id: attrs?.size_id ?? null,
            selected_size_label: attrs?.size_label ?? null,
            selected_volume_id: attrs?.volume_id ?? null,
            selected_volume_label: attrs?.volume_label ?? null,
            product_internal_code: product.internal_code?.trim() || null,
          }),
        });
        const json = await res.json();
        if (json.data) {
          const existing = itemsRef.current.find((i) => i.id === json.data.id);
          if (existing) {
            setItems((prev) => prev.map((i) => (i.id === json.data.id ? { ...i, quantity: json.data.quantity } : i)));
          } else {
            setItems((prev) => [...prev, { ...json.data, product } as CartItem]);
          }
        }
      } catch {}
      setLoading(false);
    },
    [customer?.id]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!customer?.id) return;
      await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId }),
      });
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    },
    [customer?.id]
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (!customer?.id) return;
      if (quantity <= 0) {
        await removeItem(itemId);
        return;
      }
      await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, quantity }),
      });
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity } : i)));
    },
    [customer?.id, removeItem]
  );

  const clearCart = useCallback(async () => {
    if (!customer?.id) return;
    await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customer.id }),
    });
    setItems([]);
  }, [customer?.id]);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  const cartValue = useMemo(
    () => ({ items, itemCount, total, loading, addItem, removeItem, updateQuantity, clearCart }),
    [items, itemCount, total, loading, addItem, removeItem, updateQuantity, clearCart]
  );

  return <CartContext.Provider value={cartValue}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
