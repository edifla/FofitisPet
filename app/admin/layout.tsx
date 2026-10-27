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
        <Link href="/admin/produtos">Produtos</Link>
        <Link href="/admin/categorias">Categorias</Link>
        <Link href="/admin/marcas">Marcas</Link>
        <Link href="/admin/estoque">Estoque</Link>
        <Link href="/admin/abrigo">Abrigo</Link>
        <Link href="/admin/campanhas">Campanhas</Link>
        <Link href="/admin/kits">Kits</Link>
        <Link href="/admin/transparencia">Transparência</Link>
        <Link href="/admin/metricas">Métricas</Link>
        <Link href="/admin/erros">Erros</Link>
        <Link href="/admin/design">Design</Link>
        <Link href="/admin/animais">Animais</Link>
        <Link href="/admin/adocoes">Adoções</Link>
      </nav>
      <main className="flex-1">{children}</main>
    </div>
  );
}
