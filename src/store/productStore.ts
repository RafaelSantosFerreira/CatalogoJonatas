
"use client";

import { useCallback, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { readStoredAdminTokens } from "@/lib/admin-bearer-storage";
import { createTraceId, logAppError, logAppInfo } from "@/lib/app-logger";
import type { Product, ProductFormData } from "@/types/product";

type Snap = { products: Product[]; loading: boolean };

let snap: Snap = { products: [], loading: false };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Snap {
  return snap;
}

/** Snapshot fixo no SSR (evita mismatch com `useSyncExternalStore`). */
function getServerSnapshot(): Snap {
  return { products: [], loading: false };
}

function setSnap(next: Snap) {
  snap = next;
  emit();
}

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) return data.session.access_token;
  return readStoredAdminTokens()?.access ?? null;
}

async function adminFetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new Error("Sessão expirada. Faça login novamente.");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(path, { ...init, headers });
  const raw = await res.text();
  let json: Record<string, unknown> = {};
  if (raw.trim()) {
    try {
      json = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new Error(raw.slice(0, 200) || `HTTP ${res.status}`);
    }
  }
  if (!res.ok) {
    const err = typeof json.error === "string" ? json.error : `Falha HTTP ${res.status}`;
    throw new Error(err);
  }
  return json as T;
}

async function adminFetchDelete(path: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error("Sessão expirada. Faça login novamente.");
  const res = await fetch(path, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 204) return;
  const raw = await res.text();
  let msg = `Falha HTTP ${res.status}`;
  if (raw.trim()) {
    try {
      const j = JSON.parse(raw) as { error?: string };
      if (j.error) msg = j.error;
    } catch {
      msg = raw.slice(0, 200);
    }
  }
  throw new Error(msg);
}

/**
 * Estado compartilhado entre catálogo e admin (um único snap; antes cada `useProductStore()` tinha `useState` próprio).
 */
export function useProductStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const fetchProducts = useCallback(async (mode: "catalog" | "admin" = "catalog") => {
    setSnap({ ...getSnapshot(), loading: true });
    try {
      if (mode === "admin") {
        const json = await adminFetchJson<{ products: Product[] }>("/api/admin/products", { method: "GET" });
        setSnap({ products: json.products ?? [], loading: false });
      } else {
        const res = await fetch("/api/catalog/products", { cache: "no-store" });
        const raw = await res.text();
        let json: { products?: Product[]; error?: string } = {};
        if (raw.trim()) {
          try {
            json = JSON.parse(raw) as { products?: Product[]; error?: string };
          } catch {
            logAppError("productStore.fetchProducts.catalog.parse", new Error(raw.slice(0, 200)));
            setSnap({ products: [], loading: false });
            return;
          }
        }
        if (!res.ok) {
          logAppError("productStore.fetchProducts.catalog", new Error(json.error || `HTTP ${res.status}`));
          setSnap({ products: [], loading: false });
          return;
        }
        setSnap({ products: json.products ?? [], loading: false });
      }
    } catch (e) {
      logAppError("productStore.fetchProducts", e);
      setSnap({ products: [], loading: false });
    }
  }, []);

  const createProduct = useCallback(async (data: ProductFormData) => {
    const traceId = createTraceId("product_create");
    logAppInfo("product.create.start", "Iniciando cadastro de produto", {
      traceId,
      name: data.name,
      hasImage: Boolean(data.image_url),
    });
    try {
      const json = await adminFetchJson<{ product: Product }>("/api/admin/products", {
        method: "POST",
        body: JSON.stringify(data),
      });
      const cur = getSnapshot();
      setSnap({ products: [json.product, ...cur.products], loading: cur.loading });
      logAppInfo("product.create.success", "Produto cadastrado com sucesso", {
        traceId,
        productId: json.product.id,
      });
    } catch (e) {
      logAppError("product.create.failed", e, {
        traceId,
        name: data.name,
        category: data.category || null,
      });
      throw e;
    }
  }, []);

  const updateProduct = useCallback(async (id: string, data: ProductFormData) => {
    const traceId = createTraceId("product_update");
    try {
      const json = await adminFetchJson<{ product: Product }>(`/api/admin/products/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      const cur = getSnapshot();
      setSnap({
        products: cur.products.map((p) => (p.id === id ? json.product : p)),
        loading: cur.loading,
      });
      logAppInfo("product.update.success", "Produto atualizado", { traceId, productId: id });
    } catch (e) {
      logAppError("product.update.failed", e, { traceId, productId: id, name: data.name });
      throw e;
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    await adminFetchDelete(`/api/admin/products/${encodeURIComponent(id)}`);
    const cur = getSnapshot();
    setSnap({
      products: cur.products.filter((p) => p.id !== id),
      loading: cur.loading,
    });
  }, []);

  return {
    products: state.products,
    loading: state.loading,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
