import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Proxy handles legacy /sites/* URL redirects to new /forms/* routes
// Auth is handled in individual routes via requireAuth()
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/sites")) {
    return NextResponse.next();
  }

  const parts = pathname.split("/").filter(Boolean);
  const siteId = parts[1];

  if (parts.length === 1) {
    return NextResponse.redirect(new URL("/forms", request.url));
  }

  if (!siteId) {
    return NextResponse.next();
  }

  if (parts.length === 2) {
    const url = new URL("/forms", request.url);
    url.searchParams.set("site", siteId);
    return NextResponse.redirect(url);
  }

  if (parts[2] === "new") {
    return NextResponse.redirect(new URL("/settings/sites", request.url));
  }

  if (parts[2] === "edit") {
    return NextResponse.redirect(new URL("/settings/sites", request.url));
  }

  if (parts[2] !== "forms") {
    return NextResponse.next();
  }

  const formId = parts[3];

  if (!formId || formId === "new") {
    const url = new URL("/forms", request.url);
    url.searchParams.set("site", siteId);
    return NextResponse.redirect(url);
  }

  if (parts.length === 4) {
    return NextResponse.redirect(new URL(`/forms/${formId}/edit`, request.url));
  }

  const action = parts[4];

  if (action === "edit") {
    return NextResponse.redirect(new URL(`/forms/${formId}/edit`, request.url));
  }

  if (action === "integrate") {
    const url = new URL(`/forms/${formId}/edit`, request.url);
    url.searchParams.set("panel", "integrate");
    return NextResponse.redirect(url);
  }

  if (action === "submissions") {
    if (parts.length === 5) {
      return NextResponse.redirect(
        new URL(`/forms/${formId}/submissions`, request.url)
      );
    }

    const target = parts[5];
    if (target) {
      return NextResponse.redirect(
        new URL(`/forms/${formId}/submissions/${target}`, request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|embed.js).*)"],
};
