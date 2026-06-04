"use client";

import { useEffect, useState } from "react";

const FALLBACK_APP_NAME = "Ferragem Pro";

export function useAppDisplayName() {
  const [appName, setAppName] = useState(FALLBACK_APP_NAME);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/company-settings")
      .then((r) => r.json())
      .then(({ data }) => {
        const name = (data?.company_name || "").trim();
        if (!cancelled && name) setAppName(name);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return appName;
}
