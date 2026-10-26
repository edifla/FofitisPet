import Link from "next/link";

// Área administrativa. A autorização é feita em cada página (requireAdmin), não aqui:
// um layout não re-renderiza a cada navegação e não impede os segmentos filhos de rodar.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 md:flex-row">
      <nav aria-label="Administração" className="flex gap-4 text-sm md:w-48 md:flex-col">
        <Link href="/admin" className="font-semibold">
          Painel
        </Link>
      </nav>
      <main className="flex-1">{children}</main>
    </div>
  );
}
