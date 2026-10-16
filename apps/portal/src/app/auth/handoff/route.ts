import { NextResponse, type NextRequest } from "next/server";
import { consumeSessionHandoff, createSession, setSessionCookie } from "@/lib/session";
import { formsOrigin, hostFromHeaders } from "@/lib/product";

/**
 * Finishes a handoff (PRD D22, E29 D8). The sign-in modal on the Forms host
 * posts its one-time token here, on the Sites host, and the user lands home
 * with a session. Only a form on the configured Forms origin may post, so
 * another page cannot sign a visitor into an account of its choosing, and the
 * token never sits in a URL. It works once, briefly, and only on this host.
 */
export async function POST(request: NextRequest) {
  const origin = formsOrigin();
  if (!origin || request.headers.get("origin") !== origin) {
    return new NextResponse(null, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  const token = form?.get("token");
  const handoff =
    typeof token === "string" ? await consumeSessionHandoff(token, hostFromHeaders(request.headers)) : null;
  if (!handoff) return seeOther("/login");

  const { token: sessionToken, session } = await createSession(handoff.userId, handoff.rememberMe);
  await setSessionCookie(sessionToken, session.rememberMe, session.absoluteExpiresAt);
  return seeOther("/");
}

/** Relative, like every other post-auth redirect, and never cached or referred onward. */
function seeOther(location: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: location, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
}
