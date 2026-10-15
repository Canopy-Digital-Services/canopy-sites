import { headers } from "next/headers";
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
 * The product a request's hostname brands: `sites` for `sites.*` and
 * `sites-*.*` (sites.canopyds.com, sites-dev.canopyds.com, sites.localhost),
 * `forms` for everything else. Only logged-out pages use this. It is
 * branding, not access control.
 */
export async function getHostProduct(): Promise<Product> {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  return /^sites(-[a-z0-9-]+)?\./.test(host) ? "sites" : "forms";
}
