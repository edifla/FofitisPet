import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Checagem otimista, só com o cookie da sessão: evita renderizar páginas protegidas para quem
// não está logado. A checagem que vale é a do lib/dal.ts, feita em cada página e Server Action.
export default auth((request) => {
  const { pathname } = request.nextUrl;
  const user = request.auth?.user;

  if (!user) {
    const login = new URL("/entrar", request.nextUrl);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/admin") && user.role !== "ADMIN") {
    return NextResponse.rewrite(new URL("/404", request.nextUrl), { status: 404 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/conta/:path*", "/admin/:path*", "/checkout/:path*", "/checkout"],
};
