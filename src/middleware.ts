import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simplified middleware - no auth imports (bcrypt doesn't work in Edge runtime)
// Auth is handled in individual routes via requireAuth()
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
