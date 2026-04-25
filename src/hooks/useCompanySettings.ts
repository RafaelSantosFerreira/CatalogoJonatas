
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CompanySettings, CompanySettingsFormData } from "@/types/company-settings";

export function useCompanySettings() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("company_settings")
      .select("*")
      .maybeSingle();
    if (data) setSettings(data as CompanySettings);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = useCallback(
    async (form: CompanySettingsFormData): Promise<{ error: string | null }> => {
      setSaving(true);
      let result;
      if (settings?.id) {
        result = await supabase
          .from("company_settings")
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq("id", settings.id)
          .select("*")
          .maybeSingle();
      } else {
        result = await supabase
          .from("company_settings")
          .insert({ ...form })
          .select("*")
          .maybeSingle();
      }
      setSaving(false);
      if (result.error) return { error: result.error.message };
      if (result.data) setSettings(result.data as CompanySettings);
      return { error: null };
    },
    [settings?.id]
  );

  return { settings, loading, saving, saveSettings, refetch: fetchSettings };
}
