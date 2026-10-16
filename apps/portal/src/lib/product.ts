import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getAccountEntitlements,
  type AccountEntitlements,
} from "@/lib/data-access/entitlements";

export type Product = "forms" | "sites";

/**
 * Where "home" is for a signed-in account. The account's products decide
 * this, never the hostname: a Sites account lands on the editor from either
 * host. Use this for redirects and home links instead of hardcoding a path.
 */
export async function getHomePath(accountId: string): Promise<string> {
  return homePathFor(await getAccountEntitlements(accountId));
}

/** `getHomePath` for callers that already hold the entitlements. */
export function homePathFor({ sitesEnabled }: Pick<AccountEntitlements, "sitesEnabled">): string {
  return sitesEnabled ? "/editor" : "/forms";
}

/**
 * Public base URL for links emailed to an account: `SITES_URL` for Sites
 * accounts when it is set, otherwise `NEXTAUTH_URL` (the Forms host). Never
 * built from request headers, which the client controls; a reset link built
 * from `Host` would let anyone send a victim's token to their own domain.
 */
export function appUrlFor({ sitesEnabled }: Pick<AccountEntitlements, "sitesEnabled">): string {
  const sitesUrl = sitesEnabled ? process.env.SITES_URL : undefined;
  return (sitesUrl || process.env.NEXTAUTH_URL || "http://localhost:3006").replace(/\/$/, "");
}

/** Product name for copy addressed to an account, such as email subjects and footers. */
export function productNameFor({ sitesEnabled }: Pick<AccountEntitlements, "sitesEnabled">): string {
  return sitesEnabled ? "Canopy Sites" : "Canopy Forms";
}

/** The host the browser asked for (X-Forwarded-Host behind the proxy), lowercased, with any port. */
async function requestHost(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim().toLowerCase();
}

/**
 * The product a request's hostname brands: `sites` for `sites.*` and
 * `sites-*.*` (sites.canopyds.com, sites-dev.canopyds.com, sites.localhost),
 * `forms` for everything else. Only logged-out pages use this. It is
 * branding, not access control.
 */
export async function getHostProduct(): Promise<Product> {
  return /^sites(-[a-z0-9-]+)?\./.test(await requestHost()) ? "sites" : "forms";
}

function hostOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

/** The configured Forms and Sites hosts, or null when the environment has one host (SITES_URL unset or the same). */
function productHosts(): { forms: string; sites: string } | null {
  const forms = hostOf(process.env.NEXTAUTH_URL);
  const sites = hostOf(process.env.SITES_URL);
  return forms && sites && forms !== sites ? { forms, sites } : null;
}

/**
 * Every account has a home host, the one its emails use (`appUrlFor`):
 * Sites accounts live on SITES_URL, every other account on NEXTAUTH_URL
 * (PRD D22). For a signed-in account on the other product's host this
 * returns the home base URL to send it to, otherwise null. Only the two
 * configured hosts route, and the destination comes from configuration,
 * never from the request.
 */
export function homeHostRedirect(
  entitlements: Pick<AccountEntitlements, "sitesEnabled">,
  host: string
): string | null {
  const hosts = productHosts();
  if (!hosts) return null;
  const away = entitlements.sitesEnabled ? hosts.forms : hosts.sites;
  return host === away ? appUrlFor(entitlements) : null;
}

/** For signed-in pages: redirect an account on the other product's host to its home host. */
export async function requireHomeHost(entitlements: Pick<AccountEntitlements, "sitesEnabled">): Promise<void> {
  const home = homeHostRedirect(entitlements, await requestHost());
  if (home) redirect(`${home}/`);
}

/** Where sign-in should send this account instead, when the request is on its other product's host; else null. */
export async function signInElsewhere(
  entitlements: Pick<AccountEntitlements, "sitesEnabled">
): Promise<string | null> {
  return homeHostRedirect(entitlements, await requestHost());
}

/**
 * Signup makes a Forms account, so it lives on the Forms host. Returns the
 * Forms signup URL when the request is on the Sites host, else null. Sites
 * accounts are set up by an operator.
 */
export function signupHostRedirect(host: string): string | null {
  const hosts = productHosts();
  return hosts && host === hosts.sites ? `${appUrlFor({ sitesEnabled: false })}/signup` : null;
}

/** `signupHostRedirect` for the current request. */
export async function signupElsewhere(): Promise<string | null> {
  return signupHostRedirect(await requestHost());
}
