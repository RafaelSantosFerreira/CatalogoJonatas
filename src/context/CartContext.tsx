
"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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

  const fetchCart = useCallback(async (customerId: string) => {
    const { data } = await supabase
      .from("cart_items")
      .select("*")
      .eq("customer_id", customerId);
    if (!data) return;

    const enriched = await Promise.all(
      data.map(async (item) => {
        const { data: product } = await supabase
          .from("products")
          .select("*")
          .eq("id", item.product_id)
          .maybeSingle();
        return { ...item, product: product ?? undefined } as CartItem;
      })
    );
    setItems(enriched);
  }, []);

  useEffect(() => {
    if (customer?.id) fetchCart(customer.id);
    else setItems([]);
  }, [customer?.id, fetchCart]);

  const addItem = useCallback(
    async (product: Product, attrs?: SelectedAttributes) => {
      if (!customer?.id) return;
      setLoading(true);

      const colorId = attrs?.color_id ?? null;
      const sizeId = attrs?.size_id ?? null;
      const volumeId = attrs?.volume_id ?? null;

      const existing = items.find(
        (i) =>
          i.product_id === product.id &&
          (i.selected_color_id ?? null) === colorId &&
          (i.selected_size_id ?? null) === sizeId &&
          (i.selected_volume_id ?? null) === volumeId
      );

      if (existing) {
        await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + 1, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        setItems((prev) =>
          prev.map((i) =>
            i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i
          )
        );
      } else {
        const { data } = await supabase
          .from("cart_items")
          .insert({
            customer_id: customer.id,
            product_id: product.id,
            quantity: 1,
            unit_price: product.price ?? 0,
            selected_color_id: colorId,
            selected_color_name: attrs?.color_name ?? null,
            selected_size_id: sizeId,
            selected_size_label: attrs?.size_label ?? null,
            selected_volume_id: volumeId,
            selected_volume_label: attrs?.volume_label ?? null,
          })
          .select("*")
          .maybeSingle();
        if (data) setItems((prev) => [...prev, { ...data, product } as CartItem]);
      }
      setLoading(false);
    },
    [customer?.id, items]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!customer?.id) return;
      await supabase.from("cart_items").delete().eq("id", itemId);
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
      await supabase
        .from("cart_items")
        .update({ quantity, updated_at: new Date().toISOString() })
        .eq("id", itemId);
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
      );
    },
    [customer?.id, removeItem]
  );

  const clearCart = useCallback(async () => {
    if (!customer?.id) return;
    await supabase.from("cart_items").delete().eq("customer_id", customer.id);
    setItems([]);
  }, [customer?.id]);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, itemCount, total, loading, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
