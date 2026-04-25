"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_APP_NAME = "Ferragem Pro";

export function useAppDisplayName() {
  const [appName, setAppName] = useState(FALLBACK_APP_NAME);

  useEffect(() => {
    let cancelled = false;

    async function fetchAppName() {
      const { data } = await supabase
        .from("company_settings")
        .select("company_name")
        .maybeSingle();

      const name = (data?.company_name || "").trim();
      if (!cancelled && name) {
        setAppName(name);
      }
    }

    void fetchAppName();
    return () => {
      cancelled = true;
    };
  }, []);

  return appName;
}

