"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Conta a visualização de cada página (KAN-51), inclusive nas navegações sem recarregar.
export function PageViews() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    const body = new Blob([pathname], { type: "text/plain" });
    if (!navigator.sendBeacon?.("/api/metricas", body)) {
      fetch("/api/metricas", { method: "POST", body, keepalive: true }).catch(() => {});
    }
  }, [pathname]);
  return null;
}
