import { NextResponse, type NextRequest } from "next/server";

// Lowercase URLs (SEO): /Careers/Nurse -> /careers/nurse (301). Trailing slashes are removed by Next.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname !== pathname.toLowerCase()) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.toLowerCase();
    url.search = search;
    return NextResponse.redirect(url, 301);
  }
  return NextResponse.next();
}

export const config = {
  // skip static files, Next internals and Keystatic (its routes can contain capital letters)
  matcher: ["/((?!_next/|keystatic|api/keystatic|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};
