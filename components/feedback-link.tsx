"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Link "Enviar feedback" do rodapé (KAN-52): leva a página atual para o formulário.
export function FeedbackLink() {
  const pathname = usePathname();
  const from = pathname && pathname !== "/feedback" ? `?de=${encodeURIComponent(pathname)}` : "";
  return <Link href={`/feedback${from}`}>Enviar feedback</Link>;
}
