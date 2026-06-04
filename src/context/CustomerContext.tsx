"use client";

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import type { Customer, CustomerFormData } from "@/types/customer";

interface CustomerContextValue {
  customer: Customer | null;
  loading: boolean;
  saveCustomer: (data: CustomerFormData) => Promise<{ error: string | null }>;
  clearCustomer: () => void;
}

const CustomerContext = createContext<CustomerContextValue | null>(null);

const STORAGE_KEY = "ferragem_customer_id";

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY);
    if (!savedId) return;
    fetch(`/api/customers?id=${savedId}`)
      .then((r) => r.json())
      .then(({ data }) => {
        if (data) setCustomer(data as Customer);
      })
      .catch(() => {});
  }, []);

  const saveCustomer = useCallback(async (data: CustomerFormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      setLoading(false);
      if (!res.ok) return { error: json.error ?? "Erro ao salvar cliente." };
      if (json.data) {
        setCustomer(json.data as Customer);
        localStorage.setItem(STORAGE_KEY, json.data.id);
      }
      return { error: null };
    } catch (e) {
      setLoading(false);
      return { error: e instanceof Error ? e.message : "Erro inesperado." };
    }
  }, []);

  const clearCustomer = useCallback(() => {
    setCustomer(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const customerValue = useMemo(
    () => ({ customer, loading, saveCustomer, clearCustomer }),
    [customer, loading, saveCustomer, clearCustomer]
  );

  return <CustomerContext.Provider value={customerValue}>{children}</CustomerContext.Provider>;
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomer must be used within CustomerProvider");
  return ctx;
}
