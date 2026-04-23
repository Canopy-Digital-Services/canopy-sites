/**
 * Maps an admin app route to the most relevant doc slug. Drives the floating
 * HelpBubble — click behaviour depends on where you are in the app.
 *
 * Return an empty string to hide the bubble on the current route.
 */
export function getHelpHref(pathname: string, search?: string): string {
  if (!pathname) return "/docs";
  if (pathname.startsWith("/docs")) return "";

  if (pathname === "/login" ||
      pathname === "/signup" ||
      pathname === "/forgot-password" ||
      pathname === "/reset-password") {
    return "";
  }

  const searchParams = new URLSearchParams(search ?? "");

  if (pathname.startsWith("/forms/")) {
    if (pathname.endsWith("/submissions") || pathname.includes("/submissions/")) {
      return "/docs/submissions";
    }
    const mode = searchParams.get("mode");
    if (mode === "publish") return "/docs/publishing";
    if (mode === "submissions") return "/docs/submissions";
    return "/docs/forms";
  }

  if (pathname === "/forms") return "/docs/forms";
  if (pathname.startsWith("/account")) return "/docs/account";

  return "/docs";
}
