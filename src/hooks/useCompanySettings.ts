"use client";

import { useState, useEffect, useCallback } from "react";
import { readStoredAdminTokens } from "@/lib/admin-bearer-storage";
import { withTimeout } from "@/lib/with-timeout";
import type { CompanySettings, CompanySettingsFormData } from "@/types/company-settings";

async function getAuthHeader(): Promise<HeadersInit> {
  const token = readStoredAdminTokens()?.access;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useCompanySettings() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await withTimeout(fetch("/api/company-settings"), 20_000);
      if (!res) return;
      const json = await res.json();
      if (json?.data) setSettings(json.data as CompanySettings);
    } catch {
      /* rede */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = useCallback(
    async (form: CompanySettingsFormData): Promise<{ error: string | null }> => {
      setSaving(true);
      try {
        const headers = await getAuthHeader();
        const res = await fetch("/api/company-settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify(form),
        });
        const json = await res.json();
        setSaving(false);
        if (!res.ok) return { error: json.error ?? "Erro ao salvar." };
        if (json.data) setSettings(json.data as CompanySettings);
        return { error: null };
      } catch (e) {
        setSaving(false);
        return { error: e instanceof Error ? e.message : "Erro inesperado." };
      }
    },
    []
  );

  return { settings, loading, saving, saveSettings, refetch: fetchSettings };
}
