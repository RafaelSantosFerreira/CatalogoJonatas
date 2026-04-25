"use client";

import { useZoerIframe } from "@/hooks/useZoerIframe";
import GlobalErrorCapture from "@/components/GlobalErrorCapture";

export default function GlobalClientEffects() {
  useZoerIframe();
  return <GlobalErrorCapture />;
}

