import { Suspense } from "react";
import { AdminNav, AdminNavLinks } from "@/components/admin/admin-nav";

// Área administrativa: menu lateral fixo e conteúdo ocupando toda a largura da tela. A autorização
// é feita em cada página (requireAdmin), não aqui: um layout não re-renderiza a cada navegação e
// não impede os segmentos filhos de rodar.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50/70 lg:flex-row dark:bg-transparent">
      <aside className="border-b border-zinc-200 bg-surface px-3 py-4 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0 lg:py-6 dark:border-zinc-800">
        <details className="group lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-3 py-2 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800">
            Menu da administração
            <span aria-hidden className="text-zinc-500 group-open:rotate-180">
              ▾
            </span>
          </summary>
          <div className="pt-3">
            <Suspense fallback={<AdminNavLinks pathname={null} label="Administração (celular)" />}>
              <AdminNav label="Administração (celular)" />
            </Suspense>
          </div>
        </details>
        <div className="hidden lg:block">
          <Suspense fallback={<AdminNavLinks pathname={null} label="Administração" />}>
            <AdminNav label="Administração" />
          </Suspense>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-8 md:px-8 lg:px-10">{children}</main>
    </div>
  );
}
