import { NextResponse, type NextRequest } from "next/server";

// Canonical URLs (SEO, runbook Tahap 6), all 301:
// - www.careerchangefinder.com -> careerchangefinder.com
// - /Careers/Nurse -> /careers/nurse
// Trailing slashes are removed by Next itself (308, also permanent).
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host") ?? "";
  if (host.startsWith("www.")) {
    return NextResponse.redirect(`https://${host.slice(4)}${pathname.toLowerCase()}${search}`, 301);
  }
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
