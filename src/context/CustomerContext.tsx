
"use client";

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
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
    supabase.from("customers").select("*").eq("id", savedId).maybeSingle().then(({ data }) => {
      if (data) setCustomer(data as Customer);
    });
  }, []);

  const saveCustomer = useCallback(async (data: CustomerFormData) => {
    setLoading(true);
    const { data: created, error } = await supabase
      .from("customers")
      .insert({
        full_name: data.full_name,
        phone_country_code: data.phone_country_code,
        phone_number: data.phone_number,
      })
      .select("*")
      .maybeSingle();

    setLoading(false);
    if (error) return { error: error.message };
    if (created) {
      setCustomer(created as Customer);
      localStorage.setItem(STORAGE_KEY, created.id);
    }
    return { error: null };
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
